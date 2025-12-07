const Service = require('../../model/ServiceModel');
const OrderServices = require('../../model/OrderServices');
const User = require('../../model/UserModel');
const {
  pushUserNotification,
  shortOrderCode,
} = require("../../helpers/notificationHelper");

const SERVICE_STATUS_MESSAGES = {
  Pending: "Lịch hẹn của bạn đang chờ xác nhận.",
  Confirmed: "Lịch hẹn đã được xác nhận. Hãy chuẩn bị sẵn sàng nhé!",
  "In Progress": "Dịch vụ của bạn đang được thực hiện.",
  Completed: "Dịch vụ đã hoàn tất. Cảm ơn bạn đã tin tưởng HaruShop!",
  Cancelled: "Lịch hẹn đã bị hủy. Liên hệ chúng tôi nếu cần hỗ trợ đặt lại.",
};

const SERVICE_WARNING_STATUSES = new Set(["Pending", "Cancelled"]);

// GET /admin/orderservices?page=&limit=&status=&user_id=
module.exports.index = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id, range, from, to, keyword } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const query = { deleted: false };
    if (status) {
      query.status = status.includes(",") ? { $in: status.split(",") } : status;
    }
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
      if (parsedFrom) {
        startDate = new Date(parsedFrom);
        startDate.setHours(0, 0, 0, 0);
      }
      if (parsedTo) {
        endDate = new Date(parsedTo);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (range) {
      switch (range) {
        case "day":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (keyword && keyword.trim()) {
      const safeKeyword = keyword.trim();
      const escapeRegex = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const phoneRegex = new RegExp(escapeRegex(safeKeyword), "i");
      const keywordClauses = [
        { services: { $elemMatch: { phone: phoneRegex } } },
      ];

      const matchedUsers = await User.find({ phone: phoneRegex })
        .select("_id")
        .lean();
      if (matchedUsers.length > 0) {
        keywordClauses.push({
          user_id: { $in: matchedUsers.map((doc) => doc._id) },
        });
      }

      const normalizedCode = safeKeyword
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      if (normalizedCode.length >= 4) {
        const suffixRegex = new RegExp(`${normalizedCode}$`, "i");
        const baseMatch = { ...query };
        const idMatches = await OrderServices.aggregate([
          { $match: baseMatch },
          { $addFields: { _id_str: { $toString: "$_id" } } },
          { $match: { _id_str: { $regex: suffixRegex } } },
          { $project: { _id: 1 } },
        ]);
        if (idMatches.length > 0) {
          keywordClauses.push({
            _id: { $in: idMatches.map((doc) => doc._id) },
          });
        }
      }

      if (keywordClauses.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: keywordClauses });
      } else {
        query.$and = query.$and || [];
        query.$and.push({ _id: null });
      }
    }

    const totalOrders = await OrderServices.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);
    
    // Get status counts for summary cards
    const statusCounts = await OrderServices.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object format
    const statusCountsObj = {};
    statusCounts.forEach(item => {
      statusCountsObj[item._id] = item.count;
    });

    const orders = await OrderServices.find(query)
      .populate('user_id', 'fullName email phone')
      .populate('services.services_id', 'serviceName price description image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Populate updatedBy manually
    for (let order of orders) {
      if (order.updatedBy && order.updatedBy.length > 0) {
        for (let update of order.updatedBy) {
          if (update.account_id) {
            const user = await User.findById(update.account_id).select('fullName email');
            if (user) {
              update.account_id = user;
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      orders,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      statusCounts: statusCountsObj,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    console.error("OrderServices index error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /admin/orderservices/:id/status { status }
module.exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Thiếu tham số" });
    }
    const allowed = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    
    // Nếu chọn "Completed" thì bắt buộc phải có paymentMethod
    if (status === "Completed" && !paymentMethod) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn phương thức thanh toán" });
    }
    
    const order = await OrderServices.findOne({ _id: id, deleted: false });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });

    // Cập nhật status và paymentMethod (nếu có)
    order.status = status;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    order.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await order.save();

    // Populate thông tin để trả về
    await order.populate('user_id', 'fullName email phone');
    await order.populate('services.services_id', 'serviceName price description image');
    if (order.discount_id) {
      await order.populate('discount_id', 'name code type value');
    }

    // Populate updatedBy manually
    if (order.updatedBy && order.updatedBy.length > 0) {
      for (let update of order.updatedBy) {
        if (update.account_id) {
          const user = await User.findById(update.account_id).select('fullName email');
          if (user) {
            update.account_id = user;
          }
        }
      }
    }

    if (order.user_id) {
      const notificationLevel = SERVICE_WARNING_STATUSES.has(status)
        ? "warning"
        : status === "Completed"
        ? "success"
        : "info";
      const notifMessage =
        SERVICE_STATUS_MESSAGES[status] ||
        `Đơn dịch vụ của bạn đã được cập nhật trạng thái: ${status}`;
      await pushUserNotification({
        userId: order.user_id?._id || order.user_id,
        title: `Cập nhật đơn dịch vụ ${shortOrderCode(order._id)}`,
        message: notifMessage,
        type: "service_order",
        level: notificationLevel,
        serviceOrderId: order._id,
        meta: {
          status,
        },
      });
    }

    return res.json({ 
      success: true, 
      message: 'Cập nhật trạng thái thành công',
      order 
    });
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/orderservices/:id (soft delete)
module.exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Thiếu ID đơn hàng" });
    }

    const order = await OrderServices.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    order.deleted = true;
    order.deletedBy = {
      account_id: req.account?._id || null,
      deletedAt: new Date(),
    };

    await order.save();

    return res.json({ success: true, message: "Xóa đơn hàng thành công" });
  } catch (err) {
    console.error("Remove order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
module.exports.deletedList = async(req,res)=>{
    try{

    }catch(error){

    }
}

// GET /admin/orderservices/completed - Lấy danh sách đơn dịch vụ đã hoàn thành
module.exports.getCompletedOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, range, from, to } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Chỉ lấy đơn dịch vụ đã hoàn thành
    const query = { 
      deleted: false, 
      status: "Completed" 
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
      if (parsedFrom) {
        startDate = new Date(parsedFrom);
        startDate.setHours(0, 0, 0, 0);
      }
      if (parsedTo) {
        endDate = new Date(parsedTo);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (range) {
      switch (range) {
        case "day":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const totalOrders = await OrderServices.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);
    
    // Get completed orders count for summary
    const completedCount = await OrderServices.countDocuments({ 
      deleted: false, 
      status: "Completed" 
    });
    
    // Get total revenue for completed orders
    const revenueAgg = await OrderServices.aggregate([
      { $match: query },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const orders = await OrderServices.find(query)
      .populate('user_id', 'fullName email phone')
      .populate('services.services_id', 'serviceName price description image')
      .populate('discount_id', 'name code type value')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Populate updatedBy manually
    for (let order of orders) {
      if (order.updatedBy && order.updatedBy.length > 0) {
        for (let update of order.updatedBy) {
          if (update.account_id) {
            const user = await User.findById(update.account_id).select('fullName email');
            if (user) {
              update.account_id = user;
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      message: "Lấy danh sách đơn dịch vụ hoàn thành thành công",
      orders,
      currentPage: pageNum,
      totalPages,
      totalOrders,
      completedCount,
      totalRevenue,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
        range: range || null,
        from: from || null,
        to: to || null,
      },
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    console.error("Get completed service orders error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
