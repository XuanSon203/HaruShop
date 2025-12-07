const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "payments" },
   
   
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: false,
    },
      shipping_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },
    customer_info: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: false,
    },
    note: { type: String, default: "" },
  
    return_request: {
      isReturned: {
        type: Boolean,
        default: false,
      },
      return_reason: {
        type: String,
        default: "",
      },
      return_description: { type: String, default: "" },
      requested_at: {
        type: Date,
        default: Date.now,
      },
      requested_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    
    },
    deliveredAt: { type: Date },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipping",
        "shipped",
        "completed",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    products: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        category_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        amount: { type: Number, required: true },
        discount: { type: Number, default: 0 },
      },
    ],
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
    summary: {
      subtotal: { type: Number, required: true },
      voucher_discount: { type: Number, default: 0 },
      shipping_fee: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },

    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
