const express = require('express');
const routes = express.Router();
const discountController = require('../../controller/admin/DiscountController');

routes.get("/", discountController.index);
routes.post("/add", discountController.add);
routes.put("/edit/:id", discountController.edit);
routes.delete("/deleted/:id", discountController.deleted);
routes.patch("/changeStatus/:id", discountController.changeStatus);
routes.get('/listDiscountDeleted', discountController.listDiscountDeleted);
routes.delete("/permanentDelete/:id", discountController.delete);
routes.patch("/restore/:id", discountController.restore);
module.exports = routes;