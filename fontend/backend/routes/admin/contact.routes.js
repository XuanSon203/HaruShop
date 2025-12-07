const express = require("express");
const router = express.Router();
const ContactController = require("../../controller/admin/ContactController");
const authMiddleware = require("../../middleware/admin/authMiddlware");

// GET /admin/contacts - Lấy danh sách liên hệ
router.get("/", authMiddleware.requireAuth, ContactController.index);

// GET /admin/contacts/stats - Thống kê liên hệ
router.get("/stats", authMiddleware.requireAuth, ContactController.stats);

// GET /admin/contacts/:id - Lấy chi tiết liên hệ
router.get("/:id", authMiddleware.requireAuth, ContactController.detail);

// PUT /admin/contacts/:id - Cập nhật liên hệ
router.put("/:id", authMiddleware.requireAuth, ContactController.update);

// POST /admin/contacts/:id/reply - Gửi phản hồi
router.post("/:id/reply", authMiddleware.requireAuth, ContactController.reply);

// DELETE /admin/contacts/:id - Xóa liên hệ
router.delete("/:id", authMiddleware.requireAuth, ContactController.delete);

module.exports = router;
