const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDb = require("./config/connect_MongoDb");
connectDb.connect();
const session = require("express-session");
const path = require("path");
const routesClient = require("./routes/client/index.routes");
const routesAdmin = require("./routes/admin/index.routes");
const app = express();
const port = process.env.PORT ?? 8080;

// CORS cho phép frontend dùng cookie (credentials: "include")
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.100:3000", // Đã thêm IP này
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(
  session({
    secret: "SDSHDSHDS",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
routesClient(app);
routesAdmin(app);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Scheduled task: Cleanup orders with invalid customer_info after 15 minutes
// Chạy mỗi 5 phút để kiểm tra và cleanup các đơn hàng
const setupOrderCleanup = () => {
  const Order = require("./model/OrderModel");
  const Customer = require("./model/AddressModel");
  
  const cleanupInvalidCustomers = async () => {
    try {
      const now = new Date();
      // Tính thời điểm 15 phút trước
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      
      // Tìm các đơn hàng:
      // 1. Có customer_info (không null)
      // 2. Đã tạo từ 15 phút trước trở lên
      // 3. Chưa bị xóa (deleted: false)
      const ordersToCheck = await Order.find({
        deleted: false,
        customer_info: { $ne: null },
        createdAt: { $lte: fifteenMinutesAgo }
      }).select('_id customer_info createdAt').lean();

      if (ordersToCheck.length === 0) {
        return;
      }

      // Lấy danh sách customer_info IDs từ các đơn hàng
      const customerIds = ordersToCheck
        .map(o => o.customer_info)
        .filter(id => id !== null && id !== undefined);

      if (customerIds.length === 0) {
        return;
      }

      // Kiểm tra các customer_info có tồn tại trong database không
      const existingCustomers = await Customer.find({
        _id: { $in: customerIds },
        deleted: false
      }).select('_id').lean();

      const existingCustomerIds = new Set(
        existingCustomers.map(c => String(c._id))
      );

      // Tìm các đơn hàng có customer_info không tồn tại
      const ordersToDelete = ordersToCheck.filter(order => {
        const customerId = String(order.customer_info);
        return !existingCustomerIds.has(customerId);
      });

      if (ordersToDelete.length === 0) {
        return;
      }

      // Chuyển các đơn hàng vào thùng rác (soft delete)
      const orderIdsToDelete = ordersToDelete.map(o => o._id);
      const result = await Order.updateMany(
        { _id: { $in: orderIdsToDelete } },
        {
          deleted: true,
          deletedBy: {
            account_id: null, // Tự động cleanup, không có account
            deletedAt: new Date(),
          },
        }
      );

      console.log(`[AUTO CLEANUP] Đã chuyển ${result.modifiedCount} đơn hàng có customer_info không tồn tại vào thùng rác`);
    } catch (err) {
      console.error("[AUTO CLEANUP] Lỗi khi cleanup đơn hàng:", err);
    }
  };

  // Chạy cleanup ngay khi server khởi động (sau 1 phút để đảm bảo DB đã kết nối)
  setTimeout(() => {
    cleanupInvalidCustomers();
  }, 60000); // 1 phút

  // Sau đó chạy định kỳ mỗi 5 phút
  setInterval(() => {
    cleanupInvalidCustomers();
  }, 5 * 60 * 1000); // 5 phút

  console.log("[AUTO CLEANUP] Đã khởi động scheduled task cleanup đơn hàng (chạy mỗi 5 phút)");
};

// Khởi động cleanup task
setupOrderCleanup();

app.listen(port,'0.0.0.0' ,() => {
  console.log(`Server is running port ${port}`);
});
