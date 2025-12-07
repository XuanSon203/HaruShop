const userRouter = require("./user.routes");
const systemConfig = require('../../config/sysstem');
const categoryRouter = require('./category.routes')
const roleRouter= require('./role.routes');
const serviceRouter = require('./services.routes');
const discountRouter = require('./discount.routes');
const foodRouter= require('./products/food.routes');
const accessoryRouter = require('./products/accessory.routes');
const accountRouter = require('./accounts.routes');
const ordersRouter = require('./orders.routes');
const orderServicesRouter = require('./orderservices.routes');
const dashboardRouter = require('./dashboard.routes');
const authRouter = require('./auth.routes');
const customersRouter = require('./customers.routes');
const contactRouter = require('./contact.routes');
const paymentRouter = require('./payment.routes');
const shippingRouter = require('./shipping.routes');
const settingRouter = require('./setting.routes');
const reverseRouter = require('./reverse.routes');
const notificationsRouter = require('./notifications.routes');
const authMiddleware = require('../../middleware/admin/authMiddlware');
module.exports  =(app)=>{
    const admin = systemConfig.prefixAdmin;
    app.use(`${admin}/auth`, authRouter);
    app.use(`${admin}/users`,authMiddleware.requireAuth,userRouter);
    app.use(`${admin}/roles`,authMiddleware.requireAuth,roleRouter)
    app.use(`${admin}/category`,authMiddleware.requireAuth,categoryRouter)
    app.use(`${admin}/discounts`,authMiddleware.requireAuth,discountRouter)
    app.use(`${admin}/services`,authMiddleware.requireAuth,serviceRouter)
    app.use(`${admin}/products/food`,authMiddleware.requireAuth,foodRouter)
    app.use(`${admin}/products/accessory`,authMiddleware.requireAuth, accessoryRouter)
    app.use(`${admin}/accounts`, authMiddleware.requireAuth,accountRouter)
    app.use(`${admin}/orders`, authMiddleware.requireAuth,ordersRouter)
    app.use(`${admin}/orderservices`, authMiddleware.requireAuth,orderServicesRouter)
    app.use(`${admin}/dashboard`,authMiddleware.requireAuth, dashboardRouter)
    app.use(`${admin}/customers`, authMiddleware.requireAuth,customersRouter)
    app.use(`${admin}/contacts`, authMiddleware.requireAuth,contactRouter)
    app.use(`${admin}/payments`, authMiddleware.requireAuth,paymentRouter)
    app.use(`${admin}/shipping`, authMiddleware.requireAuth, shippingRouter)
    app.use(`${admin}/settings`, authMiddleware.requireAuth, settingRouter)
    app.use(`${admin}/reverse`, authMiddleware.requireAuth, reverseRouter)
    app.use(`${admin}/notifications`, authMiddleware.requireAuth, notificationsRouter)

}




