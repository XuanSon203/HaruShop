const mongoose = require("mongoose");
const Order = require("../../model/OrderModel");
const Customer = require("../../model/AddressModel");
const User = require("../../model/UserModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const Cart = require("../../model/CartModel");
const Payment = require("../../model/PaymentMethodModel");
const Category = require("../../model/CategoryModel");
const {
  pushUserNotification,
  pushAdminNotification,
  shortOrderCode,
} = require("../../helpers/notificationHelper");

// --- Simple Server-Sent Events broadcaster for order changes ---
const sseClients = [];
function broadcastOrderChange(payload = { type: "order_changed" }) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(data);
    } catch (_) {}
  });
}

// GET /orders/stream - live update stream (SSE)
module.exports.stream = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  // Initial keepalive
  res.write(`retry: 3000\n`);
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  sseClients.push(res);
  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
};
module.exports.index = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser; // lấy token từ cookie
    const { user_id, page = 1, limit = 5, status } = req.query;

    let query = { deleted: false };
    let currentUserId = null;

    // Nếu có tokenUser (user đã đăng nhập), tìm user từ token
    if (tokenUser) {
      try {
        const user = await User.findOne({
          tokenUser: tokenUser,
          deleted: false,
        });
        if (user) {
          currentUserId = user._id;
          query.user_id = currentUserId;
        } else {
          return res.status(401).json({
            success: false,
            message: "Token không hợp lệ, vui lòng đăng nhập lại",
          });
        }
      } catch (userError) {
        console.error("Lỗi khi tìm user từ token:", userError);
        return res.status(500).json({
          success: false,
          message: "Lỗi server khi xác thực user",
        });
      }
    } else if (user_id) {
      // Chỉ dùng user_id từ query khi không có tokenUser (dành cho admin hoặc API khác)
      query.user_id = user_id;
      currentUserId = user_id;
    } else {
      // Nếu không có tokenUser và không có user_id, trả về lỗi
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để xem đơn hàng",
      });
    }

    if (status) {
      // Nếu filter là "shipping", cũng lấy cả "shipped" vì chỉ có 1 tab "Đang giao"
      if (status === "shipping") {
        query.status = { $in: ["shipping", "shipped"] };
      } else {
        query.status = status.includes(",") ? { $in: status.split(",") } : status;
      }
    }

    // Phân trang an toàn
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 5));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    // Lấy thống kê số lượng đơn hàng theo từng trạng thái
    const baseQuery = { ...query };
    delete baseQuery.status; // Xóa status filter để lấy tất cả
    
    // Lấy tất cả đơn hàng để kiểm tra điều kiện
    const allOrders = await Order.find(baseQuery)
      .select("status updatedBy updatedAt return_request products")
      .lean();

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 ngày trước

    // Khởi tạo stats
    const stats = {
      all: totalOrders,
      pending: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
      returned: 0,
    };

    // Đếm từng trạng thái với điều kiện
    for (const order of allOrders) {
      if (order.status === "pending") {
        stats.pending++;
      } else if (order.status === "shipping" || order.status === "shipped") {
        // Gộp "shipped" vào "shipping" vì chỉ có 1 tab "Đang giao"
        stats.shipping++;
      } else if (order.status === "cancelled") {
        stats.cancelled++;
      } else if (order.status === "completed") {
        // Kiểm tra điều kiện cho đơn completed
        let shouldCount = false;
        
        // 1. Kiểm tra thời gian: chưa quá 3 ngày kể từ khi hoàn thành
        let completedDate = null;
        if (order.updatedBy && order.updatedBy.length > 0) {
          const lastUpdate = order.updatedBy[order.updatedBy.length - 1];
          completedDate = new Date(lastUpdate.updatedAt);
        } else if (order.updatedAt) {
          completedDate = new Date(order.updatedAt);
        }
        
        if (completedDate && completedDate > threeDaysAgo) {
          // 2. Kiểm tra xem tất cả sản phẩm đã được đánh giá chưa
          if (currentUserId && order.products && order.products.length > 0) {
            // Batch query tất cả sản phẩm
            const productIds = order.products.map(p => p.product_id);
            const [foodProducts, accessoryProducts] = await Promise.all([
              Food.find({ _id: { $in: productIds } }).select("_id rated_by").lean(),
              Accessory.find({ _id: { $in: productIds } }).select("_id rated_by").lean()
            ]);
            
            // Tạo map để tra cứu nhanh
            const productMap = new Map();
            foodProducts.forEach(p => productMap.set(String(p._id), p));
            accessoryProducts.forEach(p => productMap.set(String(p._id), p));
            
            let allRated = true;
            for (const product of order.products) {
              const productDoc = productMap.get(String(product.product_id));
              if (productDoc) {
                const isRated = Array.isArray(productDoc.rated_by)
                  ? productDoc.rated_by.some((u) => String(u) === String(currentUserId))
                  : false;
                if (!isRated) {
                  allRated = false;
                  break;
                }
              } else {
                allRated = false; // Không tìm thấy sản phẩm, coi như chưa đánh giá
                break;
              }
            }
            // Chỉ đếm nếu chưa đánh giá hết
            shouldCount = !allRated;
          } else {
            // Nếu không có user hoặc không có sản phẩm, đếm bình thường
            shouldCount = true;
          }
        }
        
        if (shouldCount) {
          stats.completed++;
        }
      } else if (order.status === "returned") {
        // Kiểm tra điều kiện cho đơn returned: chưa quá 3 ngày kể từ khi yêu cầu hoàn hàng
        let shouldCount = false;
        
        if (order.return_request && order.return_request.requested_at) {
          const requestedDate = new Date(order.return_request.requested_at);
          if (requestedDate > threeDaysAgo) {
            shouldCount = true;
          }
        } else {
          // Nếu không có requested_at, đếm bình thường (fallback)
          shouldCount = true;
        }
        
        if (shouldCount) {
          stats.returned++;
        }
      }
    }

    const orders = await Order.find(query)
      .populate("user_id", "fullName email phone")
      .populate("customer_info", "fullName phone address")
      .populate("payment_id", "name description image status")
      .populate("shipping_id", "name price estimated_delivery_time")
      .populate("products.category_id", "name type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const plainOrders = orders.map((order) => order.toObject());

    for (let order of plainOrders) {
      for (let i = 0; i < order.products.length; i++) {
        const product = order.products[i];
        try {
          const foodProduct = await Food.findById(product.product_id).select(
            "name thumbnail images rated_by"
          );
          if (foodProduct) {
            order.products[i].product_info = {
              name: foodProduct.name,
              thumbnail: foodProduct.thumbnail,
              images: foodProduct.images,
              type: "food",
            };
            // Kiểm tra user đã đánh giá sản phẩm này chưa
            order.products[i].alreadyRated = currentUserId && Array.isArray(foodProduct.rated_by)
              ? foodProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
          } else {
            const accessoryProduct = await Accessory.findById(
              product.product_id
            ).select("name thumbnail images rated_by");
            if (accessoryProduct) {
              order.products[i].product_info = {
                name: accessoryProduct.name,
                thumbnail: accessoryProduct.thumbnail,
                images: accessoryProduct.images,
                type: "accessory",
              };
            // Kiểm tra user đã đánh giá sản phẩm này chưa
            order.products[i].alreadyRated = currentUserId && Array.isArray(
              accessoryProduct.rated_by
            )
              ? accessoryProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
            } else {
              // Nếu không tìm thấy sản phẩm, set alreadyRated = false
              order.products[i].alreadyRated = false;
            }
          }
        } catch (error) {
          console.error(
            `Error populating product ${product.product_id}:`,
            error
          );
          // Nếu có lỗi, set alreadyRated = false để tránh lỗi
          order.products[i].alreadyRated = false;
        }
      }
    }

    return res.json({
      success: true,
      orders: plainOrders,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      stats, // Thêm thống kê vào response
    });
  } catch (err) {
    console.error("Order index error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports.add = async (req, res) => {
  try {
    const body = req.body || {};

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu sản phẩm trong đơn" });
    }
    if (!body.summary || typeof body.summary.total !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu tổng tiền" });
    }

    const hasAddress =
      (body.customer_id && body.customer_id !== "null" && body.customer_id !== "undefined") ||
      (body.customer_info &&
        (body.customer_info.address ||
          body.customer_info.fullName ||
          body.customer_info.phone));
    if (!hasAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn địa chỉ giao hàng trước khi đặt hàng",
      });
    }

    // compute subtotal from body if provided; fallback to sum of products
    const computedSubtotal = Array.isArray(body.products)
      ? body.products.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      : 0;
    const subtotal = Number(body.summary?.subtotal ?? computedSubtotal);
    const shippingFee = Number(body.summary?.shipping_fee || 0);
    const voucherDiscount = Number(body.summary?.voucher_discount || 0);
    
    const totalAfterDiscount = Math.max(
      0,
      subtotal - voucherDiscount + shippingFee
    );

    // Determine shipping_id (prefer from body, otherwise derive from first product)
    let shippingId = body.shipping_id || null;
    if (!shippingId) {
      try {
        const firstProduct = Array.isArray(body.products) && body.products.length > 0 ? body.products[0] : null;
        if (firstProduct) {
          const Category = require("../../model/CategoryModel");
          const category = await Category.findById(firstProduct.category_id).select("type");
          let prodDoc = null;
          if (category && category.type === "food") {
            prodDoc = await Food.findById(firstProduct.product_id).select("shipping_id");
          } else if (category && category.type === "accessory") {
            prodDoc = await Accessory.findById(firstProduct.product_id).select("shipping_id");
          } else {
            // fallback: try both
            prodDoc = await Food.findById(firstProduct.product_id).select("shipping_id");
            if (!prodDoc) {
              prodDoc = await Accessory.findById(firstProduct.product_id).select("shipping_id");
            }
          }
          if (prodDoc && prodDoc.shipping_id) {
            shippingId = prodDoc.shipping_id;
          }
        }
      } catch (e) {
        console.error("Auto-derive shipping_id failed:", e);
      }
    }

    if (!shippingId) {
      return res.status(400).json({ success: false, message: "Thiếu shipping_id cho đơn hàng" });
    }

    // Tìm payment_id từ payment_method (slug hoặc _id)
    let paymentId = null;
    if (body.payment_method && body.payment_method !== "cod") {
      try {
        // Thử tìm theo _id trước (ObjectId)
        let paymentMethod = null;
        if (mongoose.Types.ObjectId.isValid(body.payment_method)) {
          paymentMethod = await Payment.findOne({
            _id: body.payment_method,
            status: true,
            deleted: false
          }).select("_id");
        }
        
        // Nếu không tìm thấy, thử tìm theo slug
        if (!paymentMethod) {
          paymentMethod = await Payment.findOne({
            slug: body.payment_method,
            status: true,
            deleted: false
          }).select("_id");
        }
        
        if (paymentMethod) {
          paymentId = paymentMethod._id;
        }
      } catch (paymentError) {
        console.error("Error finding payment method:", paymentError);
        // Không throw error, chỉ log
      }
    }

    const orderDoc = new Order({
      user_id: body.user_id || null,
      cart_id: body.cart_id || null,
      payment_id: paymentId || null,
      // optional: nếu có sẵn customer id ở FE thì truyền vào trường customer_info
      customer_info: body.customer_id || body.customer_info || null,
      note: body.note || "",
      shipping_id: shippingId,
      products: (body.products || []).map((p) => ({
        product_id: p.product_id,
        category_id: p.category_id,
        quantity: Number(p.quantity || 0),
        price: Number(p.price || 0),
        amount: Number(p.amount || 0),
        discount: Number(p.discount || 0),
      })),
      summary: {
        subtotal: subtotal,
        voucher_discount: voucherDiscount,
        shipping_fee: shippingFee,
        total: totalAfterDiscount,
      },
      status: "pending",
    });

    await orderDoc.save();

    if (orderDoc.user_id) {
      await pushUserNotification({
        userId: orderDoc.user_id,
        title: `Đơn hàng mới ${shortOrderCode(orderDoc._id)}`,
        message: "Đơn hàng của bạn đã được tạo và đang chờ xác nhận.",
        type: "order",
        level: "info",
        orderId: orderDoc._id,
        meta: {
          status: "pending",
        },
      });
    }

    await pushAdminNotification({
      title: `Khách vừa đặt hàng ${shortOrderCode(orderDoc._id)}`,
      message: `Tổng giá trị: ${Number(orderDoc.summary?.total || 0).toLocaleString(
        "vi-VN"
      )}₫`,
      type: "order",
      level: "warning",
      orderId: orderDoc._id,
      meta: {
        customer: orderDoc.customer_info || null,
      },
    });

    // Sau khi tạo order thành công, thực hiện các tác vụ sau:

    // 1. Xóa giỏ hàng nếu có cart_id
    if (body.cart_id) {
      try {
        await Cart.findByIdAndDelete(body.cart_id);
      } catch (cartError) {
        console.error("Lỗi khi xóa giỏ hàng:", cartError);
        // Không throw error vì order đã được tạo thành công
      }
    }

    // 2. Cập nhật sold_count cho từng sản phẩm dựa trên category_id
    for (const product of body.products) {
      try {
        const { product_id, quantity, category_id } = product;

        // Lấy thông tin category để xác định loại sản phẩm
        const Category = require("../../model/CategoryModel");
        const category = await Category.findById(category_id);

        if (category && category.type === "food") {
          await Food.findByIdAndUpdate(
            product_id,
            { $inc: { sold_count: quantity } },
            { new: true }
          );
        } else if (category && category.type === "accessory") {
          await Accessory.findByIdAndUpdate(
            product_id,
            { $inc: { sold_count: quantity } },
            { new: true }
          );
        }
      } catch (productError) {
        console.error(
          `Lỗi khi cập nhật sold_count cho sản phẩm ${product.product_id}:`,
          productError
        );
        // Không throw error vì order đã được tạo thành công
      }
    }

    // phát sự kiện thay đổi đơn hàng
    broadcastOrderChange({ type: "created", order_id: orderDoc._id });
    return res.status(201).json({ success: true, order: orderDoc });
  } catch (err) {
    console.error("Order add error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo đơn" });
  }
};

