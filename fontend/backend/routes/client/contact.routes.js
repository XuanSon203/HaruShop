const express = require("express");
const router = express.Router();
const ContactController = require("../../controller/client/ContactController");
const authMiddleware = require("../../middleware/client/authMiddlware");

// POST /contact - Gửi liên hệ
router.post("/", ContactController.submit);

// GET /contact/status/:id - Kiểm tra trạng thái liên hệ
router.get("/status/:id", ContactController.checkStatus);

// GET /contact/search - Tìm kiếm liên hệ theo email (chỉ tài khoản hiện tại)
router.get("/search", authMiddleware.requireAuthAPI, ContactController.search);

// GET /contact/user-contacts - Lấy liên hệ của tài khoản hiện tại
router.get("/user-contacts", authMiddleware.requireAuthAPI, ContactController.getUserContacts);

// GET /contact/all-responses - Lấy tất cả phản hồi của tài khoản hiện tại
router.get(
  "/all-responses",
  authMiddleware.requireAuthAPI,
  ContactController.getAllResponses
);

module.exports = router;