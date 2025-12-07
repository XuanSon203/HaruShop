const express = require('express');
const routes = express.Router();
const accountController = require('../../controller/admin/AccountController');

routes.get("/", accountController.index);
routes.post("/add", accountController.add);
routes.put("/update/:id", accountController.update);
routes.delete("/deleted/:id",accountController.deleted);
routes.put("/changeStatus/:id/:newStatus", accountController.changeStatus);
routes.get("/accountDeleted",accountController.accountDeleted);
routes.put("/reset/:id", accountController.resetUser);
routes.delete("/force-delete/:id", accountController.deleteUser)
// Admin login endpoint to match FE path /admin/accounts/login
module.exports = routes;