// Hủy đơn hàng
module.exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID đơn hàng",
      });
    }

    // Tìm đơn hàng
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Chỉ cho phép hủy đơn hàng đang pending
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy đơn hàng đang chờ xử lý",
      });
    }

    // Cập nhật trạng thái thành cancelled
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    // Hoàn lại sold_count cho từng sản phẩm trong đơn hàng bị hủy
    for (const product of order.products) {
      try {
        const { product_id, quantity, category_id } = product;

        // Lấy thông tin category để xác định loại sản phẩm
        const Category = require("../../model/CategoryModel");
        const category = await Category.findById(category_id);

        if (category && category.type === "food") {
          await Food.findByIdAndUpdate(
            product_id,
            { $inc: { sold_count: -quantity } }, // Giảm sold_count
            { new: true }
          );
        } else if (category && category.type === "accessory") {
          await Accessory.findByIdAndUpdate(
            product_id,
            { $inc: { sold_count: -quantity } }, // Giảm sold_count
            { new: true }
          );
        } else {
          // Fallback: thử tìm trong cả 2 collection nếu không có category type
          const foodProduct = await Food.findById(product_id);
          if (foodProduct) {
            await Food.findByIdAndUpdate(
              product_id,
              { $inc: { sold_count: -quantity } },
              { new: true }
            );
          } else {
            const accessoryProduct = await Accessory.findById(product_id);
            if (accessoryProduct) {
              await Accessory.findByIdAndUpdate(
                product_id,
                { $inc: { sold_count: -quantity } },
                { new: true }
              );
            }
          }
        }
      } catch (productError) {
        console.error(
          `Lỗi khi hoàn lại sold_count cho sản phẩm ${product.product_id}:`,
          productError
        );
        // Không throw error vì đơn hàng đã được hủy thành công
      }
    }

    // phát sự kiện thay đổi đơn hàng
    broadcastOrderChange({ type: "cancelled", order_id: id });
    return res.json({
      success: true,
      message:
        "Đơn hàng đã được hủy thành công và đã hoàn lại số lượng bán cho sản phẩm",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đơn hàng",
    });
  }
};

