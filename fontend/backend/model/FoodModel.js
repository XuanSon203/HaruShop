const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const Schema = mongoose.Schema;

const foodSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    user_id: { type: String },
    is_featured: { type: Boolean, default: false },
    shipping_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping", // Tên model bạn đã tạo trong shipping.model.js
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    discount_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "discounts",
    },
    isNew: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    rated_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },
    description: { type: String },
    weight: { type: Number },
    unit: { type: String },
    thumbnail: { type: String },
    size: String,
    images: { type: Array, default: [] },
    sold_count: { type: Number, default: 0 },
    sold_count_last_month: { type: Number, default: 0 },
    manufacture_date: { type: Date },
    expiry_date: { type: Date },
    origin: { type: String },
    brand: { type: String },
    ingredients: { type: String },
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
    slug: { type: String, slug: "name", unique: true },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Food = mongoose.model("foods", foodSchema);
module.exports = Food;
