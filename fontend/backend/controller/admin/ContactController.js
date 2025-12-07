const Contact = require("../../model/ContactModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

// GET /admin/contacts - Lấy danh sách liên hệ
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const subject = req.query.subject || "";
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Điều kiện tìm kiếm
    let find = { deleted: false };
    
    if (search) {
      find.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }
    
    if (status) {
      find.status = status;
    }
    
    if (subject) {
      find.subject = subject;
    }

    // Đếm tổng số liên hệ
    const totalContacts = await Contact.countDocuments(find);

    // Skip + limit phân trang
    const skip = (page - 1) * limit;

    // Lấy danh sách liên hệ
    const contacts = await Contact.find(find)
      .populate("user_id", "name email")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Populate user information
    const contactsWithUserInfo = await populateUserInfoArray(contacts);

    res.json({
      success: true,
      contacts: contactsWithUserInfo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalContacts / limit),
        totalContacts,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách liên hệ:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

// GET /admin/contacts/:id - Lấy chi tiết liên hệ
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id)
      .populate("user_id", "name email");

    if (!contact || contact.deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ"
      });
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết liên hệ:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// PUT /admin/contacts/:id - Cập nhật trạng thái và phản hồi
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply_message } = req.body;

    const contact = await Contact.findById(id);
    
    if (!contact || contact.deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ"
      });
    }

    // Cập nhật thông tin
    const updateData = {
      updatedBy: {
        account_id: req.account?._id || null,
        updatedAt: new Date(),
      }
    };

    if (status) {
      updateData.status = status;
      if (status === 'replied' && !contact.replied_at) {
        updateData.replied_at = new Date();
      }
    }

    if (reply_message) {
      updateData.reply_message = reply_message;
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { $push: { updatedBy: updateData.updatedBy }, ...updateData },
      { new: true }
    ).populate("user_id", "name email");

    res.json({
      success: true,
      message: "Cập nhật liên hệ thành công",
      contact: updatedContact
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật liên hệ:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// DELETE /admin/contacts/:id - Xóa mềm liên hệ
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ"
      });
    }

    res.json({
      success: true,
      message: "Xóa liên hệ thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa liên hệ:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// GET /admin/contacts/stats - Thống kê liên hệ
module.exports.stats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments({ deleted: false });
    const pendingContacts = await Contact.countDocuments({ deleted: false, status: "pending" });
    const repliedContacts = await Contact.countDocuments({ deleted: false, status: "replied" });
    const closedContacts = await Contact.countDocuments({ deleted: false, status: "closed" });

    // Thống kê theo chủ đề
    const subjectStats = await Contact.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Thống kê theo tháng (6 tháng gần nhất)
    const monthlyStats = await Contact.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalContacts,
        pending: pendingContacts,
        replied: repliedContacts,
        closed: closedContacts,
        subjectStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê liên hệ:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

// POST /admin/contacts/:id/reply - Gửi phản hồi
module.exports.reply = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_message } = req.body;

    if (!reply_message || reply_message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phản hồi phải có ít nhất 10 ký tự"
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        status: "replied",
        reply_message: reply_message.trim(),
        replied_at: new Date(),
        $push: {
          updatedBy: {
            account_id: req.account?._id || null,
            updatedAt: new Date(),
          }
        }
      },
      { new: true }
    ).populate("user_id", "name email");

    if (!contact || contact.deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ"
      });
    }

    // TODO: Gửi email phản hồi cho khách hàng
    // await sendReplyEmail(contact.email, contact.reply_message);

    res.json({
      success: true,
      message: "Gửi phản hồi thành công",
      contact
    });
  } catch (error) {
    console.error("Lỗi khi gửi phản hồi:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

