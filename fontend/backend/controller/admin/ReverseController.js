const Order = require("../../model/OrderModel");
const OrderServices = require("../../model/OrderServices");

// GET /admin/reverse/revenue?period=day|week|month|year
module.exports.revenue = async (req, res) => {
  try {
    const { period = "day" } = req.query;
    const now = new Date();
    let startDate, endDate;
    let groupFormat = "";
    let labels = [];
    
    // Xác định khoảng thời gian và format group
    switch (period) {
      case "day":
        // 7 ngày gần nhất, group theo giờ
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d";
        // Tạo labels cho 7 ngày
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" }));
        }
        break;
      case "week":
        // 4 tuần gần nhất, group theo tuần (tuần bắt đầu từ thứ 2)
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Thứ 2, 6 = Chủ nhật
        startDate.setDate(startDate.getDate() - dayOfWeek - 21); // Lùi về 4 tuần trước
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d"; // Group theo ngày, sau đó sẽ aggregate lại theo tuần
        // Tạo labels cho 4 tuần
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          labels.push(
            `${weekStart.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })} - ${weekEnd.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}`
          );
        }
        break;
      case "month":
        // 12 tháng gần nhất (bao gồm tháng hiện tại), group theo tháng
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 11,
          1,
          0,
          0,
          0,
          0
        );
        groupFormat = "%Y-%m";
        // Tạo labels cho 12 tháng
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(d.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }));
        }
        break;
      case "year":
        // 5 năm gần nhất, group theo năm
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        startDate = new Date(now.getFullYear() - 4, 0, 1, 0, 0, 0, 0);
        groupFormat = "%Y";
        // Tạo labels cho 5 năm
        for (let i = 4; i >= 0; i--) {
          labels.push(String(now.getFullYear() - i));
        }
        break;
      default:
        return res.status(400).json({ success: false, message: "Period không hợp lệ" });
    }

    // Helper function để aggregate data theo period
    // CHỈ TÍNH CÁC ĐƠN CÓ summary.total > 0 (đã được filter ở matchQuery)
    const aggregateByPeriod = async (model, matchQuery, period, groupFormat, now, startDate) => {
      if (period === "week") {
        const dayAgg = await model.aggregate([
          { $match: matchQuery },
          {
            // Thêm filter bổ sung để đảm bảo chỉ tính các đơn có total > 0
            $match: {
              "summary.total": { $exists: true, $type: "number", $gt: 0 }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$summary.total" }, // Không cần $ifNull vì đã filter rồi
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        const weekMap = new Map();
        const dayOfWeek = (now.getDay() + 6) % 7;
        const weekStartBase = new Date(now);
        weekStartBase.setDate(now.getDate() - dayOfWeek - 21);
        weekStartBase.setHours(0, 0, 0, 0);

        for (let i = 0; i < 4; i++) {
          const weekKey = `${i}`;
          weekMap.set(weekKey, { revenue: 0, count: 0 });
        }

        dayAgg.forEach((item) => {
          const itemDate = new Date(item._id + "T00:00:00");
          const diffDays = Math.floor((itemDate - weekStartBase) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(diffDays / 7);
          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `${weekIndex}`;
            const week = weekMap.get(weekKey) || { revenue: 0, count: 0 };
            week.revenue += item.revenue || 0;
            week.count += item.count || 0;
            weekMap.set(weekKey, week);
          }
        });

        return Array.from(weekMap.entries()).map(([weekIndex, data]) => ({
          period: weekIndex,
          revenue: data.revenue,
          count: data.count,
        }));
      } else {
        return await model.aggregate([
          { $match: matchQuery },
          {
            // Thêm filter bổ sung để đảm bảo chỉ tính các đơn có total > 0
            $match: {
              "summary.total": { $exists: true, $type: "number", $gt: 0 }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
              revenue: { $sum: "$summary.total" }, // Không cần $ifNull vì đã filter rồi
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, period: "$_id", revenue: 1, count: 1 } },
        ]);
      }
    };

    // Helper function để map data vào labels
    const mapDataToLabels = (revenueAgg, labels, period, now) => {
      const revenueMap = new Map(revenueAgg.map((item) => [item.period, item.revenue || 0]));
      const countMap = new Map(revenueAgg.map((item) => [item.period, item.count || 0]));
      
      let revenuePoints, countPoints;
      if (period === "day") {
        revenuePoints = labels.map((_, idx) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - idx));
          const key = d.toISOString().split("T")[0];
          return revenueMap.get(key) || 0;
        });
        countPoints = labels.map((_, idx) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - idx));
          const key = d.toISOString().split("T")[0];
          return countMap.get(key) || 0;
        });
      } else if (period === "week") {
        revenuePoints = labels.map((_, idx) => {
          const key = `${idx}`;
          return revenueMap.get(key) || 0;
        });
        countPoints = labels.map((_, idx) => {
          const key = `${idx}`;
          return countMap.get(key) || 0;
        });
      } else if (period === "month") {
        revenuePoints = labels.map((_, idx) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return revenueMap.get(key) || 0;
        });
        countPoints = labels.map((_, idx) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return countMap.get(key) || 0;
        });
      } else {
        revenuePoints = labels.map((_, idx) => {
          const year = now.getFullYear() - (4 - idx);
          return revenueMap.get(String(year)) || 0;
        });
        countPoints = labels.map((_, idx) => {
          const year = now.getFullYear() - (4 - idx);
          return countMap.get(String(year)) || 0;
        });
      }
      return { revenuePoints, countPoints };
    };

    // Query orders đã hoàn thành trong khoảng thời gian - Sản phẩm
    // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "completed" (đã hoàn tất) và summary.total > 0
    const productMatchQuery = {
      deleted: false,
      status: { $eq: "completed" }, // Chỉ tính đơn có status chính xác là "completed"
      "summary.total": { $exists: true, $type: "number", $gt: 0 }, // Chỉ tính đơn có total > 0
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Query service orders đã hoàn thành trong khoảng thời gian - Đặt lịch
    // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "Completed" (đã hoàn tất) và summary.total > 0
    const serviceMatchQuery = {
      deleted: false,
      status: { $eq: "Completed" }, // Chỉ tính đơn có status chính xác là "Completed"
      "summary.total": { $exists: true, $type: "number", $gt: 0 }, // Chỉ tính đơn có total > 0
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Helper function để aggregate doanh thu theo loại sản phẩm (food vs accessory)
    const aggregateByProductType = async (matchQuery, period, groupFormat, now, startDate, productType) => {
      if (period === "week") {
        // Aggregate theo ngày trước, sau đó group theo tuần
        const dayAgg = await Order.aggregate([
          { $match: matchQuery },
          { $match: { "summary.total": { $exists: true, $type: "number", $gt: 0 } } },
          { $unwind: "$products" },
          {
            $lookup: {
              from: "foods",
              localField: "products.product_id",
              foreignField: "_id",
              as: "food"
            }
          },
          {
            $lookup: {
              from: "accessories",
              localField: "products.product_id",
              foreignField: "_id",
              as: "accessory"
            }
          },
          {
            $match: productType === "food" 
              ? { food: { $ne: [] } }
              : { accessory: { $ne: [] } }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$products.amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        const weekMap = new Map();
        const dayOfWeek = (now.getDay() + 6) % 7;
        const weekStartBase = new Date(now);
        weekStartBase.setDate(now.getDate() - dayOfWeek - 21);
        weekStartBase.setHours(0, 0, 0, 0);

        for (let i = 0; i < 4; i++) {
          const weekKey = `${i}`;
          weekMap.set(weekKey, { revenue: 0, count: 0 });
        }

        dayAgg.forEach((item) => {
          const itemDate = new Date(item._id + "T00:00:00");
          const diffDays = Math.floor((itemDate - weekStartBase) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(diffDays / 7);
          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `${weekIndex}`;
            const week = weekMap.get(weekKey) || { revenue: 0, count: 0 };
            week.revenue += item.revenue || 0;
            week.count += item.count || 0;
            weekMap.set(weekKey, week);
          }
        });

        return Array.from(weekMap.entries()).map(([weekIndex, data]) => ({
          period: weekIndex,
          revenue: data.revenue,
          count: data.count,
        }));
      } else {
        return await Order.aggregate([
          { $match: matchQuery },
          { $match: { "summary.total": { $exists: true, $type: "number", $gt: 0 } } },
          { $unwind: "$products" },
          {
            $lookup: {
              from: "foods",
              localField: "products.product_id",
              foreignField: "_id",
              as: "food"
            }
          },
          {
            $lookup: {
              from: "accessories",
              localField: "products.product_id",
              foreignField: "_id",
              as: "accessory"
            }
          },
          {
            $match: productType === "food" 
              ? { food: { $ne: [] } }
              : { accessory: { $ne: [] } }
          },
          {
            $group: {
              _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
              revenue: { $sum: "$products.amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, period: "$_id", revenue: 1, count: 1 } },
        ]);
      }
    };

    // Helper function để đếm số đơn hàng unique (không phải số sản phẩm)
    const aggregateOrderCountByProductType = async (matchQuery, period, groupFormat, now, startDate, productType) => {
      if (period === "week") {
        const dayAgg = await Order.aggregate([
          { $match: matchQuery },
          { $match: { "summary.total": { $exists: true, $type: "number", $gt: 0 } } },
          { $unwind: "$products" },
          {
            $lookup: {
              from: "foods",
              localField: "products.product_id",
              foreignField: "_id",
              as: "food"
            }
          },
          {
            $lookup: {
              from: "accessories",
              localField: "products.product_id",
              foreignField: "_id",
              as: "accessory"
            }
          },
          {
            $match: productType === "food" 
              ? { food: { $ne: [] } }
              : { accessory: { $ne: [] } }
          },
          {
            $group: {
              _id: { 
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                orderId: "$_id"
              }
            }
          },
          {
            $group: {
              _id: "$_id.date",
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
        ]);

        const weekMap = new Map();
        const dayOfWeek = (now.getDay() + 6) % 7;
        const weekStartBase = new Date(now);
        weekStartBase.setDate(now.getDate() - dayOfWeek - 21);
        weekStartBase.setHours(0, 0, 0, 0);

        for (let i = 0; i < 4; i++) {
          const weekKey = `${i}`;
          weekMap.set(weekKey, { count: 0 });
        }

        dayAgg.forEach((item) => {
          const itemDate = new Date(item._id + "T00:00:00");
          const diffDays = Math.floor((itemDate - weekStartBase) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(diffDays / 7);
          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `${weekIndex}`;
            const week = weekMap.get(weekKey) || { count: 0 };
            week.count += item.count || 0;
            weekMap.set(weekKey, week);
          }
        });

        return Array.from(weekMap.entries()).map(([weekIndex, data]) => ({
          period: weekIndex,
          count: data.count,
        }));
      } else {
        return await Order.aggregate([
          { $match: matchQuery },
          { $match: { "summary.total": { $exists: true, $type: "number", $gt: 0 } } },
          { $unwind: "$products" },
          {
            $lookup: {
              from: "foods",
              localField: "products.product_id",
              foreignField: "_id",
              as: "food"
            }
          },
          {
            $lookup: {
              from: "accessories",
              localField: "products.product_id",
              foreignField: "_id",
              as: "accessory"
            }
          },
          {
            $match: productType === "food" 
              ? { food: { $ne: [] } }
              : { accessory: { $ne: [] } }
          },
          {
            $group: {
              _id: { 
                period: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                orderId: "$_id"
              }
            }
          },
          {
            $group: {
              _id: "$_id.period",
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, period: "$_id", count: 1 } },
        ]);
      }
    };

    // Debug: Kiểm tra số lượng đơn trước khi aggregate
    const [productCountBefore, serviceCountBefore] = await Promise.all([
      Order.countDocuments(productMatchQuery),
      OrderServices.countDocuments(serviceMatchQuery),
    ]);

    // Aggregate cho food, accessory và service
    const [foodRevenueAgg, accessoryRevenueAgg, serviceRevenueAgg, foodOrderCountAgg, accessoryOrderCountAgg] = await Promise.all([
      aggregateByProductType(productMatchQuery, period, groupFormat, now, startDate, "food"),
      aggregateByProductType(productMatchQuery, period, groupFormat, now, startDate, "accessory"),
      aggregateByPeriod(OrderServices, serviceMatchQuery, period, groupFormat, now, startDate),
      aggregateOrderCountByProductType(productMatchQuery, period, groupFormat, now, startDate, "food"),
      aggregateOrderCountByProductType(productMatchQuery, period, groupFormat, now, startDate, "accessory"),
    ]);

    // Map dữ liệu vào labels
    const foodData = mapDataToLabels(foodRevenueAgg, labels, period, now);
    const accessoryData = mapDataToLabels(accessoryRevenueAgg, labels, period, now);
    const serviceData = mapDataToLabels(serviceRevenueAgg, labels, period, now);
    
    // Map order count
    const foodOrderCountData = mapDataToLabels(foodOrderCountAgg, labels, period, now);
    const accessoryOrderCountData = mapDataToLabels(accessoryOrderCountAgg, labels, period, now);

    // Tính tổng từ revenuePoints (đã được map đúng)
    const foodTotalRevenue = foodData.revenuePoints.reduce((sum, val) => sum + Number(val || 0), 0);
    const foodTotalOrders = foodOrderCountData.countPoints.reduce((sum, val) => sum + Number(val || 0), 0);
    const accessoryTotalRevenue = accessoryData.revenuePoints.reduce((sum, val) => sum + Number(val || 0), 0);
    const accessoryTotalOrders = accessoryOrderCountData.countPoints.reduce((sum, val) => sum + Number(val || 0), 0);
    const productTotalRevenue = foodTotalRevenue + accessoryTotalRevenue;
    const productTotalOrders = foodTotalOrders + accessoryTotalOrders;
    const serviceTotalRevenue = serviceData.revenuePoints.reduce((sum, val) => sum + Number(val || 0), 0);
    const serviceTotalOrders = serviceData.countPoints.reduce((sum, val) => sum + Number(val || 0), 0);


    return res.json({
      success: true,
      period,
      labels,
      // Dữ liệu đơn sản phẩm (tổng hợp food + accessory)
      productRevenue: foodData.revenuePoints.map((val, idx) => (val || 0) + (accessoryData.revenuePoints[idx] || 0)),
      productOrders: foodOrderCountData.countPoints.map((val, idx) => (val || 0) + (accessoryOrderCountData.countPoints[idx] || 0)),
      productTotalRevenue,
      productTotalOrders,
      // Dữ liệu đồ ăn (food)
      foodRevenue: foodData.revenuePoints,
      foodOrders: foodOrderCountData.countPoints,
      foodTotalRevenue,
      foodTotalOrders,
      // Dữ liệu phụ kiện (accessory)
      accessoryRevenue: accessoryData.revenuePoints,
      accessoryOrders: accessoryOrderCountData.countPoints,
      accessoryTotalRevenue,
      accessoryTotalOrders,
      // Dữ liệu đơn đặt lịch
      serviceRevenue: serviceData.revenuePoints,
      serviceOrders: serviceData.countPoints,
      serviceTotalRevenue,
      serviceTotalOrders,
      // Tổng hợp
      totalRevenue: productTotalRevenue + serviceTotalRevenue,
      totalOrders: productTotalOrders + serviceTotalOrders,
      startDate,
      endDate,
    });
  } catch (err) {
    console.error("Revenue chart error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

