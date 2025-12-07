const express = require("express");
const routes = express.Router();
const notificationController = require("../../controller/client/NotificationController");
const authMiddleware = require("../../middleware/client/authMiddlware");

routes.get("/", authMiddleware.requireAuthAPI, notificationController.list);
routes.put(
  "/:id/read",
  authMiddleware.requireAuthAPI,
  notificationController.markAsRead
);
routes.put(
  "/read/all",
  authMiddleware.requireAuthAPI,
  notificationController.markAllAsRead
);

module.exports = routes;
















