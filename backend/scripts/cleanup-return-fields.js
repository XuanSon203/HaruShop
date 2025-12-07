// Script để cleanup các trường return cũ và cập nhật cấu trúc mới
const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/harushop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Order = require('../model/OrderModel');
const OrderServices = require('../model/OrderServices');

async function cleanupReturnFields() {
  try {
    console.log('🧹 Starting cleanup of old return fields...\n');

    // 1. Cleanup Orders collection
    console.log('📦 Processing Orders collection...');
    const orders = await Order.find({
      $or: [
        { isReturned: { $exists: true } },
        { returnReason: { $exists: true } },
        { return_description: { $exists: true } },
        { return_reason: { $exists: true } }
      ]
    });

    console.log(`Found ${orders.length} orders with old return fields`);

    for (const order of orders) {
      console.log(`Processing order ${order._id}...`);
      
      // Nếu chưa có return_request object, tạo mới từ các trường cũ
      if (!order.return_request && (order.return_reason || order.returnReason)) {
        order.return_request = {
          status: "pending",
          reason: order.return_reason || order.returnReason || "",
          description: order.return_description || "",
          requested_at: order.returnRequestedAt || new Date(),
          requested_by: order.user_id
        };
      }

      // Xóa các trường cũ
      order.isReturned = undefined;
      order.returnReason = undefined;
      order.return_description = undefined;
      order.return_reason = undefined;
      order.returnRequestedAt = undefined;

      await order.save();
      console.log(`✅ Updated order ${order._id}`);
    }

    // 2. Cleanup OrderServices collection
    console.log('\n📦 Processing OrderServices collection...');
    const serviceOrders = await OrderServices.find({
      $or: [
        { isReturned: { $exists: true } },
        { returnReason: { $exists: true } },
        { return_description: { $exists: true } },
        { return_reason: { $exists: true } }
      ]
    });

    console.log(`Found ${serviceOrders.length} service orders with old return fields`);

    for (const order of serviceOrders) {
      console.log(`Processing service order ${order._id}...`);
      
      // Nếu chưa có return_request object, tạo mới từ các trường cũ
      if (!order.return_request && (order.return_reason || order.returnReason)) {
        order.return_request = {
          status: "pending",
          reason: order.return_reason || order.returnReason || "",
          description: order.return_description || "",
          requested_at: order.returnRequestedAt || new Date(),
          requested_by: order.user_id
        };
      }

      // Xóa các trường cũ
      order.isReturned = undefined;
      order.returnReason = undefined;
      order.return_description = undefined;
      order.return_reason = undefined;
      order.returnRequestedAt = undefined;

      await order.save();
      console.log(`✅ Updated service order ${order._id}`);
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`- Orders processed: ${orders.length}`);
    console.log(`- Service orders processed: ${serviceOrders.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy cleanup
cleanupReturnFields();
