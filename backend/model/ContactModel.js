const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    index: true,
  },
  name: {
    type: String,
    required: [true, "Tên là bắt buộc"],
    trim: true,
    maxlength: [100, "Tên không được vượt quá 100 ký tự"]
  },
  email: {
    type: String,
    required: [true, "Email là bắt buộc"],
    trim: true,
    lowercase: true,
    maxlength: [100, "Email không được vượt quá 100 ký tự"],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ"]
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại là bắt buộc"],
    trim: true,
    maxlength: [20, "Số điện thoại không được vượt quá 20 ký tự"]
  },
  subject: {
    type: String,
    required: [true, "Chủ đề là bắt buộc"],
    trim: true,
    maxlength: [200, "Chủ đề không được vượt quá 200 ký tự"],
    enum: {
      values: ["general", "product", "service", "order", "complaint", "suggestion", "other"],
      message: "Chủ đề không hợp lệ"
    }
  },
  message: {
    type: String,
    required: [true, "Nội dung tin nhắn là bắt buộc"],
    trim: true,
    minlength: [10, "Nội dung tin nhắn phải có ít nhất 10 ký tự"],
    maxlength: [2000, "Nội dung tin nhắn không được vượt quá 2000 ký tự"]
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "replied", "closed"],
      message: "Trạng thái không hợp lệ"
    },
    default: "pending"
  },
  reply_message: {
    type: String,
    trim: true,
    maxlength: [2000, "Nội dung phản hồi không được vượt quá 2000 ký tự"]
  },
  ip_address: {
    type: String,
    maxlength: [45, "Địa chỉ IP không hợp lệ"]
  },
  user_agent: {
    type: String,
    maxlength: [500, "User agent không hợp lệ"]
  },
  replied_at: {
    type: Date
  },
  deleted: { type: Boolean, default: false },
  createdBy: {
    account_id: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  updatedBy: [
    {
      account_id: String,
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deletedBy: {
    account_id: String,
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ subject: 1 });

// Virtual for formatted created date
contactSchema.virtual('formatted_created_at').get(function() {
  return this.created_at ? this.created_at.toLocaleDateString('vi-VN') : '';
});

// Virtual for formatted replied date
contactSchema.virtual('formatted_replied_at').get(function() {
  return this.replied_at ? this.replied_at.toLocaleDateString('vi-VN') : '';
});

// Virtual for subject display name
contactSchema.virtual('subject_display').get(function() {
  const subjectMap = {
    general: "Thông tin chung",
    product: "Hỏi về sản phẩm",
    service: "Hỏi về dịch vụ",
    order: "Hỏi về đơn hàng",
    complaint: "Khiếu nại",
    suggestion: "Góp ý",
    other: "Khác"
  };
  return subjectMap[this.subject] || this.subject;
});

// Virtual for status display name
contactSchema.virtual('status_display').get(function() {
  const statusMap = {
    pending: "Chờ phản hồi",
    replied: "Đã phản hồi",
    closed: "Đã đóng"
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Set replied_at when status changes to replied
  if (this.isModified('status') && this.status === 'replied' && !this.replied_at) {
    this.replied_at = new Date();
  }
  
  next();
});

module.exports = mongoose.model("Contact", contactSchema);
