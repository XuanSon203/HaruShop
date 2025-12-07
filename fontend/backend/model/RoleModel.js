const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);
const roleSchema = new Schema(
  {
    role_id: String,
    roleName: String,
    descriptionRole: String,
    status: {
      type: String,
      default: "active",
    },
    deleted: { type: Boolean, default: false },
    permissions: { type: Array, default: "" },
    slug: { type: String, slug: "roleName", unique: true },
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
  {
    timestamps: true,
  }
);
const Role = mongoose.model("roles", roleSchema);
module.exports = Role;
