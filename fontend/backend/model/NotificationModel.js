const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    audience: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["order", "service_order", "system"],
      default: "system",
    },
    level: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    service_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderServices",
      default: null,
    },
    action_url: {
      type: String,
      default: "",
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, user_id: 1, status: 1, createdAt: -1 });
notificationSchema.index({
  audience: 1,
  account_id: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("notifications", notificationSchema);
