// Đánh giá sao cho sản phẩm đã mua
module.exports.rateProduct = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;
    const { product_id, category_id, rating = 0, comment } = req.body || {};
    if (!tokenUser) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập" });
    }
    if (!product_id || !category_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu product_id hoặc category_id" });
    }

    const user = await User.findOne({ tokenUser, deleted: false }).select(
      "_id"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Token không hợp lệ" });
    }

    const validStars = Math.max(1, Math.min(5, Number(rating || 0)));

    // Kiểm tra user có đơn hàng đã hoàn thành chứa sản phẩm này hay không
    const hasOrdered = await Order.exists({
      user_id: user._id,
      "products.product_id": product_id,
      status: "completed",
      deleted: false,
    });
    if (!hasOrdered) {
      return res
        .status(403)
        .json({ 
          success: false, 
          message: "Chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn thành" 
        });
    }

    // Xác định model theo category
    const category = await Category.findById(category_id);
    let Model = null;
    if (category && category.type === "food") Model = Food;
    else if (category && category.type === "accessory") Model = Accessory;

    let doc = null;
    if (Model) {
      doc = await Model.findById(product_id).select(
        "rating reviewCount rated_by"
      );
      // Nếu dữ liệu thực tế nằm ở collection khác (do category sai), thử fallback
      if (!doc) {
        const fallbackModel = Model === Food ? Accessory : Food;
        doc = await fallbackModel.findById(product_id).select(
          "rating reviewCount rated_by"
        );
      }
    } else {
      // Fallback: thử tìm trong cả 2 collection khi không xác định được từ category
      doc =
        (await Food.findById(product_id).select("rating reviewCount rated_by")) ||
        (await Accessory.findById(product_id).select(
          "rating reviewCount rated_by"
        ));
    }
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Chặn mỗi tài khoản chỉ đánh giá 1 lần cho 1 sản phẩm
    const ratedBy = Array.isArray(doc.rated_by) ? doc.rated_by.map(String) : [];
    if (ratedBy.includes(String(user._id))) {
      return res
        .status(409)
        .json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi" });
    }

    const currentRating = Number(doc.rating || 0);
    const currentCount = Number(doc.reviewCount || 0);
    const newCount = currentCount + 1;
    const newRating = (currentRating * currentCount + validStars) / newCount;

    doc.rating = Math.round(newRating * 10) / 10; // làm tròn 1 chữ số thập phân
    doc.reviewCount = newCount;
    // Thêm user vào danh sách đã đánh giá (khởi tạo nếu chưa có)
    if (!Array.isArray(doc.rated_by)) doc.rated_by = [];
    doc.rated_by.push(user._id);
    await doc.save();

    // Phát sự kiện thay đổi đơn hàng để frontend cập nhật ngay
    broadcastOrderChange({ 
      type: "product_rated", 
      product_id: product_id,
      user_id: user._id 
    });

    return res.json({
      success: true,
      message: "Đánh giá thành công",
      rating: doc.rating,
      reviewCount: doc.reviewCount,
      alreadyRated: true,
    });
  } catch (err) {
    console.error("Rate product error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đánh giá" });
  }
};

