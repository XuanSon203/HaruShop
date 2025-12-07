const Order = require("../../model/OrderModel");
const mongoose = require('mongoose');
const User = require("../../model/UserModel");
const Customer = require("../../model/AddressModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const Service = require("../../model/ServiceModel");
const Payment = require('../../model/PaymentMethodModel');
const Shipping = require('../../model/ShippingProvidersModel');
const sendMailHelper = require('../../helpers/send-mail');
const {
  populateUserInfo,
  populateUserInfoArray,
} = require("../../helpers/populateUserInfo");
const {
  pushUserNotification,
  shortOrderCode,
} = require("../../helpers/notificationHelper");

const ORDER_STATUS_MESSAGES = {
  pending: "Đơn hàng đang chờ xác nhận. Chúng tôi sẽ xử lý sớm nhất có thể.",
  processing: "Đơn hàng đang được xử lý trong kho.",
  shipping: "Đơn hàng đang được bàn giao cho đơn vị vận chuyển.",
  shipped: "Đơn hàng đã rời kho và đang trên đường giao tới bạn.",
  completed: "Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm tại HaruShop!",
  cancelled: "Đơn hàng đã bị hủy. Vui lòng kiểm tra lại chi tiết hoặc liên hệ hỗ trợ.",
  returned: "Yêu cầu hoàn hàng đã được xử lý. Sản phẩm sẽ được nhận lại trong thời gian sớm nhất.",
};

const WARNING_STATUSES = new Set(["pending", "cancelled", "returned"]);
// GET /admin/orders?page=&limit=&status=&user_id=
module.exports.index = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      user_id,
      range,
      from,
      to,
      shipping_id,
      keyword,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Support viewing deleted orders when deleted=true query param is provided
    const showDeleted = req.query.deleted === "true";
    const query = showDeleted ? { deleted: true } : { deleted: false };
    if (status) {
      query.status = status.includes(",") ? { $in: status.split(",") } : status;
    }
    if (user_id) query.user_id = user_id;
    if (shipping_id) {
      try {
        query.shipping_id = new mongoose.Types.ObjectId(String(shipping_id));
      } catch (_) {
        query.shipping_id = shipping_id; // fallback
      }
    }
    
    // Filter for returned orders
    if (req.query.isReturned === "true") {
      query["return_request.isReturned"] = true;
    } else if (req.query.isReturned === "false") {
      query["return_request.isReturned"] = { $ne: true };
    }

    // Date range filters: range=day|week|month|year OR custom from,to (ISO or yyyy-mm-dd)
    let startDate;
    let endDate;
    const now = new Date();
    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    if (from || to) {
      const parsedFrom = parseDate(from);
      const parsedTo = parseDate(to);
      if (parsedFrom) startDate = new Date(parsedFrom.setHours(0, 0, 0, 0));
      if (parsedTo) {
        const t = new Date(parsedTo);
        endDate = new Date(t.setHours(23, 59, 59, 999));
      }
    } else if (range) {
      const lower = String(range).toLowerCase();
      if (lower === "day") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (lower === "week") {
        // Assume week starts on Monday
        const day = (now.getDay() + 6) % 7; // 0=Mon ... 6=Sun
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (lower === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      } else if (lower === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Keyword search: phone number or last characters of order code
    if (keyword && keyword.trim().length > 0) {
      const safeKeyword = keyword.trim();
      const PhoneRegex = new RegExp(
        safeKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      const [customerMatches, userMatches] = await Promise.all([
        Customer.find({ phone: PhoneRegex }).select("_id").lean(),
        User.find({ phone: PhoneRegex }).select("_id").lean(),
      ]);

      const keywordClauses = [];
      if (customerMatches.length > 0) {
        keywordClauses.push({
          customer_info: {
            $in: customerMatches.map((doc) => doc._id),
          },
        });
      }
      if (userMatches.length > 0) {
        keywordClauses.push({
          user_id: {
            $in: userMatches.map((doc) => doc._id),
          },
        });
      }

      const normalizedCode = safeKeyword
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      if (normalizedCode.length >= 4) {
        const suffixRegex = new RegExp(`${normalizedCode}$`, "i");
        const matchStage = { ...query };
        const codeMatches = await Order.aggregate([
          { $match: matchStage },
          {
            $addFields: {
              _id_str: { $toString: "$_id" },
            },
          },
          {
            $match: {
              _id_str: { $regex: suffixRegex },
            },
          },
          { $project: { _id: 1 } },
        ]);
        if (codeMatches.length > 0) {
          keywordClauses.push({
            _id: {
              $in: codeMatches.map((doc) => doc._id),
            },
          });
        }
      }

      if (keywordClauses.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: keywordClauses });
      } else {
        // Force empty result when keyword doesn't match anything
        query.$and = query.$and || [];
        query.$and.push({ _id: null });
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("user_id", "fullName email phone")
      .populate("customer_info", "fullName phone address")
      .populate("payment_id", "name description image status")
      .populate("products.category_id", "name type")
      .populate("shipping_id", "name methods");

    // Populate updatedBy manually
    for (let order of orders) {
      if (order.updatedBy && order.updatedBy.length > 0) {
        for (let update of order.updatedBy) {
          if (update.account_id) {
            const user = await User.findById(update.account_id).select(
              "fullName email"
            );
            if (user) {
              update.user_info = user;
            }
          }
        }
      }
    }

    // attach product snapshots
    // Convert to plain objects while preserving populated fields
    const plainOrders = orders.map((o) => {
      const obj = o.toObject();
      // Ensure populated fields are preserved
      if (o.populated('payment_id')) {
        obj.payment_id = o.payment_id;
      }
      if (o.populated('shipping_id')) {
        obj.shipping_id = o.shipping_id;
      }
      if (o.populated('user_id')) {
        obj.user_id = o.user_id;
      }
      if (o.populated('customer_info')) {
        obj.customer_info = o.customer_info;
      }
      return obj;
    });
    for (const order of plainOrders) {
      for (let i = 0; i < order.products.length; i++) {
        const p = order.products[i];
        try {
          const f = await Food.findById(p.product_id).select(
            "name thumbnail images shipping_id"
          );
          if (f) {
            order.products[i].product_info = {
              name: f.name,
              thumbnail: f.thumbnail,
              images: f.images,
              type: "food",
            };
          } else {
            const a = await Accessory.findById(p.product_id).select(
              "name thumbnail images shipping_id"
            );
            if (a) {
              order.products[i].product_info = {
                name: a.name,
                thumbnail: a.thumbnail,
                images: a.images,
                type: "accessory",
              };
            }
          }
        } catch (_) {}
      }
    }

    // Populate user information for orders
    const ordersWithUserInfo = await populateUserInfoArray(plainOrders);

    // Compute total revenue for the filtered set (or all if no filter provided)
    const revenueAgg = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, totalRevenue: { $sum: "$summary.total" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Simple status summary (count per status) for current filter
    const statusAgg = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
      { $project: { _id: 0, status: "$_id", count: 1, revenue: 1 } },
    ]);
    // shipping summary (by provider id) + join to get provider name
    const shippingAgg = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$shipping_id",
          count: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
      {
        $lookup: {
          from: "shippings", // Mongo collection name for Shipping model
          localField: "_id",
          foreignField: "_id",
          as: "provider",
        },
      },
      { $unwind: { path: "$provider", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, revenue: 1, name: "$provider.name" } },
    ]);
    // fetch shipping providers for dropdown and mapping names
    const shippingProviders = await Shipping.find({ deleted: false })
      .select('name price')
      .lean();
    return res.json({
      success: true,
      orders: ordersWithUserInfo,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      totalRevenue,
      statusSummary: statusAgg,
      shippingSummary: shippingAgg,
      shippingProviders,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
        range: range || null,
        from: from || null,
        to: to || null,
      },
    });
  } catch (err) {
    console.error("Admin Orders index error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/orders/stats?status=&user_id=&from=&to=&range=
module.exports.stats = async (req, res) => {
  try {
    const { status, user_id, range, from, to } = req.query;

    const baseMatch = { deleted: false };
    if (status)
      baseMatch.status = status.includes(",")
        ? { $in: status.split(",") }
        : status;
    if (user_id) baseMatch.user_id = user_id;
    
    // Filter for returned orders in stats
    if (req.query.isReturned === "true") {
      baseMatch["return_request.isReturned"] = true;
    } else if (req.query.isReturned === "false") {
      baseMatch["return_request.isReturned"] = { $ne: true };
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    let customStart = null;
    let customEnd = null;
    if (from || to || range) {
      if (from || to) {
        const pf = parseDate(from);
        const pt = parseDate(to);
        if (pf) customStart = new Date(pf.setHours(0, 0, 0, 0));
        if (pt) customEnd = new Date(new Date(pt).setHours(23, 59, 59, 999));
      } else if (range) {
        const r = String(range).toLowerCase();
        if (r === "day") {
          customStart = startOfDay;
          customEnd = endOfDay;
        } else if (r === "week") {
          customStart = startOfWeek;
          customEnd = endOfWeek;
        } else if (r === "month") {
          customStart = startOfMonth;
          customEnd = endOfMonth;
        } else if (r === "year") {
          customStart = startOfYear;
          customEnd = endOfYear;
        }
      }
    }

    const buildMatchWithRange = (start, end) => {
      const m = { ...baseMatch };
      if (start || end) {
        m.createdAt = {};
        if (start) m.createdAt.$gte = start;
        if (end) m.createdAt.$lte = end;
      }
      return m;
    };

    const aggregateSummary = async (match) => {
      const [statusAgg, globalAgg] = await Promise.all([
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              revenue: { $sum: "$summary.total" },
            },
          },
          { $project: { _id: 0, status: "$_id", count: 1, revenue: 1 } },
        ]),
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              revenue: { $sum: "$summary.total" },
            },
          },
        ]),
      ]);
      return {
        statusSummary: statusAgg,
        totalCount: globalAgg[0]?.count || 0,
        totalRevenue: globalAgg[0]?.revenue || 0,
      };
    };

    const [
      today,
      thisWeek,
      thisMonth,
      thisYear,
      allTime,
      custom,
      usersCount,
      foodsCount,
      accessoriesCount,
      servicesCount,
    ] = await Promise.all([
      aggregateSummary(buildMatchWithRange(startOfDay, endOfDay)),
      aggregateSummary(buildMatchWithRange(startOfWeek, endOfWeek)),
      aggregateSummary(buildMatchWithRange(startOfMonth, endOfMonth)),
      aggregateSummary(buildMatchWithRange(startOfYear, endOfYear)),
      aggregateSummary(buildMatchWithRange(null, null)),
      aggregateSummary(buildMatchWithRange(customStart, customEnd)),
      User.countDocuments({ deleted: false }),
      Food.countDocuments({ deleted: false }),
      Accessory.countDocuments({ deleted: false }),
      Service.countDocuments({ deleted: false }),
    ]);

    return res.json({
      success: true,
      filters: { status: status || null, user_id: user_id || null },
      ranges: {
        today,
        thisWeek,
        thisMonth,
        thisYear,
        allTime,
        custom: {
          ...custom,
          start: customStart || null,
          end: customEnd || null,
        },
      },
      entities: {
        users: usersCount,
        foods: foodsCount,
        accessories: accessoriesCount,
        services: servicesCount,
        productsTotal: (foodsCount || 0) + (accessoriesCount || 0),
      },
    });
  } catch (err) {
    console.error("Admin Orders stats error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /admin/orders/:id/status { status }
module.exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Thiếu tham số" });
    }
    const allowed = [
      "pending",
      "processing",
      "shipping",
      "shipped",
      "completed",
      "cancelled",
      "returned",
    ];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const order = await Order.findOne({ _id: id, deleted: false });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn" });

    // Đảm bảo shipping_id tồn tại và không bị mất
    if (!order.shipping_id) {
      return res
        .status(400)
        .json({ success: false, message: "Đơn hàng thiếu thông tin shipping_id" });
    }

    // Cập nhật status và thêm tracking
    if (status === "returned") {
      // Nếu đặt trạng thái là returned, cập nhật return_request
      if (!order.return_request) {
        order.return_request = {};
      }
      order.return_request.isReturned = true;
      order.return_request.status = "approved";
      order.return_request.processed_at = new Date();
      order.return_request.processed_by = req.account?._id || null;
      // Mark return_request as modified
      order.markModified('return_request');
      
      // Cộng lại số lượng sản phẩm vào kho khi hoàn hàng
      try {
        for (const product of order.products) {
          const { product_id, quantity, category_id } = product;
          
          // Validate product_id và quantity
          if (!product_id || !quantity || quantity <= 0) {
            console.warn(`Sản phẩm không hợp lệ trong đơn hàng ${order._id}:`, product);
            continue;
          }
          
          // Lấy thông tin category để xác định loại sản phẩm
          let category = null;
          if (category_id) {
            try {
              const Category = require("../../model/CategoryModel");
              category = await Category.findById(category_id);
            } catch (catError) {
              console.warn(`Không tìm thấy category ${category_id}:`, catError.message);
            }
          }
          
          if (category && category.type === "food") {
            await Food.findByIdAndUpdate(
              product_id,
              { $inc: { quantity: quantity, sold_count: -quantity } },
              { new: true }
            );
          } else if (category && category.type === "accessory") {
            await Accessory.findByIdAndUpdate(
              product_id,
              { $inc: { quantity: quantity, sold_count: -quantity } },
              { new: true }
            );
          } else {
            // Fallback: thử tìm trong cả 2 collection nếu không có category type
            try {
              const foodProduct = await Food.findById(product_id);
              if (foodProduct) {
                await Food.findByIdAndUpdate(
                  product_id,
                  { $inc: { quantity: quantity, sold_count: -quantity } },
                  { new: true }
                );
              } else {
                const accessoryProduct = await Accessory.findById(product_id);
                if (accessoryProduct) {
                  await Accessory.findByIdAndUpdate(
                    product_id,
                    { $inc: { quantity: quantity, sold_count: -quantity } },
                    { new: true }
                  );
                } else {
                  console.warn(`Không tìm thấy sản phẩm ${product_id} trong food hoặc accessory`);
                }
              }
            } catch (fallbackError) {
              console.error(`Lỗi fallback cho sản phẩm ${product_id}:`, fallbackError.message);
            }
          }
        }
      } catch (productError) {
        console.error(`Lỗi khi cộng lại số lượng sản phẩm cho đơn hàng ${order._id}:`, productError);
        // Không throw error vì đơn hàng đã được cập nhật trạng thái thành công
      }
    } else {
      // Nếu không phải returned, đảm bảo isReturned = false
      if (order.return_request) {
        order.return_request.isReturned = false;
        // Mark return_request as modified
        order.markModified('return_request');
      }
    }
    
    // Lưu shipping_id để đảm bảo không bị mất (convert sang string để tránh mất ObjectId)
    const shippingId = order.shipping_id ? String(order.shipping_id) : null;
    const customerInfoId = order.customer_info ? String(order.customer_info) : null;
    const userId = order.user_id ? String(order.user_id) : null;
    const paymentId = order.payment_id ? String(order.payment_id) : null;
    const cartId = order.cart_id ? String(order.cart_id) : null;
    
    // Cập nhật status và thêm tracking
    order.status = status;
    order.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    // Đảm bảo shipping_id luôn có giá trị (required field)
    if (!order.shipping_id && shippingId) {
      order.shipping_id = mongoose.Types.ObjectId.isValid(shippingId) 
        ? new mongoose.Types.ObjectId(shippingId) 
        : shippingId;
    }
    // Đảm bảo các field optional vẫn còn nếu có
    if (!order.customer_info && customerInfoId) {
      order.customer_info = mongoose.Types.ObjectId.isValid(customerInfoId) 
        ? new mongoose.Types.ObjectId(customerInfoId) 
        : customerInfoId;
    }
    if (!order.user_id && userId) {
      order.user_id = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;
    }
    if (!order.payment_id && paymentId) {
      order.payment_id = mongoose.Types.ObjectId.isValid(paymentId) 
        ? new mongoose.Types.ObjectId(paymentId) 
        : paymentId;
    }
    if (!order.cart_id && cartId) {
      order.cart_id = mongoose.Types.ObjectId.isValid(cartId) 
        ? new mongoose.Types.ObjectId(cartId) 
        : cartId;
    }

    await order.save();

    // Populate thông tin để trả về
    await order.populate("user_id", "fullName email");
    await order.populate("customer_info", "fullName phone address");
    await order.populate("payment_id", "name description image status");

    // Populate updatedBy manually
    if (order.updatedBy && order.updatedBy.length > 0) {
      for (let update of order.updatedBy) {
        if (update.account_id) {
          const user = await User.findById(update.account_id).select(
            "fullName email"
          );
          if (user) {
            update.account_id = user;
          }
        }
      }
    }
   
    const userIdForNotification = order.user_id?._id || order.user_id;
    if (userIdForNotification) {
      const notificationLevel = WARNING_STATUSES.has(status)
        ? "warning"
        : status === "completed"
        ? "success"
        : "info";
      const notifMessage =
        ORDER_STATUS_MESSAGES[status] ||
        `Đơn hàng của bạn đã được cập nhật trạng thái: ${status}`;
      await pushUserNotification({
        userId: userIdForNotification,
        title: `Cập nhật đơn hàng ${shortOrderCode(order._id)}`,
        message: notifMessage,
        type: "order",
        level: notificationLevel,
        orderId: order._id,
        meta: {
          status,
        },
      });
    }
   
    return res.json({ success: true, order });
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/orders/:id (soft delete)
module.exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Thiếu ID" });

    const order = await Order.findOneAndUpdate(
      { _id: id, deleted: false },
      {
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn" });
    return res.json({ success: true, message: "Đã xoá đơn hàng" });
  } catch (err) {
    console.error("remove order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/orders/:id/permanent (hard delete - xóa hoàn toàn)
module.exports.permanentDelete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Thiếu ID" });

    // Chỉ cho phép xóa hoàn toàn đơn hàng đã bị soft delete (deleted: true)
    const order = await Order.findOne({ _id: id, deleted: true });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng đã xóa" });

    // Hard delete - xóa hoàn toàn khỏi database
    await Order.findByIdAndDelete(id);
    
    return res.json({ success: true, message: "Đã xóa hoàn toàn đơn hàng" });
  } catch (err) {
    console.error("permanent delete order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/orders/bulk - Xóa nhiều đơn hàng (soft delete)
module.exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu danh sách ID đơn hàng" });
    }

    // Validate ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: "Không có ID hợp lệ" });
    }

    // Chỉ xóa các đơn hàng chưa bị xóa (deleted: false)
    const result = await Order.updateMany(
      { _id: { $in: validIds }, deleted: false },
      {
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      message: `Đã xóa ${result.modifiedCount} đơn hàng`,
      deletedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("bulk delete orders error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/orders/bulk/permanent - Xóa hoàn toàn nhiều đơn hàng (hard delete)
module.exports.bulkPermanentDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu danh sách ID đơn hàng" });
    }

    // Validate ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: "Không có ID hợp lệ" });
    }

    // Chỉ xóa hoàn toàn các đơn hàng đã bị soft delete (deleted: true)
    const result = await Order.deleteMany({
      _id: { $in: validIds },
      deleted: true,
    });

    return res.json({
      success: true,
      message: `Đã xóa hoàn toàn ${result.deletedCount} đơn hàng`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("bulk permanent delete orders error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /admin/orders/bulk/status - Cập nhật trạng thái nhiều đơn hàng
module.exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu danh sách ID đơn hàng" });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: "Thiếu trạng thái" });
    }

    const allowed = [
      "pending",
      "processing",
      "shipping",
      "shipped",
      "completed",
      "cancelled",
      "returned",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    // Validate ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: "Không có ID hợp lệ" });
    }

    // Chỉ cập nhật các đơn hàng chưa bị xóa (deleted: false)
    const orders = await Order.find({ _id: { $in: validIds }, deleted: false });
    
    // Xử lý từng đơn hàng để cập nhật return_request nếu cần
    for (const order of orders) {
      if (status === "returned") {
        if (!order.return_request) {
          order.return_request = {};
        }
        order.return_request.isReturned = true;
        order.return_request.status = "approved";
        order.return_request.processed_at = new Date();
        order.return_request.processed_by = req.account?._id || null;
        order.markModified('return_request');
      } else {
        if (order.return_request) {
          order.return_request.isReturned = false;
          order.markModified('return_request');
        }
      }
      order.status = status;
      order.updatedBy.push({
        account_id: req.account?._id || null,
        updatedAt: new Date(),
      });
      await order.save();
    }

    return res.json({
      success: true,
      message: `Đã cập nhật trạng thái ${orders.length} đơn hàng`,
      updatedCount: orders.length,
    });
  } catch (err) {
    console.error("bulk update status error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/orders/completed - Lấy danh sách đơn hàng đã hoàn thành
module.exports.getCompletedOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      range,
      from,
      to,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Chỉ lấy đơn hàng đã hoàn thành
    const query = { 
      deleted: false, 
      status: "completed" 
    };
    
    if (user_id) query.user_id = user_id;

    // Date range filters
    let startDate;
    let endDate;
    const now = new Date();
    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    if (from || to) {
      const parsedFrom = parseDate(from);
      const parsedTo = parseDate(to);
      if (parsedFrom) startDate = new Date(parsedFrom.setHours(0, 0, 0, 0));
      if (parsedTo) {
        const t = new Date(parsedTo);
        endDate = new Date(t.setHours(23, 59, 59, 999));
      }
    } else if (range) {
      const lower = String(range).toLowerCase();
      if (lower === "day") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (lower === "week") {
        const day = (now.getDay() + 6) % 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (lower === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      } else if (lower === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("user_id", "fullName email phone")
      .populate("customer_info", "fullName phone address")
      .populate("payment_id", "name description image status")
      .populate("products.category_id", "name type")
      .populate("shipping_id", "name price");

    // Populate updatedBy manually
    for (let order of orders) {
      if (order.updatedBy && order.updatedBy.length > 0) {
        for (let update of order.updatedBy) {
          if (update.account_id) {
            const user = await User.findById(update.account_id).select(
              "fullName email"
            );
            if (user) {
              update.user_info = user;
            }
          }
        }
      }
    }

    // Attach product snapshots
    const plainOrders = orders.map((o) => o.toObject());
    for (const order of plainOrders) {
      for (let i = 0; i < order.products.length; i++) {
        const p = order.products[i];
        try {
          const f = await Food.findById(p.product_id).select(
            "name thumbnail images"
          );
          if (f) {
            order.products[i].product_info = {
              name: f.name,
              thumbnail: f.thumbnail,
              images: f.images,
              type: "food",
            };
          } else {
            const a = await Accessory.findById(p.product_id).select(
              "name thumbnail images"
            );
            if (a) {
              order.products[i].product_info = {
                name: a.name,
                thumbnail: a.thumbnail,
                images: a.images,
                type: "accessory",
              };
            }
          }
        } catch (_) {}
      }
    }

    // Populate user information for orders
    const ordersWithUserInfo = await populateUserInfoArray(plainOrders);

    // Compute total revenue for completed orders
    const revenueAgg = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, totalRevenue: { $sum: "$summary.total" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    return res.json({
      success: true,
      message: "Lấy danh sách đơn hàng hoàn thành thành công",
      orders: ordersWithUserInfo,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      totalRevenue,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
        range: range || null,
        from: from || null,
        to: to || null,
      },
    });
  } catch (err) {
    console.error("Get completed orders error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /admin/orders/cleanup-invalid-customers - Cleanup orders with invalid customer_info after 15 minutes
module.exports.cleanupInvalidCustomers = async (req, res) => {
  try {
    const now = new Date();
    // Tính thời điểm 15 phút trước
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    // Tìm các đơn hàng:
    // 1. Có customer_info (không null)
    // 2. Đã tạo từ 15 phút trước trở lên
    // 3. Chưa bị xóa (deleted: false)
    // 4. Có customer_info không tồn tại trong database
    const ordersToCheck = await Order.find({
      deleted: false,
      customer_info: { $ne: null },
      createdAt: { $lte: fifteenMinutesAgo }
    }).select('_id customer_info createdAt').lean();

    if (ordersToCheck.length === 0) {
      return res.json({
        success: true,
        message: "Không có đơn hàng nào cần kiểm tra",
        deletedCount: 0
      });
    }

    // Lấy danh sách customer_info IDs từ các đơn hàng
    const customerIds = ordersToCheck
      .map(o => o.customer_info)
      .filter(id => id !== null && id !== undefined);

    if (customerIds.length === 0) {
      return res.json({
        success: true,
        message: "Không có customer_info nào cần kiểm tra",
        deletedCount: 0
      });
    }

    // Kiểm tra các customer_info có tồn tại trong database không
    const existingCustomers = await Customer.find({
      _id: { $in: customerIds },
      deleted: false
    }).select('_id').lean();

    const existingCustomerIds = new Set(
      existingCustomers.map(c => String(c._id))
    );

    // Tìm các đơn hàng có customer_info không tồn tại
    const ordersToDelete = ordersToCheck.filter(order => {
      const customerId = String(order.customer_info);
      return !existingCustomerIds.has(customerId);
    });

    if (ordersToDelete.length === 0) {
      return res.json({
        success: true,
        message: "Tất cả customer_info đều tồn tại trong database",
        deletedCount: 0
      });
    }

    // Chuyển các đơn hàng vào thùng rác (soft delete)
    const orderIdsToDelete = ordersToDelete.map(o => o._id);
    const result = await Order.updateMany(
      { _id: { $in: orderIdsToDelete } },
      {
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        },
      }
    );


    return res.json({
      success: true,
      message: `Đã chuyển ${result.modifiedCount} đơn hàng vào thùng rác`,
      deletedCount: result.modifiedCount,
      orders: ordersToDelete.map(o => ({
        orderId: o._id,
        customerInfoId: o.customer_info,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    console.error("Cleanup invalid customers error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

