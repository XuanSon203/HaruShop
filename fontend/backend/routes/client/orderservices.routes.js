const express = require('express');
const routes = express.Router();
const orderServicesController = require('../../controller/client/OrderSevicesController');
const authMiddleware = require('../../middleware/client/authMiddlware');

// Routes that require authentication
routes.get("/", authMiddleware.requireAuthAPI, orderServicesController.index);
routes.get("/:id", authMiddleware.requireAuthAPI, orderServicesController.detail);
routes.put("/:id/cancel", authMiddleware.requireAuthAPI, orderServicesController.cancel);

// Return request routes

// Rating routes
routes.put("/rating/:id", authMiddleware.requireAuthAPI, orderServicesController.updateRating);
routes.delete("/:id/rating", authMiddleware.requireAuthAPI, orderServicesController.deleteRating);

// Routes that don't require authentication (for guest users)
routes.post("/add", authMiddleware.optionalAuthAPI, orderServicesController.add);

module.exports = routes;
