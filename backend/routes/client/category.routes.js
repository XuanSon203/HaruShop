const express = require("express");
const routes = express.Router();
const categoryController = require("../../controller/client/CategoryController.js");

// GET /category - Lấy tất cả danh mục cha
routes.get("/", categoryController.getAllParentCategories);

// GET /category/test-auth - Test authentication
routes.get("/test-auth", categoryController.testAuth);

// GET /category/debug-cookies - Debug cookies
routes.get("/debug-cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    url: req.url,
    method: req.method
  });
});

// GET /category/food - Lấy danh mục đồ ăn và các danh mục con
routes.get("/food", categoryController.foods);

// GET /category/food/:id - Lấy sản phẩm theo danh mục cụ thể
routes.get("/food/:id", categoryController.getFoodsByCategory);
routes.get("/accessory", categoryController.accessories);
// GET /category/accessory/:id - Lấy sản phẩm theo danh mục cụ thể
routes.get("/accessory/:id", categoryController.getAccessoriesByCategory);

module.exports = routes;
