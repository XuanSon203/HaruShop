const express = require("express");
const routes = express.Router();
const authController = require("../../controller/admin/AuthController");

// Login route (POST)
routes.post("/login", authController.login);
// Verify token route (GET)
routes.get("/verify", authController.verify);
// Logout route (POST)
routes.post("/logout", authController.logout);

module.exports = routes;
