const express = require("express");
const routes = express.Router();
const userController = require("../../controller/admin/UserController");
const authMiddleware = require("../../middleware/admin/authMiddlware");

// Protected admin routes - require authentication
routes.get("/", authMiddleware.requireAuth, userController.index);
routes.post("/add", authMiddleware.requireAuth, userController.addUser);
routes.put("/edit/:id", authMiddleware.requireAuth, userController.editUser);
routes.delete("/deleted/:id", authMiddleware.requireAuth, userController.deletedUser);
routes.put("/changeStatus/:id/:newStatus", authMiddleware.requireAuth, userController.changeStatus);
routes.get("/userDeleted", authMiddleware.requireAuth, userController.listUserDeleted);
routes.put("/reset/:id", authMiddleware.requireAuth, userController.resetUser);
routes.delete("/force-delete/:id", authMiddleware.requireAuth, userController.deleteUser);

module.exports = routes;
