const express = require("express");
const multer = require("multer");
const path = require("path");
const routes = express.Router();
const userController = require("../../controller/client/UserController");
// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép upload file hình ảnh"), false);
    }
  },
});

// Auth routes
routes.post("/register", userController.register);
routes.post("/login", userController.login);
routes.post("/logout", userController.logout);
routes.post("/forgot-password",userController.forgotPassword);
routes.post("/verify-otp", userController.verifyOtp);
routes.post("/reset-password", userController.resetPassword);
// User info routes
routes.get("/", userController.index); // Get current user info
routes.put("/profile", userController.updateProfile); // Update profile
routes.put("/password", userController.changePassword); // Change password
routes.post("/avatar", upload.single("avatar"), userController.uploadAvatar); 

module.exports = routes;
