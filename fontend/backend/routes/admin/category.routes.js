const express = require('express');
const routes = express.Router();
const categoryController = require('../../controller/admin/CategoryController');
const multer  = require('multer');

// Cấu hình Multer để giữ tên file và phần mở rộng
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

routes.get("/", categoryController.index);
routes.post("/add", upload.single('image'), categoryController.add);
routes.put("/update/:id", upload.single('image'), categoryController.updateCategory);
routes.delete("/deleted/:id", categoryController.deleted)
routes.get("/listCategoryDeleted", categoryController.listCategoryDeleted);
routes.patch("/reset/:id", categoryController.resetCategory);
routes.delete("/delete/:id", categoryController.deleteCategory);
routes.patch("/changeStatus/:id/:status", categoryController.changeStatus);
routes.put("/sortOrder/:id", categoryController.changePosition);
module.exports = routes;
