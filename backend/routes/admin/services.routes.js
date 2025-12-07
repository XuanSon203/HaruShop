const express = require("express");
const routes = express.Router();
const serviceController = require("../../controller/admin/ServiceController");
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/services'); // Thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Đặt tên file
  }
});
const upload = multer({ storage: storage });

routes.get("/", serviceController.index);
routes.post("/add", upload.single("image") ,serviceController.add);
routes.put("/update/:id", upload.single("image"), serviceController.edit);
routes.delete("/deleted/:id", serviceController.deleted);
routes.put("/changeStatus/:id/:status", serviceController.changeStatus);
routes.get("/listServicesDeleted", serviceController.listServicesDeleted);
routes.put("/restore/:id", serviceController.restore);
routes.delete("/forceDelete/:id", serviceController.forceDelete)
module.exports = routes;
