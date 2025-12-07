const express = require("express");
const routes = express.Router();
const cartController = require("../../controller/client/CartController");
const middlewareCart = require("../../middleware/client/cartMiddleware");
routes.use(middlewareCart.cartId);

routes.get("/", cartController.index);
routes.post("/addCart", cartController.add);
routes.delete("/remove/:productId", cartController.deleteItem);
routes.put(
  "/update-quantity/:productId/:newQuantity",
  cartController.updateQuantity
);
routes.delete("/clear", cartController.clear);
module.exports = routes;
