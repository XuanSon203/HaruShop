const Order = require("../../model/OrderModel");
const User = require("../../model/UserModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const Service = require("../../model/ServiceModel");
const Customer = require("../../model/AddressModel");
const Discount = require("../../model/DiscountModel");
const OrderServices = require("../../model/OrderServices");
const Shipping = require("../../model/ShippingProvidersModel");

// GET /admin/dashboard/revenue?period=day|week|month|year
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
        // 12 tháng gần nhất, group theo tháng
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
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

// GET /admin/dashboard/stats?range=&from=&to=&status=
module.exports.stats = async (req, res) => {
  try {
    const { range, from, to, status, period } = req.query;

    const baseMatch = { deleted: false };
    if (status) baseMatch.status = status.includes(",") ? { $in: status.split(",") } : status;

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - dayOfWeek); startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    let customStart = null; let customEnd = null;
    if (from || to || range) {
      if (from || to) {
        const pf = parseDate(from); const pt = parseDate(to);
        if (pf) customStart = new Date(pf.setHours(0,0,0,0));
        if (pt) customEnd = new Date(new Date(pt).setHours(23,59,59,999));
      } else if (range) {
        const r = String(range).toLowerCase();
        if (r === "day") { customStart = startOfDay; customEnd = endOfDay; }
        else if (r === "week") { customStart = startOfWeek; customEnd = endOfWeek; }
        else if (r === "month") { customStart = startOfMonth; customEnd = endOfMonth; }
        else if (r === "year") { customStart = startOfYear; customEnd = endOfYear; }
      }
    }

    const buildMatch = (start, end) => {
      const m = { ...baseMatch };
      if (start || end) {
        m.createdAt = {};
        if (start) m.createdAt.$gte = start;
        if (end) m.createdAt.$lte = end;
      }
      return m;
    };

    const aggregateTotals = async (match) => {
      // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "completed" (đã hoàn tất) và summary.total > 0
      const completedMatch = {
        ...match,
        status: { $eq: "completed" },
        "summary.total": { $exists: true, $type: "number", $gt: 0 }
      };
      
      const [globalAgg, statusAgg, revenueByType] = await Promise.all([
        Order.aggregate([
          { $match: completedMatch },
          { $group: { _id: null, totalRevenue: { $sum: "$summary.total" }, totalOrders: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: match },
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ]),
        // Revenue by product type (food vs accessory) - CHỈ TÍNH ĐƠN ĐÃ HOÀN THÀNH
        Order.aggregate([
          { $match: completedMatch },
          { $unwind: "$products" },
          { $project: { product_id: "$products.product_id", amount: "$products.amount" } },
          { $lookup: { from: "foods", localField: "product_id", foreignField: "_id", as: "f" } },
          { $lookup: { from: "accessories", localField: "product_id", foreignField: "_id", as: "a" } },
          { $addFields: { type: { $cond: [ { $gt: [ { $size: "$f" }, 0 ] }, "food", "accessory" ] } } },
          { $group: { _id: "$type", revenue: { $sum: "$amount" } } },
          { $project: { _id: 0, type: "$_id", revenue: 1 } },
        ]),
      ]);
      const totalRevenue = globalAgg[0]?.totalRevenue || 0;
      const totalOrders = globalAgg[0]?.totalOrders || 0;
      const cancellations = (statusAgg.find((s) => s.status === "cancelled")?.count) || 0;
      return {
        totalRevenue,
        totalOrders,
        totalCount: totalOrders,
        cancellations,
        returns: 0,
        statusSummary: statusAgg,
        revenueByType,
      };
    };

    // Helper function để tính service orders revenue theo range
    const aggregateServiceOrders = async (match) => {
      const serviceMatch = { 
        deleted: false, 
        status: "Completed",
        "summary.total": { $exists: true, $type: "number", $gt: 0 }
      };
      if (match && match.createdAt) {
        serviceMatch.createdAt = match.createdAt;
      }
      const agg = await OrderServices.aggregate([
        { $match: serviceMatch },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$summary.total" } } },
      ]);
      const result = {
        count: agg[0]?.count || 0,
        revenue: agg[0]?.revenue || 0,
      };
      return result;
    };

    const [today, thisWeek, thisMonth, thisYear, allTime, custom, usersCount, foodsCount, accessoriesCount, servicesCount, partnersCount, customersCount] = await Promise.all([
      aggregateTotals(buildMatch(startOfDay, endOfDay)),
      aggregateTotals(buildMatch(startOfWeek, endOfWeek)),
      aggregateTotals(buildMatch(startOfMonth, endOfMonth)),
      aggregateTotals(buildMatch(startOfYear, endOfYear)),
      aggregateTotals(buildMatch(null, null)),
      aggregateTotals(buildMatch(customStart, customEnd)),
      User.countDocuments({ deleted: false }),
      Food.countDocuments({ deleted: false }),
      Accessory.countDocuments({ deleted: false }),
      Service.countDocuments({ deleted: false }),
      Shipping.countDocuments({ $or: [ { deleted: false }, { deleted: { $exists: false } } ] }),
      Customer.countDocuments({ deleted: false }),
    ]);

    // Tính service orders revenue cho từng range
    const [todayService, thisWeekService, thisMonthService, thisYearService, allTimeService, customService] = await Promise.all([
      aggregateServiceOrders(buildMatch(startOfDay, endOfDay)),
      aggregateServiceOrders(buildMatch(startOfWeek, endOfWeek)),
      aggregateServiceOrders(buildMatch(startOfMonth, endOfMonth)),
      aggregateServiceOrders(buildMatch(startOfYear, endOfYear)),
      aggregateServiceOrders(buildMatch(null, null)),
      aggregateServiceOrders(buildMatch(customStart, customEnd)),
    ]);

    // Cộng service revenue vào totalRevenue của từng range
    const productRevenueToday = today.totalRevenue || 0;
    const serviceRevenueToday = todayService.revenue || 0;
    today.totalRevenue = productRevenueToday + serviceRevenueToday;
    today.totalCount = (today.totalCount || 0) + (todayService.count || 0);
    
    const productRevenueWeek = thisWeek.totalRevenue || 0;
    const serviceRevenueWeek = thisWeekService.revenue || 0;
    thisWeek.totalRevenue = productRevenueWeek + serviceRevenueWeek;
    thisWeek.totalCount = (thisWeek.totalCount || 0) + (thisWeekService.count || 0);
    
    const productRevenueMonth = thisMonth.totalRevenue || 0;
    const serviceRevenueMonth = thisMonthService.revenue || 0;
    thisMonth.totalRevenue = productRevenueMonth + serviceRevenueMonth;
    thisMonth.totalCount = (thisMonth.totalCount || 0) + (thisMonthService.count || 0);
    
    const productRevenueYear = thisYear.totalRevenue || 0;
    const serviceRevenueYear = thisYearService.revenue || 0;
    thisYear.totalRevenue = productRevenueYear + serviceRevenueYear;
    thisYear.totalCount = (thisYear.totalCount || 0) + (thisYearService.count || 0);
    
    const productRevenueAllTime = allTime.totalRevenue || 0;
    const serviceRevenueAllTime = allTimeService.revenue || 0;
    allTime.totalRevenue = productRevenueAllTime + serviceRevenueAllTime;
    allTime.totalCount = (allTime.totalCount || 0) + (allTimeService.count || 0);
    
    if (custom) {
      const productRevenueCustom = custom.totalRevenue || 0;
      const serviceRevenueCustom = customService.revenue || 0;
      custom.totalRevenue = productRevenueCustom + serviceRevenueCustom;
      custom.totalCount = (custom.totalCount || 0) + (customService.count || 0);
    }


    // Service orders tổng (all time) để hiển thị trong entities
    const serviceOrders = {
      count: allTimeService.count || 0,
      revenue: allTimeService.revenue || 0,
    };

    // Revenue trend for the last N days (7/30/90)
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const trendDays = daysMap[String(period || range || '7d')] || 7;
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - (trendDays - 1));
    trendStart.setHours(0, 0, 0, 0);

    const trendMatch = buildMatch(trendStart, null);
    // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "completed" (đã hoàn tất) và summary.total > 0
    const trendCompletedMatch = {
      ...trendMatch,
      status: { $eq: "completed" },
      "summary.total": { $exists: true, $type: "number", $gt: 0 }
    };
    const trendAgg = await Order.aggregate([
      { $match: trendCompletedMatch },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$summary.total" } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", revenue: 1 } },
    ]);

    // Widgets: top products, recent orders, top customers, low stock
    // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "completed" (đã hoàn tất) và summary.total > 0
    const topProductsMatch = {
      ...baseMatch,
      status: { $eq: "completed" },
      "summary.total": { $exists: true, $type: "number", $gt: 0 }
    };
    const topProductsAgg = await Order.aggregate([
      { $match: topProductsMatch },
      { $unwind: "$products" },
      { $group: {
        _id: "$products.product_id",
        sold: { $sum: "$products.quantity" },
        revenue: { $sum: "$products.amount" }
      } },
      // join to foods and accessories
      { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "food" } },
      { $lookup: { from: "accessories", localField: "_id", foreignField: "_id", as: "accessory" } },
      { $addFields: {
        name: { $ifNull: [ { $arrayElemAt: [ "$food.name", 0 ] }, { $arrayElemAt: [ "$accessory.name", 0 ] } ] },
        category: { 
          $cond: [ 
            { $gt: [ { $size: "$food" }, 0 ] }, 
            "Đồ ăn", 
            { $cond: [ { $gt: [ { $size: "$accessory" }, 0 ] }, "Phụ kiện", "N/A" ] } 
          ] 
        },
        discount_id: { $ifNull: [ { $arrayElemAt: [ "$food.discount_id", 0 ] }, { $arrayElemAt: [ "$accessory.discount_id", 0 ] } ] },
        status: { $cond: [ { $gt: [ { $size: "$food" }, 0 ] }, "active", { $cond: [ { $gt: [ { $size: "$accessory" }, 0 ] }, "active", "inactive" ] } ] }
      } },
      { $project: { _id: 0, name: 1, category: 1, sold: 1, revenue: 1, discount_id: 1, status: 1 } },
      { $sort: { sold: -1 } },
      { $limit: 4 }
    ]);

    const recentOrdersDocs = await Order.find(baseMatch)
      .sort({ createdAt: -1 })
      .limit(4)
      .select("_id customer_info summary.total status createdAt")
      .populate("customer_info", "fullName")
      .lean();
    const recentOrders = recentOrdersDocs.map((o) => ({
      id: o._id,
      customer: o.customer_info?.fullName || "—",
      total: o.summary?.total || 0,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // Top customers: Group by user_id hoặc customer_info, ưu tiên user_id
    // CHỈ TÍNH CÁC ĐƠN CÓ STATUS = "completed" (đã hoàn tất) và summary.total > 0
    const topCustomersMatch = {
      ...baseMatch,
      status: { $eq: "completed" },
      "summary.total": { $exists: true, $type: "number", $gt: 0 }
    };
    const topCustomersAgg = await Order.aggregate([
      { $match: topCustomersMatch },
      // Thêm field để xác định customer identifier
      {
        $addFields: {
          customerIdentifier: {
            $cond: {
              if: { $ne: ["$user_id", null] },
              then: { $concat: ["user_", { $toString: "$user_id" }] },
              else: {
                $cond: {
                  if: { $ne: ["$customer_info", null] },
                  then: { $concat: ["addr_", { $toString: "$customer_info" }] },
                  else: null
                }
              }
            }
          }
        }
      },
      // Chỉ lấy các đơn có customer identifier
      { $match: { customerIdentifier: { $ne: null } } },
      {
        $group: {
          _id: "$customerIdentifier",
          orders: { $sum: 1 },
          spent: { $sum: "$summary.total" },
          user_id: { $first: "$user_id" },
          customer_info: { $first: "$customer_info" }
        }
      },
      { $sort: { spent: -1 } },
      { $limit: 4 },
      // Lookup từ users collection
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      // Lookup từ addresses collection
      {
        $lookup: {
          from: "addresses",
          localField: "customer_info",
          foreignField: "_id",
          as: "address"
        }
      },
      {
        $addFields: {
          // Ưu tiên tên từ user, nếu không có thì lấy từ address
          name: {
            $ifNull: [
              { $arrayElemAt: ["$user.fullName", 0] },
              { $arrayElemAt: ["$address.fullName", 0] }
            ]
          },
          // Giữ lại _id để làm unique key
          customerId: "$_id"
        }
      },
      // Lọc bỏ các khách hàng không có tên (null hoặc rỗng)
      {
        $match: {
          name: { $exists: true, $ne: null, $ne: "", $ne: "—" }
        }
      },
      { $project: { _id: 0, customerId: 1, name: 1, orders: 1, spent: 1 } },
    ]);

    // Tính toán số lượng sản phẩm còn lại sau khi trừ đi đã bán
    const calculateRemainingStock = async () => {
      // Lấy tổng số lượng đã bán của từng sản phẩm
      const soldProducts = await Order.aggregate([
        { $match: { deleted: false, status: { $ne: "cancelled" } } },
        { $unwind: "$products" },
        { $group: {
          _id: "$products.product_id",
          soldQuantity: { $sum: "$products.quantity" }
        }}
      ]);

      // Tạo map để tra cứu nhanh
      const soldMap = {};
      soldProducts.forEach(item => {
        soldMap[item._id.toString()] = item.soldQuantity;
      });

      // Lấy tất cả sản phẩm và tính số lượng còn lại
      const allFoods = await Food.find({ deleted: false }).select("name quantity price discount_id").lean();
      const allAccessories = await Accessory.find({ deleted: false }).select("name quantity price discount_id").lean();
      
      const allProducts = [
        ...allFoods.map(f => ({ ...f, type: 'food' })),
        ...allAccessories.map(a => ({ ...a, type: 'accessory' }))
      ];

      // Tính số lượng còn lại và cập nhật database
      const updatedProducts = [];
      for (const product of allProducts) {
        const soldQuantity = soldMap[product._id.toString()] || 0;
        const remainingStock = Math.max(0, (product.quantity || 0) - soldQuantity);
        
        // Cập nhật số lượng còn lại vào database
        if (product.type === 'food') {
          await Food.findByIdAndUpdate(product._id, { 
            remainingStock: remainingStock,
            soldQuantity: soldQuantity 
          });
        } else {
          await Accessory.findByIdAndUpdate(product._id, { 
            remainingStock: remainingStock,
            soldQuantity: soldQuantity 
          });
        }
        
        updatedProducts.push({
          ...product,
          remainingStock,
          soldQuantity
        });
      }

      return updatedProducts;
    };

    // Xóa đơn hàng không tồn tại (có thể do lỗi data)
    const cleanupInvalidOrders = async () => {
      const invalidOrders = await Order.find({
        $or: [
          { products: { $size: 0 } },
          { "summary.total": { $exists: false } },
          { "summary.total": null },
          { status: { $exists: false } }
        ]
      });
      
      if (invalidOrders.length > 0) {
        await Order.deleteMany({
          _id: { $in: invalidOrders.map(o => o._id) }
        });
      }
    };

    // Thực hiện cleanup và tính toán
    await cleanupInvalidOrders();
    const allProducts = await calculateRemainingStock();

    // Lấy thông tin discount cho các sản phẩm
    const discountIds = [...new Set([
      ...allProducts.filter(p => p.discount_id).map(p => p.discount_id.toString())
    ])];
    
    const discounts = await Discount.find({ 
      _id: { $in: discountIds }, 
      deleted: false, 
      status: 'active' 
    }).select('name code value type').lean();
    
    const discountMap = {};
    discounts.forEach(d => {
      discountMap[d._id.toString()] = d;
    });

    // Add discount information to topProducts
    const topProductsWithDiscount = topProductsAgg.map(p => {
      const discount = p.discount_id ? discountMap[p.discount_id.toString()] : null;
      return {
        ...p,
        voucher: discount ? `${discount.code} (${discount.value}${discount.type === 'percent' ? '%' : '₫'})` : null
      };
    });

    // Lấy sản phẩm có tồn kho thấp (dựa trên remainingStock)
    // CHỈ LẤY SẢN PHẨM CÒN TỒN KHO (remainingStock > 0), KHÔNG LẤY SẢN PHẨM HẾT HÀNG
    const lowStock = allProducts
      .filter(p => p.remainingStock > 0 && p.remainingStock <= 50) // Sản phẩm có tồn kho > 0 và <= 50
      .sort((a, b) => a.remainingStock - b.remainingStock)
      .slice(0, 4)
      .map((p) => {
        const discount = p.discount_id ? discountMap[p.discount_id.toString()] : null;
        return { 
          _id: p._id,
          name: p.name, 
          stock: p.remainingStock,
          sold: p.soldQuantity,
          type: p.type,
          category: p.type === 'food' ? 'Đồ ăn' : 'Phụ kiện',
          price: p.price || 0,
          voucher: discount ? `${discount.code} (${discount.value}${discount.type === 'percent' ? '%' : '₫'})` : null,
          totalAmount: (p.price || 0) * (p.remainingStock || 0)
        };
      });

    return res.json({
      success: true,
      ranges: { today, thisWeek, thisMonth, thisYear, allTime, custom: { ...custom, start: customStart || null, end: customEnd || null } },
      revenueTrend: { period: trendDays, points: trendAgg },
      entities: {
        users: usersCount,
        foods: foodsCount,
        accessories: accessoriesCount,
        services: servicesCount,
        partners: partnersCount,
        serviceOrders,
        customers: customersCount,
        productsTotal: (foodsCount || 0) + (accessoriesCount || 0),
      },
      widgets: {
        topProducts: topProductsWithDiscount,
        recentOrders,
        topCustomers: topCustomersAgg,
        lowStock,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/dashboard/statistics/products - Thống kê sản phẩm
module.exports.productStatistics = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Top sản phẩm bán chạy
    const topSelling = await Order.aggregate([
      { $match: { deleted: false, status: "completed" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product_id",
          sold: { $sum: "$products.quantity" },
          revenue: { $sum: "$products.amount" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "food" } },
      { $lookup: { from: "accessories", localField: "_id", foreignField: "_id", as: "accessory" } },
      {
        $addFields: {
          name: { $ifNull: [{ $arrayElemAt: ["$food.name", 0] }, { $arrayElemAt: ["$accessory.name", 0] }] },
          type: { $cond: [{ $gt: [{ $size: "$food" }, 0] }, "food", "accessory"] },
          price: { $ifNull: [{ $arrayElemAt: ["$food.price", 0] }, { $arrayElemAt: ["$accessory.price", 0] }] },
          thumbnail: { $ifNull: [{ $arrayElemAt: ["$food.thumbnail", 0] }, { $arrayElemAt: ["$accessory.thumbnail", 0] }] },
        },
      },
      { $project: { _id: 1, name: 1, type: 1, sold: 1, revenue: 1, price: 1, thumbnail: 1 } },
    ]);

    // Thống kê tồn kho
    const inventoryStats = await Promise.all([
      Food.countDocuments({ deleted: false }),
      Accessory.countDocuments({ deleted: false }),
      Food.countDocuments({ deleted: false, quantity: { $lte: 50 } }),
      Accessory.countDocuments({ deleted: false, quantity: { $lte: 50 } }),
      Food.countDocuments({ deleted: false, quantity: 0 }),
      Accessory.countDocuments({ deleted: false, quantity: 0 }),
    ]);

    // Doanh thu theo loại sản phẩm
    const revenueByType = await Order.aggregate([
      { $match: { deleted: false, status: "completed" } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "foods",
          localField: "products.product_id",
          foreignField: "_id",
          as: "food",
        },
      },
      {
        $addFields: {
          type: { $cond: [{ $gt: [{ $size: "$food" }, 0] }, "food", "accessory"] },
        },
      },
      {
        $group: {
          _id: "$type",
          revenue: { $sum: "$products.amount" },
          count: { $sum: "$products.quantity" },
        },
      },
    ]);

    return res.json({
      success: true,
      topSelling,
      inventory: {
        total: inventoryStats[0] + inventoryStats[1],
        foods: inventoryStats[0],
        accessories: inventoryStats[1],
        lowStock: inventoryStats[2] + inventoryStats[3],
        outOfStock: inventoryStats[4] + inventoryStats[5],
      },
      revenueByType,
    });
  } catch (err) {
    console.error("Product statistics error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/dashboard/statistics/customers - Thống kê khách hàng
module.exports.customerStatistics = async (req, res) => {
  try {
    // Top khách hàng
    const topCustomers = await Order.aggregate([
      { $match: { deleted: false, status: "completed" } },
      {
        $group: {
          _id: "$user_id",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$summary.total" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          name: { $ifNull: [{ $arrayElemAt: ["$user.fullName", 0] }, "Khách vãng lai"] },
          email: { $ifNull: [{ $arrayElemAt: ["$user.email", 0] }, "N/A"] },
          phone: { $ifNull: [{ $arrayElemAt: ["$user.phone", 0] }, "N/A"] },
        },
      },
      { $project: { _id: 1, name: 1, email: 1, phone: 1, orderCount: 1, totalSpent: 1 } },
    ]);

    // Thống kê khách hàng mới
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() + 6) % 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newCustomers = await Promise.all([
      User.countDocuments({ deleted: false, createdAt: { $gte: startOfDay } }),
      User.countDocuments({ deleted: false, createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ deleted: false, createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ deleted: false }),
    ]);

    // Khách hàng có đơn hàng
    const customersWithOrders = await Order.distinct("user_id", { deleted: false });
    const totalCustomersWithOrders = customersWithOrders.filter(Boolean).length;

    return res.json({
      success: true,
      topCustomers,
      newCustomers: {
        today: newCustomers[0],
        thisWeek: newCustomers[1],
        thisMonth: newCustomers[2],
        total: newCustomers[3],
      },
      customersWithOrders: totalCustomersWithOrders,
    });
  } catch (err) {
    console.error("Customer statistics error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/dashboard/statistics/orders - Thống kê đơn hàng
module.exports.orderStatistics = async (req, res) => {
  try {
    // Thống kê theo trạng thái
    const statusStats = await Order.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
    ]);

    // Đơn hàng theo ngày trong tháng
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const ordersByDay = await Order.aggregate([
      {
        $match: {
          deleted: false,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Đơn hàng theo phương thức thanh toán
    const paymentStats = await Order.aggregate([
      { $match: { deleted: false, status: "completed" } },
      {
        $lookup: {
          from: "payments",
          localField: "payment_id",
          foreignField: "_id",
          as: "payment",
        },
      },
      {
        $group: {
          _id: { $ifNull: [{ $arrayElemAt: ["$payment.name", 0] }, "COD"] },
          count: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Tổng quan
    const overview = await Order.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$summary.total" },
          avgOrderValue: { $avg: "$summary.total" },
        },
      },
    ]);

    return res.json({
      success: true,
      statusStats,
      ordersByDay,
      paymentStats,
      overview: overview[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    });
  } catch (err) {
    console.error("Order statistics error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /admin/dashboard/update-stock - Cập nhật tồn kho thủ công
module.exports.updateStock = async (req, res) => {
  try {
    // Tính toán số lượng sản phẩm còn lại sau khi trừ đi đã bán
    const calculateRemainingStock = async () => {
      // Lấy tổng số lượng đã bán của từng sản phẩm
      const soldProducts = await Order.aggregate([
        { $match: { deleted: false, status: { $ne: "cancelled" } } },
        { $unwind: "$products" },
        { $group: {
          _id: "$products.product_id",
          soldQuantity: { $sum: "$products.quantity" }
        }}
      ]);

      // Tạo map để tra cứu nhanh
      const soldMap = {};
      soldProducts.forEach(item => {
        soldMap[item._id.toString()] = item.soldQuantity;
      });

      // Lấy tất cả sản phẩm và tính số lượng còn lại
      const allFoods = await Food.find({ deleted: false }).select("name quantity price discount_id").lean();
      const allAccessories = await Accessory.find({ deleted: false }).select("name quantity price discount_id").lean();
      
      const allProducts = [
        ...allFoods.map(f => ({ ...f, type: 'food' })),
        ...allAccessories.map(a => ({ ...a, type: 'accessory' }))
      ];

      // Tính số lượng còn lại và cập nhật database
      const updatedProducts = [];
      for (const product of allProducts) {
        const soldQuantity = soldMap[product._id.toString()] || 0;
        const remainingStock = Math.max(0, (product.quantity || 0) - soldQuantity);
        
        // Cập nhật số lượng còn lại vào database
        if (product.type === 'food') {
          await Food.findByIdAndUpdate(product._id, { 
            remainingStock: remainingStock,
            soldQuantity: soldQuantity 
          });
        } else {
          await Accessory.findByIdAndUpdate(product._id, { 
            remainingStock: remainingStock,
            soldQuantity: soldQuantity 
          });
        }
        
        updatedProducts.push({
          ...product,
          remainingStock,
          soldQuantity
        });
      }

      return updatedProducts;
    };

    // Xóa đơn hàng không hợp lệ
    const cleanupInvalidOrders = async () => {
      const invalidOrders = await Order.find({
        $or: [
          { products: { $size: 0 } },
          { "summary.total": { $exists: false } },
          { "summary.total": null },
          { status: { $exists: false } }
        ]
      });
      
      if (invalidOrders.length > 0) {
        await Order.deleteMany({
          _id: { $in: invalidOrders.map(o => o._id) }
        });
      }
    };

    // Thực hiện cleanup và tính toán
    await cleanupInvalidOrders();
    const allProducts = await calculateRemainingStock();

    // Thống kê
    const lowStockCount = allProducts.filter(p => p.remainingStock <= 50).length;
    const outOfStockCount = allProducts.filter(p => p.remainingStock === 0).length;

    res.json({
      success: true,
      message: "Cập nhật tồn kho thành công",
      stats: {
        totalProducts: allProducts.length,
        lowStockCount,
        outOfStockCount,
        updatedAt: new Date()
      }
    });

  } catch (err) {
    console.error("Update stock error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi cập nhật tồn kho" });
  }
};