// Yêu cầu hoàn hàng
module.exports.requestReturn = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;
    const { order_id, return_request } = req.body;
    
    if (!tokenUser) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập" });
    }

    if (!order_id || !return_request || !return_request.return_reason) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đơn hàng hoặc lý do hoàn hàng",
      });
    }

    const user = await User.findOne({ tokenUser, deleted: false }).select(
      "_id"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Token không hợp lệ" });
    }

    // Tìm đơn hàng và kiểm tra quyền sở hữu
    const order = await Order.findOne({
      _id: order_id,
      user_id: user._id,
      deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
      });
    }

    // Chỉ cho phép yêu cầu hoàn hàng với đơn đã hoàn thành hoặc đã giao
    if (!["completed", "shipped"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể yêu cầu hoàn hàng với đơn hàng đã hoàn thành hoặc đã giao",
      });
    }

    // Cho phép cập nhật return_request nếu đã có
    if (order.return_request) {
      // Không return error, tiếp tục cập nhật
    }

    // Tạo yêu cầu hoàn hàng theo cấu trúc model
    const returnRequestData = {
      isReturned: return_request.isReturned,
      return_reason: return_request.return_reason,
      return_description: return_request.return_description || "",
      requested_at: new Date(),
      requested_by: user._id,
      status: "pending",
    };

    // Cập nhật đơn hàng với thông tin hoàn hàng
    order.return_request = returnRequestData;
    order.status = "returned"; // Chuyển trạng thái đơn hàng thành "returned"
    order.updatedBy.push({
      account_id: user._id,
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({
      success: true,
      message: "Yêu cầu hoàn hàng đã được gửi thành công",
      return_request: returnRequestData,
    });
  } catch (err) {
    console.error("Request return error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi yêu cầu hoàn hàng" });
  }
};

