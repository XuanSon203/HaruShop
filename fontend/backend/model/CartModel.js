const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    user_id: { type: String, required: true },
    products: [
      {
        product_id: { type: String,  }, // _id của sản phẩm
        category_id: { type: String }, // 👈 thêm field để lưu category_id của sản phẩm
        quantity: { type: Number, default: 1 },
        price_original: { type: Number, required: true }, // Giá gốc tại thời điểm thêm
        discount_percent: { type: Number, default: 0 },   // % giảm giá
        price_after_discount: { type: Number, required: true }, // Giá sau giảm
        selected: { type: Boolean, default: true },
      },
    ],
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
  },
  { timestamps: true }
);

const Cart = mongoose.model("cart", cartSchema);
module.exports = Cart;
