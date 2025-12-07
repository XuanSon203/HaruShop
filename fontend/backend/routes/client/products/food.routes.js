const express = require('express');
const routes = express.Router();
const foodController = require('../../../controller/client/FoodController');

// Public listing of foods for a given tenant (user_id)
routes.get('/', foodController.index);

// Get popular foods - MUST come before /:id route
routes.get('/popular', foodController.popular);

// Get foods by category id
routes.get('/category/:id', foodController.listByCategory);

// Get food detail by id - MUST come last
routes.get("/:id", foodController.detail);

module.exports = routes;
