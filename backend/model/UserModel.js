const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const generate = require("../helpers/generrate");
const userSchema = mongoose.Schema(
  {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    password: { type: String },
    avatar: { type: String },
    deleted: { type: Boolean, default: false },
    tokenUser: {
      type: String,
      default: generate.generateRandomString(20),
    },
    status: {
      type: String,
      default: "active",
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
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
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("users", userSchema);
module.exports = User;
