const express = require('express');
const routes = express.Router();
const roleController = require('../../controller/admin/RoleController')

routes.get("/",roleController.index);
routes.post("/add",roleController.addRole);
routes.put("/edit/:id",roleController.editRole);
routes.delete("/delete/:id",roleController.deletedRole);
routes.put("/changeStatus/:id",roleController.changeStatus);
routes.get('/:id', roleController.getById);
routes.put('/:id/permissions', roleController.updatePermissions);
module.exports = routes;