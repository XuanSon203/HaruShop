const Contact = require("../../model/ContactModel");

// POST /contact - Gửi liên hệ
module.exports.submit = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ"
      });
    }

    // Validate phone format (basic)
    const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      });
    }

    // Validate subject
    const validSubjects = ["general", "product", "service", "order", "complaint", "suggestion", "other"];
    if (!validSubjects.includes(subject)) {
      return res.status(400).json({
        success: false,
        message: "Chủ đề không hợp lệ"
      });
    }

    // Validate message length
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Nội dung tin nhắn phải từ 10 đến 2000 ký tự"
      });
    }

    // Get client IP and User Agent
    const ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const user_agent = req.get('User-Agent') || '';

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject,
      message: message.trim(),
      ip_address,
      user_agent,
      status: "pending"
    };

    if (req.user && req.user._id) {
      contactData.user_id = req.user._id;
      if (req.user.email) {
        contactData.email = req.user.email.toLowerCase();
      }
    }

    // Create contact
    const contact = new Contact(contactData);

    const savedContact = await contact.save();

    res.status(201).json({
      success: true,
      message: "Gửi liên hệ thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.",
      contact: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        subject: savedContact.subject,
        status: savedContact.status,
        createdAt: savedContact.createdAt
      }
    });

  } catch (error) {
    console.error("Submit contact error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server. Vui lòng thử lại sau."
    });
  }
};

// GET /contact/status/:id - Kiểm tra trạng thái liên hệ
module.exports.checkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id).select('name email subject status reply_message replied_at createdAt');

    if (!contact || contact.deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ"
      });
    }

    res.json({
      success: true,
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        reply_message: contact.reply_message,
        replied_at: contact.replied_at,
        createdAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error("Check contact status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};

// GET /contact/search - Tìm kiếm liên hệ theo email
module.exports.search = async (req, res) => {
  try {
    const { email } = req.query;
    const user = req.user;

    if (!user || !user.email) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để tìm kiếm liên hệ"
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email để tìm kiếm"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ"
      });
    }

    const extraConditions = email
      ? [{ email: email.toLowerCase().trim() }]
      : [];
    const query = buildUserContactQuery(user, extraConditions);

    // Tìm kiếm liên hệ theo email trong phạm vi tài khoản hiện tại
    const contacts = await Contact.find(query)
    .select('name email subject message status reply_message replied_at createdAt')
    .sort({ createdAt: -1 })
    .limit(10); // Giới hạn 10 kết quả gần nhất

    res.json({
      success: true,
      contacts: contacts.map(contact => ({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        reply_message: contact.reply_message,
        replied_at: contact.replied_at,
        createdAt: contact.createdAt
      }))
    });

  } catch (error) {
    console.error("Search contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};

// GET /contact/user-contacts - Lấy liên hệ của tài khoản hiện tại
const buildUserContactQuery = (user, extraConditions = []) => {
  const conditions = [{ deleted: false }, ...extraConditions];

  if (user && user._id) {
    const ownershipConditions = [{ user_id: user._id }];

    if (user.email) {
      ownershipConditions.push({
        email: user.email.toLowerCase(),
        $or: [{ user_id: { $exists: false } }, { user_id: null }],
      });
    }

    conditions.push({ $or: ownershipConditions });
  } else if (user && user.email) {
    conditions.push({
      email: user.email.toLowerCase(),
      $or: [{ user_id: { $exists: false } }, { user_id: null }],
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
};

module.exports.getUserContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Lấy thông tin user từ middleware (đã được xác thực)
    const user = req.user;
    
    if (!user || !user.email) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin tài khoản"
      });
    }

    const query = buildUserContactQuery(user);

    // Lấy tất cả liên hệ của user này theo email hoặc user_id
    const contacts = await Contact.find(query)
    .select('name email subject message status reply_message replied_at createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Đếm tổng số liên hệ của user
    const totalContacts = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts: contacts.map(contact => ({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        reply_message: contact.reply_message,
        replied_at: contact.replied_at,
        createdAt: contact.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalContacts / limit),
        totalContacts,
        limit
      }
    });

  } catch (error) {
    console.error("Get user contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};

// GET /contact/all-responses - Lấy tất cả phản hồi (chỉ những liên hệ đã có phản hồi)
module.exports.getAllResponses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = req.user;
    if (!user || !user.email) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin tài khoản"
      });
    }

    const statusCondition = { $or: [{ status: "replied" }, { status: "closed" }] };
    const baseQuery = buildUserContactQuery(user, [statusCondition]);

    const contacts = await Contact.find(baseQuery)
      .select(
        "name email subject message status reply_message replied_at createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalContacts = await Contact.countDocuments(baseQuery);

    res.json({
      success: true,
      contacts: contacts.map((contact) => ({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        reply_message: contact.reply_message,
        replied_at: contact.replied_at,
        createdAt: contact.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalContacts / limit),
        totalContacts,
        limit,
      },
    });
  } catch (error) {
    console.error("Get all responses error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};