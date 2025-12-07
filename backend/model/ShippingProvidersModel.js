const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shippingSchema = new Schema({
  // 🔹 Tên đơn vị vận chuyển (bắt buộc)
  name: {
    type: String,
    required: true,
    trim: true
  },


  // 🔹 Số điện thoại liên hệ
  phone: {
    type: String,
    trim: true,
    match: /^[0-9]{9,11}$/ // 9–11 số
  },

  // 🔹 Email liên hệ
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },

  // 🔹 Địa chỉ (một số đơn vị có nhiều chi nhánh)
  address: {
    type: [String],
    default: []
  },

  // 🔹 Thời gian giao hàng dự kiến
  estimated_delivery_time: {
    type: String,
    default: '2–3 days'
  },

  // 🔹 Danh sách phương thức giao hàng mà đơn vị này cung cấp
  methods: [
    {
      name: { type: String, required: true },
      price: { type: Number, default: 0, min: 0 },
      estimated_time: { type: String },       
      description: { type: String, trim: true }
    }
  ],

  // 🔹 Trạng thái hoạt động của đơn vị giao hàng
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  deleted:{type:Boolean, default:false}

},{
    timestamps:true
});

// Xuất model
module.exports = mongoose.model('Shipping', shippingSchema);
