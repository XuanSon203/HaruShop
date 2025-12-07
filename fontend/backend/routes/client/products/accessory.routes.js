const express = require('express');
const routes = express.Router();
const accessoriesController = require('../../../controller/client/AccessoriesController');

routes.get("/", accessoriesController.index);

// Get popular accessories - MUST come before /:slug and /:id routes
routes.get('/popular', accessoriesController.popular);

// Get accessories by category id
routes.get('/category/:id', accessoriesController.listByCategory);

// Get accessory detail by slug - MUST come before /:id route
routes.get("/:slug", accessoriesController.detail);

// Get accessory detail by id - MUST come last
routes.get("/:id", accessoriesController.detailId);

module.exports = routes;
