const Service = require("../../model/ServiceModel");
const OrderServices = require("../../model/OrderServices");
const User = require("../../model/UserModel");
const {
  pushUserNotification,
  pushAdminNotification,
  shortOrderCode,
} = require("../../helpers/notificationHelper");

// GET /orderservices - Get user's service orders
module.exports.index = async (req, res) => {
  try {
    const { page = 1, limit = 5, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 5));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const query = { deleted: false };

    // If user is logged in, filter by user_id
    if (req.user && req.user._id) {
      query.user_id = req.user._id;
    } else {
      // If user is not logged in, return empty result
      return res.json({
        success: true,
        orders: [],
        currentPage: pageNum,
        totalPages: 0,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }
    if (status) {
      query.status = status.includes(",") ? { $in: status.split(",") } : status;
    }

    const totalOrders = await OrderServices.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const orders = await OrderServices.find(query)
      .populate("user_id", "fullName email phone")
      .populate("services.services_id", "serviceName price description image")
      .populate("rating.rated_by", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      orders,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    console.error("OrderServices index error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /orderservices/add - Create new service order
module.exports.add = async (req, res) => {
  try {
    const body = req.body || {};
    // Validate required fields
    if (!body.service_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID dịch vụ" });
    }

    if (!body.fullName || !body.phone) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin liên hệ" });
    }

    if (!body.petName || !body.typePet) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin thú cưng" });
    }

    if (!body.dateOrder || !body.hoursOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin ngày giờ đặt lịch" });
    }

    // Check if service exists
    const service = await Service.findById(body.service_id);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ" });
    }

    // Validate and calculate discount if provided
    let subtotal = service.price || 0;
    let total = subtotal;

    // Create service order
    const orderData = {
      user_id: req.user?._id || null,

      services: [
        {
          services_id: body.service_id,
          fullName: body.fullName,
          phone: body.phone,
          petName: body.petName,
          typePet: body.typePet,
          agePet:
            body.agePet && !isNaN(parseInt(body.agePet))
              ? parseInt(body.agePet)
              : null,
          dateOrder: new Date(body.dateOrder),
          hoursOrder: new Date(body.hoursOrder),
          note: body.note || "",
        },
      ],
      status: "Pending",
      summary: {
        subtotal: subtotal,
        total: total,
      },
    };

    const orderDoc = new OrderServices(orderData);
    await orderDoc.save();

    if (orderDoc.user_id) {
      await pushUserNotification({
        userId: orderDoc.user_id,
        title: `Đặt lịch dịch vụ ${shortOrderCode(orderDoc._id)}`,
        message: "Lịch hẹn của bạn đã được ghi nhận và chờ xác nhận.",
        type: "service_order",
        level: "info",
        serviceOrderId: orderDoc._id,
        meta: {
          status: "Pending",
        },
      });
    }

    await pushAdminNotification({
      title: `Có lịch dịch vụ mới ${shortOrderCode(orderDoc._id)}`,
      message: `${body.fullName || "Khách hàng"} đã đặt dịch vụ ${
        service.serviceName || ""
      }`,
      type: "service_order",
      level: "warning",
      serviceOrderId: orderDoc._id,
    });

    // Populate the created order for response
    await orderDoc.populate(
      "services.services_id",
      "serviceName price description image"
    );
    if (orderDoc.user_id) {
      await orderDoc.populate("user_id", "fullName email phone");
    }

    return res.json({
      success: true,
      message: "Đặt lịch dịch vụ thành công",
      order: orderDoc,
    });
  } catch (err) {
    console.error("Add order service error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /orderservices/:id - Get single service order
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID đơn hàng" });
    }

    const query = { _id: id, deleted: false };

    // If user is logged in, ensure they can only see their own orders
    if (req.user && req.user._id) {
      query.user_id = req.user._id;
    } else {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để xem chi tiết đơn hàng",
      });
    }

    const order = await OrderServices.findOne(query)
      .populate("user_id", "fullName email phone")
      .populate("services.services_id", "serviceName price description image")
      .populate("rating.rated_by", "fullName email")
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error("Order detail error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /orderservices/:id/cancel - Cancel service order
module.exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID đơn hàng" });
    }

    const query = { _id: id, deleted: false };

    // If user is logged in, ensure they can only cancel their own orders
    if (req.user && req.user._id) {
      query.user_id = req.user._id;
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Bạn cần đăng nhập để hủy đơn hàng" });
    }

    const order = await OrderServices.findOne(query);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Only allow cancellation if order is still pending
    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy đơn hàng đang chờ xử lý",
      });
    }

    order.status = "Cancelled";
    order.updatedBy.push({
      account_id: req.user?._id || null,
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({
      success: true,
      message: "Hủy đơn hàng thành công",
      order,
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /orderservices/rating/:id - Đánh giá dịch vụ
module.exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, comment, images } = req.body || {};
    
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập" });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID đơn hàng" });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5 sao",
      });
    }

    // Tìm đơn dịch vụ và kiểm tra quyền sở hữu
    const order = await OrderServices.findOne({
      _id: id,
      user_id: req.user._id,
      deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn dịch vụ hoặc bạn không có quyền đánh giá",
      });
    }

    // Chỉ cho phép đánh giá đơn đã hoàn thành
    if (order.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá đơn dịch vụ đã hoàn thành",
      });
    }

    // Kiểm tra xem đã đánh giá chưa (nếu có thì cập nhật, không thì tạo mới)
    const isUpdating = order.rating && order.rating.score;

    // Cập nhật đánh giá vào OrderServices
    order.rating = {
      score: parseInt(score),
      comment: comment || "",
      images: images || [],
      rated_at: isUpdating ? order.rating.rated_at : new Date(),
      updated_at: new Date(),
      rated_by: req.user._id,
      is_updated: isUpdating,
    };
    order.is_rating = true;
    order.updatedBy.push({
      account_id: req.user._id,
      updatedAt: new Date(),
    });

    await order.save();

    // Populate để trả về thông tin đầy đủ
    await order.populate("rating.rated_by", "fullName email");

    return res.json({
      success: true,
      message: isUpdating ? "Cập nhật đánh giá dịch vụ thành công" : "Đánh giá dịch vụ thành công",
      rating: order.rating,
    });
  } catch (err) {
    console.error("Add rating error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đánh giá" });
  }
};

// DELETE /orderservices/:id/rating - Xóa đánh giá
module.exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập" });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID đơn hàng" });
    }

    // Tìm đơn dịch vụ và kiểm tra quyền sở hữu
    const order = await OrderServices.findOne({
      _id: id,
      user_id: req.user._id,
      deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn dịch vụ hoặc bạn không có quyền xóa đánh giá",
      });
    }

    // Kiểm tra xem đã có đánh giá chưa
    if (!order.rating || !order.rating.score) {
      return res.status(400).json({
        success: false,
        message: "Chưa có đánh giá để xóa",
      });
    }

    // Xóa đánh giá
    order.rating = {
      score: null,
      comment: "",
      images: [],
      rated_at: null,
      updated_at: null,
      rated_by: null,
      is_updated: false,
    };
    order.is_rating = false;

    order.updatedBy.push({
      account_id: req.user._id,
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (err) {
    console.error("Delete rating error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa đánh giá" });
  }
};
