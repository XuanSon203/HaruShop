const express = require('express');
const routes = express.Router();
const discountController = require('../../controller/client/DiscountController');

routes.get("/active", discountController.getActiveVouchers);
routes.get("/validate/:code", discountController.validateVoucher);
routes.post("/validate", discountController.validateDiscount);

module.exports = routes;
