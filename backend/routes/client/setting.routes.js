const express = require('express');
const router = express.Router();
const SettingController = require('../../controller/client/SettingController');

// Lấy thông tin cài đặt công khai
router.get('/', SettingController.getPublicSettings);

module.exports = router;


