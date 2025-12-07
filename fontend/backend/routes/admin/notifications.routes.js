const express = require("express");
const routes = express.Router();
const notificationController = require("../../controller/admin/NotificationController");

routes.get("/", notificationController.list);
routes.put("/:id/read", notificationController.markAsRead);
routes.put("/read/all", notificationController.markAllAsRead);

module.exports = routes;
















