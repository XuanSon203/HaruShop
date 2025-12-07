const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const Schema = mongoose.Schema;

const accessoriesSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    is_featured: { type: Boolean, default: false },
    shipping_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping", // Tên model bạn đã tạo trong shipping.model.js
    },
    discount_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "discounts",
    },
    thumbnail: { type: String },
    images: [{ type: String }],
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    sold_count: { type: Number, default: 0 },
    sold_count_last_month: { type: Number, default: 0 },
    material: { type: String },
    size: { type: String },
    color: { type: String },
    brand: { type: String },
    warranty: { type: String },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    rated_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    user_id: { type: String },
    isNew: { type: Boolean, default: false },
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
    status: { type: String, default: "active" },
    slug: { type: String, slug: "name", unique: true },
  },
  { timestamps: true }
);

const Accessory = mongoose.model("Accessory", accessoriesSchema);
module.exports = Accessory;
