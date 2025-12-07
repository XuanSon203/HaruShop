const Setting = require('../../model/SettingModel');
const fs = require('fs');
const path = require('path');

// Lấy thông tin cài đặt
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin cài đặt',
      error: error.message
    });
  }
};

// Cập nhật thông tin cài đặt
const updateSettings = async (req, res) => {
  try {
    const {
      shopName,
      phone,
      email,
      address,
      description,
      socialMedia,
      businessHours
    } = req.body;

    // Lấy settings hiện tại
    let settings = await Setting.findOne({ isActive: true });
    
    if (!settings) {
      settings = new Setting({});
    }

    // Cập nhật thông tin cơ bản
    if (shopName) settings.shopName = shopName;
    if (phone) settings.phone = phone;
    if (email) settings.email = email;
    if (address) settings.address = address;
    if (description) settings.description = description;

    // Cập nhật social media
    if (socialMedia) {
      if (socialMedia.facebook) settings.socialMedia.facebook = socialMedia.facebook;
      if (socialMedia.instagram) settings.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.youtube) settings.socialMedia.youtube = socialMedia.youtube;
      if (socialMedia.tiktok) settings.socialMedia.tiktok = socialMedia.tiktok;
    }

    // Cập nhật giờ làm việc
    if (businessHours) {
      Object.keys(businessHours).forEach(day => {
        if (settings.businessHours[day]) {
          settings.businessHours[day] = businessHours[day];
        }
      });
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt thành công',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cài đặt',
      error: error.message
    });
  }
};

// Upload logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được tải lên'
      });
    }

    const settings = await Setting.getSettings();
    
    // Xóa logo cũ nếu có
    if (settings.logo) {
      const oldLogoPath = path.join(__dirname, '../../uploads', settings.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Cập nhật logo mới
    settings.logo = req.file.filename;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Upload logo thành công',
      data: {
        logo: settings.logo,
        logoUrl: `/uploads/${settings.logo}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload logo',
      error: error.message
    });
  }
};

// Upload banner images
const uploadBannerImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được tải lên'
      });
    }

    const settings = await Setting.getSettings();
    
    // Xóa banner cũ nếu có
    if (settings.bannerImages && settings.bannerImages.length > 0) {
      settings.bannerImages.forEach(banner => {
        const oldBannerPath = path.join(__dirname, '../../uploads', banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      });
    }

    // Cập nhật banner mới
    const newBanners = req.files.map(file => file.filename);
    settings.bannerImages = newBanners;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Upload banner thành công',
      data: {
        bannerImages: settings.bannerImages,
        bannerUrls: settings.bannerImages.map(banner => `/uploads/${banner}`)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload banner',
      error: error.message
    });
  }
};

// Xóa logo
const deleteLogo = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    if (settings.logo) {
      const logoPath = path.join(__dirname, '../../uploads', settings.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      settings.logo = '';
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Xóa logo thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa logo',
      error: error.message
    });
  }
};

// Xóa banner
const deleteBanner = async (req, res) => {
  try {
    const { bannerName } = req.params;
    const settings = await Setting.getSettings();
    
    if (settings.bannerImages && settings.bannerImages.includes(bannerName)) {
      const bannerPath = path.join(__dirname, '../../uploads', bannerName);
      if (fs.existsSync(bannerPath)) {
        fs.unlinkSync(bannerPath);
      }
      
      settings.bannerImages = settings.bannerImages.filter(banner => banner !== bannerName);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa banner',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadBannerImages,
  deleteLogo,
  deleteBanner
};