// GET /orders/:id - Lấy chi tiết một đơn hàng
module.exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const tokenUser = req.cookies?.tokenUser;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID đơn hàng",
      });
    }

    let currentUserId = null;

    // Nếu có tokenUser (user đã đăng nhập), tìm user từ token
    if (tokenUser) {
      try {
        const user = await User.findOne({
          tokenUser: tokenUser,
          deleted: false,
        });
        if (user) {
          currentUserId = user._id;
        }
      } catch (userError) {
        console.error("Lỗi khi tìm user từ token:", userError);
      }
    }

    // Tìm đơn hàng
    const order = await Order.findOne({
      _id: id,
      deleted: false,
    })
      .populate("user_id", "fullName email phone")
      .populate("customer_info", "fullName phone address email")
      .populate("payment_id", "name description image status")
      .populate("shipping_id", "name price estimated_delivery_time methods")
      .populate("products.category_id", "name type");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra quyền truy cập: chỉ cho phép user sở hữu đơn hàng hoặc admin
    if (currentUserId && String(order.user_id?._id || order.user_id) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập đơn hàng này",
      });
    }

    // Attach product info
    const plainOrder = order.toObject();
    for (let i = 0; i < plainOrder.products.length; i++) {
      const product = plainOrder.products[i];
      try {
        const foodProduct = await Food.findById(product.product_id).select(
          "name thumbnail images rated_by"
        );
        if (foodProduct) {
          plainOrder.products[i].product_info = {
            name: foodProduct.name,
            thumbnail: foodProduct.thumbnail,
            images: foodProduct.images,
            type: "food",
          };
            // Kiểm tra user đã đánh giá sản phẩm này chưa
            plainOrder.products[i].alreadyRated = currentUserId && Array.isArray(
              accessoryProduct.rated_by
            )
              ? accessoryProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
        } else {
          const accessoryProduct = await Accessory.findById(
            product.product_id
          ).select("name thumbnail images rated_by");
          if (accessoryProduct) {
            plainOrder.products[i].product_info = {
              name: accessoryProduct.name,
              thumbnail: accessoryProduct.thumbnail,
              images: accessoryProduct.images,
              type: "accessory",
            };
            // Kiểm tra user đã đánh giá sản phẩm này chưa
            plainOrder.products[i].alreadyRated = currentUserId && Array.isArray(foodProduct.rated_by)
              ? foodProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
          } else {
            plainOrder.products[i].alreadyRated = false;
          }
        }
      } catch (error) {
        console.error(
          `Error populating product ${product.product_id}:`,
          error
        );
        plainOrder.products[i].alreadyRated = false;
      }
    }

    return res.json({
      success: true,
      order: plainOrder,
    });
  } catch (err) {
    console.error("Get order detail error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn hàng",
    });
  }
};

