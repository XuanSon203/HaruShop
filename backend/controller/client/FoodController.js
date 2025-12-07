const Food = require("../../model/FoodModel");

// GET /products/foods?page=1&limit=12&search=...&categoryId=...&minPrice=...&maxPrice=...&sort=...
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || "").trim();
    const categoryId = req.query.categoryId || null;
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;
    const sort = req.query.sort || "createdAt"; // popular, price_asc, price_desc, rating, createdAt

    const find = { deleted: false, status: "active" };
    
    // Search by name
    if (search) {
      find.name = { $regex: search, $options: "i" };
    }
    
    // Filter by category
    if (categoryId) {
      find.category_id = categoryId;
    }
    
    // Filter by price range
    if (minPrice !== null || maxPrice !== null) {
      find.price = {};
      if (minPrice !== null) find.price.$gte = minPrice;
      if (maxPrice !== null) find.price.$lte = maxPrice;
    }

    const total = await Food.countDocuments(find);
    const skip = (page - 1) * limit;
    
    // Build sort object
    let sortObj = {};
    switch (sort) {
      case "popular":
        sortObj = { sold_count_last_month: -1, rating: -1 };
        break;
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "rating":
        sortObj = { rating: -1, sold_count_last_month: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }
    
    // Filter by featured flag when requested
    if (typeof req.query.is_featured !== "undefined") {
      const isFeatured = String(req.query.is_featured).toLowerCase() === "true";
      find.is_featured = isFeatured;
    }

    const foods = await Food.find(find)
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      foods,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (err) {
    console.error("Client foods index error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};
// controller
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params; // lấy id từ URL
    
    // Check if id is a valid ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let food;
    if (isValidObjectId) {
      // Search by _id
      food = await Food.findById(id)
        .populate("category_id", "name")
        .populate("discount_id", "name code type value status");
    } else {
      // Search by slug
      food = await Food.findOne({ slug: id, deleted: false })
        .populate("category_id", "name")
        .populate("discount_id", "name code type value status");
    }

    if (!food || food.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Ensure category_id is included in response
    const foodResponse = {
      ...food.toObject(),
      category_id: food.category_id, // Make sure category_id is included
      discount_id: food.discount_id,
    };

    return res.status(200).json({ success: true, food: foodResponse });
  } catch (error) {
    console.error("Detail food error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /foods/category/:id
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

    const find = { deleted: false, status: "active", category_id: categoryId };
    const total = await Food.countDocuments(find);
    const skip = (page - 1) * limit;
    const foods = await Food.find(find)
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      foods,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (err) {
    console.error("Client foods listByCategory error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// GET /products/food/popular?limit=6
module.exports.popular = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const foods = await Food.find({ 
      deleted: false, 
      status: "active" 
    })
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort({ sold_count_last_month: -1, rating: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      foods,
    });
  } catch (err) {
    console.error("Client foods popular error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};
