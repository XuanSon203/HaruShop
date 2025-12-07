const express = require('express');
const routes = express.Router();
const controller = require('../../controller/client/PaymentController');

routes.post('/momo/create', controller.createMomoPayment);
routes.get('/methods', controller.listMethods);

module.exports = routes;

