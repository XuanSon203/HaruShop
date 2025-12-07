const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    type: { type: String, enum: ["food", "accessory"], default: "food" }, // Thêm field type để phân biệt loại sản phẩm
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    sortOrder: { type: Number, default: "" },
    image: { type: String },
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
    status: { type: String, default: "active" },
    slug: { type: String, slug: "name", unique: true },
  },
  { timestamps: true }
);

// Tạo composite unique index cho name + parentId + deleted
categorySchema.index({ name: 1, parentId: 1, deleted: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
