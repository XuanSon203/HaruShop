const userRouter = require("./user.routes");
const homeRouter = require("./home.routes");
const foodRouter = require("./products/food.routes");
const accessoryRouter = require("./products/accessory.routes");
const categoryRouter = require("./category.routes");
const servicesRouter = require("./services.routes");
const cartRouter = require("./cart.routes");
const customerRouter = require("./customer.routes");
const orderRouter = require("./order.routes");
const orderServicesRouter = require("./orderservices.routes");
const discountRouter = require("./discount.routes");
const contactRouter = require("./contact.routes");
const searchRouter = require("./search.routes");
const paymentRouter = require("./payment.routes");
const shippingRouter = require("./shipping.routes");
const settingRouter = require("./setting.routes");
const notificationRouter = require("./notification.routes");
const requireAuth = require("../../middleware/client/authMiddlware").requireAuthAPI;
module.exports = (app) => {
  app.use("/user", userRouter);
  app.use("/", homeRouter);
  // Public product catalogs for storefront
  app.use("/foods", foodRouter);
  app.use("/products/food", foodRouter);
  app.use("/category", categoryRouter);
  app.use("/categories", categoryRouter); // Alias for frontend compatibility
  app.use("/accessories", accessoryRouter);
  app.use("/products/accessory", accessoryRouter);
  app.use("/services", servicesRouter);
  app.use("/cart", cartRouter);
  app.use("/customer", customerRouter);
  app.use("/orders", orderRouter);
  app.use("/orderservices", orderServicesRouter);
  app.use("/discount", discountRouter);
  app.use("/contact", contactRouter);
  app.use("/search", searchRouter);
  app.use("/payment", paymentRouter);
  // Public shipping for storefront (active providers only at controller level)
  app.use("/shipping", shippingRouter);
  // Public settings for storefront
  app.use("/settings", settingRouter);
  app.use("/notifications", notificationRouter);
};
