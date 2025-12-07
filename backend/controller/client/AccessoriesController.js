const Accessory = require("../../model/AccessoriesModel");

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

    const total = await Accessory.countDocuments(find);
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
    
    const accessories = await Accessory.find(find)
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      accessories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phụ kiện:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách phụ kiện",
      error: error.message,
    });
  }
};
module.exports.detailId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Thiếu id sản phẩm" });
    }

    const accessory = await Accessory.findById(id)
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status");

    if (!accessory || accessory.deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phụ kiện" });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết phụ kiện thành công",
      data: accessory,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phụ kiện:", error);
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi lấy chi tiết phụ kiện", error: error.message });
  }
};
module.exports.detail = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, message: "Thiếu slug sản phẩm" });
    }

    // Check if slug is a valid ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    let accessory;
    if (isValidObjectId) {
      // Search by _id
      accessory = await Accessory.findById(slug)
        .populate("category_id", "name")
        .populate("discount_id", "name code type value status");
    } else {
      // Search by slug
      accessory = await Accessory.findOne({ slug, deleted: false })
        .populate("category_id", "name")
        .populate("discount_id", "name code type value status");
    }

    if (!accessory || accessory.deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phụ kiện" });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết phụ kiện thành công",
      data: accessory,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phụ kiện:", error);
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi lấy chi tiết phụ kiện", error: error.message });
  }
};

// GET /products/accessory/category/:id
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
    const total = await Accessory.countDocuments(find);
    const skip = (page - 1) * limit;
    
    const accessories = await Accessory.find(find)
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      accessories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (err) {
    console.error("Client accessories listByCategory error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// GET /products/accessory/popular?limit=6
module.exports.popular = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const accessories = await Accessory.find({ 
      deleted: false, 
      status: "active" 
    })
      .populate("category_id", "name")
      .populate("discount_id", "name code type value status")
      .sort({ sold_count_last_month: -1, rating: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      accessories,
    });
  } catch (err) {
    console.error("Client accessories popular error:", err);
    return res.status(500).json({ success: false, error: "Lỗi server" });
  }
};
