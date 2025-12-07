const express = require('express');
const routes = express.Router();
const DashboardController = require('../../controller/admin/DashboardController');

// GET /admin/dashboard/stats
routes.get('/stats', DashboardController.stats);

// GET /admin/dashboard/revenue
routes.get('/revenue', DashboardController.revenue);

// GET /admin/dashboard/statistics/products
routes.get('/statistics/products', DashboardController.productStatistics);

// GET /admin/dashboard/statistics/customers
routes.get('/statistics/customers', DashboardController.customerStatistics);

// GET /admin/dashboard/statistics/orders
routes.get('/statistics/orders', DashboardController.orderStatistics);

// POST /admin/dashboard/update-stock
routes.post('/update-stock', DashboardController.updateStock);

module.exports = routes;


