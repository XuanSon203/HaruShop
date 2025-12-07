const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: true,
    default: 'HaruShop'
  },
  logo: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  bannerImages: {
    type: [String],
    default: []
  },
  socialMedia: {
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    youtube: {
      type: String,
      default: ''
    },
    tiktok: {
      type: String,
      default: ''
    }
  },
  businessHours: {
    monday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    tuesday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    wednesday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    thursday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    friday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    saturday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    sunday: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Đảm bảo chỉ có một bản ghi settings duy nhất
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = new this({});
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
