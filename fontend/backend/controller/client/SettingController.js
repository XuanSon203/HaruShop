const Setting = require('../../model/SettingModel');

// Lấy thông tin cài đặt công khai (không cần xác thực)
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    // Chỉ trả về thông tin công khai, không trả về thông tin nhạy cảm
    const publicSettings = {
      shopName: settings.shopName,
      logo: settings.logo,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      description: settings.description,
      bannerImages: settings.bannerImages,
      socialMedia: settings.socialMedia,
      businessHours: settings.businessHours
    };

    res.status(200).json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin cài đặt',
      error: error.message
    });
  }
};

module.exports = {
  getPublicSettings
};


