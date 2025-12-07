const express= require('express');
const routes = express.Router();
const paymentController = require('../../controller/admin/PaymentController');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/paymetns'); // Thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    // Đặt tên file duy nhất
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// List payments
routes.get('/', paymentController.index);
// Create payment
routes.post('/add', upload.single("image"), paymentController.add);
// Edit payment
routes.put('/edit/:id',upload.single("image"), paymentController.edit);
// Soft delete payment
routes.delete('/delete/:id', paymentController.delete);

module.exports =routes;