const express = require("express");
const routes = express.Router();
const serviceController = require("../../controller/client/ServiceController");

routes.get("/", serviceController.index);

// Get popular services - MUST come before /:id route
routes.get('/popular', serviceController.popular);

// Get services by category id
routes.get('/category/:id', serviceController.listByCategory);

// Get service reviews - MUST come before /:id route
routes.get('/:id/reviews', serviceController.getReviews);

// Get service detail by id - MUST come last
routes.get("/:id", serviceController.detail);

module.exports = routes;
