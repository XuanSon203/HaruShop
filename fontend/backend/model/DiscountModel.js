const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const timeSlotSchema = new Schema({
  date: { type: String, required: true }, // "2025-08-20"
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }, // "21:00"
});

const discountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, slug: "name", unique: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    value: { type: Number, required: true, min: 0 },
    conditions: {
      minOrderAmount: { type: Number, default: 0 }, // ví dụ: 500000 (>= 500k mới áp dụng)
      maxDiscount: { type: Number, default: null }, // giới hạn số tiền giảm tối đa
      applyOncePerUser: { type: Boolean, default: false }, // chỉ áp dụng 1 lần / người dùng
    },

    type: { type: String, enum: ["percent", "amount"], default: "percent" },
    timeSlots: { type: [timeSlotSchema], validate: (v) => v.length > 0 },
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
    deleted: { type: Boolean, default: false },

  },
  { timestamps: true }
);

const Discount = mongoose.model("discounts", discountSchema);
module.exports = Discount;
