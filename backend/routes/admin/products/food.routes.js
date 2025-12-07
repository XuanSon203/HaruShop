const express = require('express');
const routes = express.Router();
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/foods'); // Thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    // Đặt tên file duy nhất
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const foodController = require('../../../controller/admin/FoodController');

// Cấu hình nơi lưu ảnh


// Lấy danh sách món ăn
routes.get("/", foodController.index);

// Upload cả ảnh đại diện và ảnh phụ
routes.post(
  "/add",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 }     
  ]),
  foodController.addFood
);
routes.put("/changeStatus/:id/:status", foodController.changeStatus);
routes.delete("/deleted/:id", foodController.deleted);
routes.put(
  "/edit/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 }     
  ]),
  foodController.editFood
);
routes.get("/deleted", foodController.listFoodDeleted)
routes.put("/restore/:id", foodController.restoreFood);
routes.delete("/force/:id", foodController.forceFood)

// Voucher management routes
routes.get('/vouchers', foodController.getVouchers);
routes.put('/:id/voucher', foodController.assignVoucher);
routes.delete('/:id/voucher', foodController.removeVoucher);

module.exports = routes;
