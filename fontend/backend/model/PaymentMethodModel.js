const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);


const paymentMethodSchema = new Schema(
  {
    name: { type: String, required: true },
    description:{type:String},
    image:String,
    status:{type:Boolean, default:false},
    deleted: { type: Boolean, default: false },
    // Tracking
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
    slug:{type:String , slug:"name",unique: true}
  },
  { timestamps: true }
);

module.exports = mongoose.model("payments", paymentMethodSchema);


