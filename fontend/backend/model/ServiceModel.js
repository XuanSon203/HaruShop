const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    serviceName: { type: String },
    description: { type: String },
    price: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    image: { type: String },
    deleted: { type: Boolean, default: false },
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
    sold_count:{type:Number, default:0},
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
    slug: { type: String, slug: "serviceName", unique: true },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model("services", serviceSchema);
module.exports = Service;
