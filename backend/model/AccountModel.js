const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug= require("mongoose-slug-updater");
mongoose.plugin(slug);
const generate = require('../helpers/generrate')
const accountSchema = new Schema(
  {
    userName:String,
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    password: { type: String },
    deleted: { type: Boolean, default: false },
    role_id: { type: String, default: "" },
    token: {
      type: String,
      default: generate.generateRandomString(20),
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
    status: {
      type: String,
      default: "active",
    },
    slug:{type:String, slug:"fullName", unique:true},
    
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);
const Account = mongoose.model("accounts", accountSchema);
module.exports = Account;
