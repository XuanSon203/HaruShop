const express = require('express');
const routes = express.Router();
const ReverseController = require('../../controller/admin/ReverseController');

// GET /admin/reverse/revenue?period=day|week|month|year
routes.get('/revenue', ReverseController.revenue);

module.exports = routes;