// Lấy danh sách yêu cầu hoàn hàng của user
module.exports.getReturnRequests = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;
    const { page = 1, limit = 10, status } = req.query;

    if (!tokenUser) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập" });
    }

    const user = await User.findOne({ tokenUser, deleted: false }).select(
      "_id"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Token không hợp lệ" });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Tìm các đơn hàng có yêu cầu hoàn hàng
    const query = {
      user_id: user._id,
      deleted: false,
      return_request: { $exists: true },
    };

    if (status) {
      query["return_request.status"] = status;
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const orders = await Order.find(query)
      .populate("user_id", "fullName email phone")
      .populate("customer_info", "fullName phone address")
      .populate("payment_id", "name description image status")
      .populate("shipping_id", "name price estimated_delivery_time")
      .populate("products.category_id", "name type")
      .sort({ "return_request.requested_at": -1 })
      .skip(skip)
      .limit(limitNum);

    const plainOrders = orders.map((order) => order.toObject());

    // Attach product info và alreadyRated
    const userId = user._id;
    for (let order of plainOrders) {
      for (let i = 0; i < order.products.length; i++) {
        const product = order.products[i];
        try {
          const foodProduct = await Food.findById(product.product_id).select(
            "name thumbnail images rated_by"
          );
          if (foodProduct) {
            order.products[i].product_info = {
              name: foodProduct.name,
              thumbnail: foodProduct.thumbnail,
              images: foodProduct.images,
              type: "food",
            };
            // Kiểm tra user đã đánh giá sản phẩm này chưa
            order.products[i].alreadyRated = currentUserId && Array.isArray(foodProduct.rated_by)
              ? foodProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
          } else {
            const accessoryProduct = await Accessory.findById(
              product.product_id
            ).select("name thumbnail images rated_by");
            if (accessoryProduct) {
              order.products[i].product_info = {
                name: accessoryProduct.name,
                thumbnail: accessoryProduct.thumbnail,
                images: accessoryProduct.images,
                type: "accessory",
              };
              // Kiểm tra user đã đánh giá sản phẩm này chưa
            order.products[i].alreadyRated = currentUserId && Array.isArray(foodProduct.rated_by)
              ? foodProduct.rated_by.some(
                  (u) => String(u) === String(currentUserId)
                )
              : false;
            } else {
              order.products[i].alreadyRated = false;
            }
          }
        } catch (error) {
          console.error(
            `Error populating product ${product.product_id}:`,
            error
          );
          order.products[i].alreadyRated = false;
        }
      }
    }

    return res.json({
      success: true,
      orders: plainOrders,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    console.error("Get return requests error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

