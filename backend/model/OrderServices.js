const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const OrderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
       
    services: [
      {
        services_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "services",
          required: true,
        },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        petName: { type: String },
        typePet: { type: String },
        agePet: { type: Number },
        dateOrder: { type: Date },
        hoursOrder: { type: Date },
        note: { type: String },
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
  
    deliveredAt: { type: Date },
    is_rating: { type: Boolean, default: false },
    rating: {
      score: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: null 
      },
      comment: { 
        type: String, 
        maxlength: 500,
        default: "" 
      },
      rated_at: { 
        type: Date 
      },
      updated_at: {
        type: Date
      },
      rated_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users" 
      },
      images: [{ 
        type: String 
      }],
      is_updated: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "credit_card", "e_wallet", "other"],
      default: null,
    },
    deleted: { type: Boolean, default: false },
    summary: {
      subtotal: { type: Number, default: 0 },
      discount_amount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("orderServices", OrderSchema);
