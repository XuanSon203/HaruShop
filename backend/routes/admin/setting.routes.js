const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const SettingController = require('../../controller/admin/SettingController');
const authMiddleware = require('../../middleware/admin/authMiddlware');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép upload file ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file ảnh!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
});

// Middleware xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn! Kích thước tối đa là 5MB.'
      });
    }
  }
  if (err.message === 'Chỉ được upload file ảnh!') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

// Áp dụng middleware xác thực cho tất cả routes
router.use(authMiddleware.requireAuth);

// Lấy thông tin cài đặt
router.get('/', SettingController.getSettings);

// Cập nhật thông tin cài đặt
router.put('/', SettingController.updateSettings);

// Upload logo
router.post('/upload-logo', upload.single('logo'), handleMulterError, SettingController.uploadLogo);

// Upload banner images
router.post('/upload-banners', upload.array('banners', 5), handleMulterError, SettingController.uploadBannerImages);

// Xóa logo
router.delete('/logo', SettingController.deleteLogo);

// Xóa banner
router.delete('/banner/:bannerName', SettingController.deleteBanner);

module.exports = router;
