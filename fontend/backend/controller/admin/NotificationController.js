const Notification = require("../../model/NotificationModel");

module.exports.list = async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Math.min(50, parseInt(req.query.limit || "10", 10) || 10)
    );

    const query = {
      audience: "admin",
      $or: [{ account_id: null }, { account_id: req.account._id }],
    };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        ...query,
        status: "unread",
      }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Admin notification list error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách thông báo",
    });
  }
};

module.exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu ID thông báo" });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        audience: "admin",
        $or: [{ account_id: null }, { account_id: req.account._id }],
      },
      { status: "read", readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy thông báo" });
    }

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("Admin notification markAsRead error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông báo",
    });
  }
};

module.exports.markAllAsRead = async (req, res) => {
  try {
    const query = {
      audience: "admin",
      status: "unread",
      $or: [{ account_id: null }, { account_id: req.account._id }],
    };

    const result = await Notification.updateMany(query, {
      status: "read",
      readAt: new Date(),
    });

    return res.json({
      success: true,
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Admin notification markAll error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông báo",
    });
  }
};
















