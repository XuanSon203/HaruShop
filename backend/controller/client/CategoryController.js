const Category = require("../../model/CategoryModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");

const buildCategoryTree = async (parentId) => {
  const children = await Category.find({
    parentId,
    deleted: false,
    status: "active",
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return Promise.all(
    children.map(async (child) => ({
      ...child,
      children: await buildCategoryTree(child._id),
    }))
  );
};
module.exports.foods = async (req, res) => {
  try {
    // 1️⃣ Tìm category "Đồ ăn"
    const parentCategory = await Category.findOne({ name: "Đồ ăn", deleted: false });
    if (!parentCategory) {
      return res.status(404).json({ message: "Danh mục 'Đồ ăn' không tồn tại" });
    }

    // 2️⃣ Lấy tất cả category con của "Đồ ăn"
    const childCategories = await Category.find({
      parentId: parentCategory._id,
      deleted: false,
    });
    
    // 3️⃣ Trả kết quả
    return res.status(200).json({ parent: parentCategory, children: childCategories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.accessories = async (req, res) => {
  try {
    // 1️⃣ Tìm category theo slug "phu-kien", fallback theo tên "Phụ kiện"
    let parentCategory = await Category.findOne({ slug: "phu-kien", deleted: false });
    if (!parentCategory) {
      parentCategory = await Category.findOne({ name: "Phụ kiện", deleted: false });
    }
    if (!parentCategory) {
      return res.status(404).json({ message: "Danh mục 'Phụ kiện' không tồn tại" });
    }

    // 2️⃣ Xây cây danh mục con nhiều cấp
    const childCategories = await buildCategoryTree(parentCategory._id);
    
    // 3️⃣ Trả kết quả
    return res.status(200).json({ parent: parentCategory, children: childCategories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy sản phẩm theo danh mục cụ thể
module.exports.getAccessoriesByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Kiểm tra danh mục có tồn tại không
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Lấy sản phẩm theo danh mục
    const find = { 
      category_id: id, 
      deleted: false, 
      status: 'active' 
    };

    const total = await Accessory.countDocuments(find);
    const skip = (page - 1) * limit;
    
    const accessories = await Accessory.find(find)
      .populate('discounts', 'name value')
      .populate('category_id', 'name')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      accessories,
      category,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get foods by category error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.getFoodsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Kiểm tra danh mục có tồn tại không
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Lấy sản phẩm theo danh mục
    const find = { 
      category_id: id, 
      deleted: false, 
      status: 'active' 
    };

    const total = await Food.countDocuments(find);
    const skip = (page - 1) * limit;
    
    const foods = await Food.find(find)
      .populate('discount', 'name value')
      .populate('category_id', 'name')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      foods,
      category,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get foods by category error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy tất cả danh mục cha
module.exports.getAllParentCategories = async (req, res) => {
  try {
    // Lấy tất cả danh mục cha (parentId = null hoặc không có parentId)
    const parentCategories = await Category.find({
      $or: [
        { parentId: null },
        { parentId: { $exists: false } }
      ],
      deleted: false,
      status: 'active'
    }).sort({ sortOrder: 1, name: 1 });

    return res.status(200).json({
      success: true,
      categories: parentCategories,
      total: parentCategories.length
    });
  } catch (error) {
    console.error("Get all parent categories error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Test authentication endpoint
module.exports.testAuth = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.tokenUser;
    
    if (!token) {
      return res.status(401).json({ 
        message: "Chưa đăng nhập - Không có tokenUser cookie",
        cookies: req.cookies,
        headers: req.headers
      });
    }

    const User = require("../../model/UserModel");
    const user = await User.findOne({ tokenUser: token, deleted: false });
    
    if (!user) {
      return res.status(401).json({ 
        message: "Phiên đăng nhập không hợp lệ - Token không tồn tại trong DB",
        token: token,
        debug: {
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 10) : null
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authentication OK",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      token: token,
      debug: {
        tokenLength: token.length,
        tokenStart: token.substring(0, 10),
        cookiesCount: Object.keys(req.cookies || {}).length
      }
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
