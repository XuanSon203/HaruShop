const Notification = require("../../model/NotificationModel");

module.exports.list = async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Math.min(50, parseInt(req.query.limit || "10", 10) || 10)
    );

    const baseQuery = {
      audience: "user",
      user_id: req.user._id,
    };

    const typeFilter = (req.query.type || "")
      .split(",")
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);

    if (typeFilter.length) {
      baseQuery.type = { $in: typeFilter };
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ ...baseQuery, status: "unread" }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("User notification list error:", error);
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
      { _id: id, audience: "user", user_id: req.user._id },
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
    console.error("User notification markAsRead error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông báo",
    });
  }
};

module.exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { audience: "user", user_id: req.user._id, status: "unread" },
      { status: "read", readAt: new Date() }
    );

    return res.json({
      success: true,
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("User notification markAll error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông báo",
    });
  }
};


