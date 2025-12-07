const Service = require("../../model/ServiceModel");
const OrderServices = require("../../model/OrderServices");

// GET /services?page=1&limit=12&search=...&categoryId=...&minPrice=...&maxPrice=...&sort=...
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || "").trim();
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;
    const sort = req.query.sort || "createdAt"; // popular, price_asc, price_desc, rating, createdAt

    const find = { deleted: false, status: "active" };
    
    // Search by name
    if (search) {
      find.serviceName = { $regex: search, $options: "i" };
    }
    
    
    // Filter by price range
    if (minPrice !== null || maxPrice !== null) {
      find.price = {};
      if (minPrice !== null) find.price.$gte = minPrice;
      if (maxPrice !== null) find.price.$lte = maxPrice;
    }

    const total = await Service.countDocuments(find);
    const skip = (page - 1) * limit;
    
    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "popular":
        sortObj = { sold_count: -1, rating: -1 };
        break;
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "rating":
        sortObj = { rating: -1, sold_count: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }
    
    const services = await Service.find(find)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Tính toán đánh giá trung bình cho mỗi dịch vụ
    const servicesWithRatings = await Promise.all(
      services.map(async (service) => {
        // Lấy tất cả đánh giá của dịch vụ này từ các đơn đã hoàn thành
        const ratings = await OrderServices.find({
          'services.services_id': service._id,
          'rating.score': { $exists: true, $ne: null },
          status: 'Completed',
          deleted: false
        }).select('rating');

        if (ratings.length > 0) {
          // Tính điểm trung bình
          const totalScore = ratings.reduce((sum, order) => sum + order.rating.score, 0);
          const averageRating = totalScore / ratings.length;
          
          // Lấy số lượng đánh giá
          const reviewCount = ratings.length;
          
          return {
            ...service.toObject(),
            rating: Math.round(averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
            reviewCount: reviewCount
          };
        } else {
          return {
            ...service.toObject(),
            rating: 0,
            reviewCount: 0
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      services: servicesWithRatings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (err) {
    console.error("Client services index error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// GET /services/:id
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let service;
    if (isValidObjectId) {
      // Search by _id
      service = await Service.findById(id);
    } else {
      // Search by slug
      service = await Service.findOne({ slug: id, deleted: false });
    }

    if (!service || service.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ" });
    }

    // Tính toán đánh giá cho dịch vụ này từ các đơn đã hoàn thành
    const ratings = await OrderServices.find({
      'services.services_id': service._id,
      'rating.score': { $exists: true, $ne: null },
      status: 'Completed',
      deleted: false
    }).select('rating');

    let rating = 0;
    let reviewCount = 0;

    if (ratings.length > 0) {
      const totalScore = ratings.reduce((sum, order) => sum + order.rating.score, 0);
      rating = Math.round((totalScore / ratings.length) * 10) / 10;
      reviewCount = ratings.length;
    }

    const serviceWithRating = {
      ...service.toObject(),
      rating: rating,
      reviewCount: reviewCount
    };

    return res.status(200).json({ success: true, service: serviceWithRating });
  } catch (error) {
    console.error("Detail service error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /services/category/:id
module.exports.listByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const categoryId = req.params.id;
    
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, error: "Thiếu category id" });
    }

    const find = { deleted: false, status: "active" };
    const total = await Service.countDocuments(find);
    const skip = (page - 1) * limit;
    
    const services = await Service.find(find)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      services,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (err) {
    console.error("Client services listByCategory error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// GET /services/popular?limit=6
module.exports.popular = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const services = await Service.find({ 
      deleted: false, 
      status: "active" 
    })
      .sort({ sold_count: -1, rating: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (err) {
    console.error("Client services popular error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// GET /services/:id/reviews - Lấy tất cả đánh giá của dịch vụ
module.exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let service;
    if (isValidObjectId) {
      // Search by _id
      service = await Service.findById(id);
    } else {
      // Search by slug
      service = await Service.findOne({ slug: id, deleted: false });
    }

    if (!service || service.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ" });
    }

    // Lấy tất cả đánh giá của dịch vụ này từ các đơn đã hoàn thành
    const orders = await OrderServices.find({
      'services.services_id': service._id,
      'rating.score': { $exists: true, $ne: null },
      status: 'Completed',
      deleted: false
    })
      .populate('user_id', 'fullName email')
      .populate('rating.rated_by', 'fullName email')
      .populate('services.services_id', 'serviceName')
      .select('services rating createdAt updatedAt')
      .sort({ 'rating.rated_at': -1 })
      .lean();

    // Format reviews data
    const reviews = orders.map(order => {
      // Tìm service trong order.services
      const serviceInOrder = order.services.find(
        s => s.services_id && (
          (typeof s.services_id === 'object' && s.services_id._id && s.services_id._id.toString() === service._id.toString()) ||
          (typeof s.services_id === 'string' && s.services_id === service._id.toString()) ||
          (s.services_id.toString() === service._id.toString())
        )
      );

      return {
        _id: order._id,
        score: order.rating.score,
        comment: order.rating.comment || '',
        images: order.rating.images || [],
        rated_at: order.rating.rated_at,
        updated_at: order.rating.updated_at,
        is_updated: order.rating.is_updated || false,
        rated_by: order.rating.rated_by || order.user_id,
        customerName: serviceInOrder?.fullName || order.user_id?.fullName || 'Khách hàng',
        orderDate: order.createdAt
      };
    });

    // Tính toán thống kê
    let ratingStats = null;
    if (reviews.length > 0) {
      const totalScore = reviews.reduce((sum, review) => sum + review.score, 0);
      const averageRating = totalScore / reviews.length;
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      
      reviews.forEach(review => {
        ratingCounts[review.score]++;
      });

      ratingStats = {
        average: Math.round(averageRating * 10) / 10,
        total: reviews.length,
        counts: ratingCounts
      };
    }

    return res.status(200).json({
      success: true,
      reviews,
      stats: ratingStats
    });
  } catch (error) {
    console.error("Get service reviews error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
