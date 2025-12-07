const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const customerSchema = new Schema(
  {
  
    user_id: { type: Schema.Types.ObjectId, ref: "users", index: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    slug: { type: String, slug: "fullName", unique: true },
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

module.exports = mongoose.model("Address", customerSchema);
