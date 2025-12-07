const express = require('express');
const routes = express.Router();
const orderController = require('../../controller/client/OrderController');
const authMiddleware = require('../../middleware/client/authMiddlware');

routes.get("/", orderController.index);
routes.get("/stream", orderController.stream);
routes.post("/add", orderController.add);
routes.post("/rate", orderController.rateProduct);
routes.get("/:id", orderController.getDetail);
routes.put("/:id/cancel", orderController.cancel);


routes.post("/return", authMiddleware.requireAuthAPI, orderController.requestReturn);
routes.get("/returns", authMiddleware.requireAuthAPI, orderController.getReturnRequests);

module.exports = routes;