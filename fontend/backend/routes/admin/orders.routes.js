const express = require('express');
const routes = express.Router();
const ordersController = require('../../controller/admin/OrdersController');

routes.get('/', ordersController.index);
routes.get('/stats', ordersController.stats);
routes.get('/completed', ordersController.getCompletedOrders);
routes.post('/cleanup-invalid-customers', ordersController.cleanupInvalidCustomers);
routes.put('/bulk/status', ordersController.bulkUpdateStatus);
routes.delete('/bulk/permanent', ordersController.bulkPermanentDelete);
routes.delete('/bulk', ordersController.bulkDelete);
routes.put('/:id/status', ordersController.updateStatus);
routes.delete('/:id', ordersController.remove);
routes.delete('/:id/permanent', ordersController.permanentDelete);

module.exports = routes;


