const express = require('express');
const routes = express.Router();
const orderServicesController = require('../../controller/admin/OrderSevicesController');

routes.get('/', orderServicesController.index);
routes.get('/completed', orderServicesController.getCompletedOrders);
routes.put('/:id/status', orderServicesController.updateStatus);
routes.delete('/:id', orderServicesController.remove);
module.exports = routes;
