const Food = require("../../model/FoodModel");
const Discount = require("../../model/DiscountModel");
const Account = require("../../model/AccountModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");
module.exports.index = async (req, res) => {
  try {
    let find = { deleted: false };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    // Đếm số dịch vụ đã xóa (soft delete)
    const countFoodDeleted = await Food.countDocuments({ deleted: true });
    // Đếm tổng số dịch vụ thỏa điều kiện
    const totalServices = await Food.countDocuments(find);

    // Skip + limit phân trang
    const skip = (page - 1) * limit;
    const foods = await Food.find(find)
      .populate('discount_id', 'name code value type')
      .populate('category_id', 'name')
      .populate('shipping_id', 'name price')
      .skip(skip)
      .limit(limit);

    // Populate user information
    const foodsWithUserInfo = await populateUserInfoArray(foods);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách món ăn thành công!",
      countFoodDeleted,
      foods: foodsWithUserInfo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalServices / limit),
        totalServices,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách món ăn:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách món ăn!",
      error: error.message,
    });
  }
};

module.exports.addFood = async (req, res) => {
  try {
    const existingFood = await Food.findOne({
      name: req.body.name,
      deleted: false,
      status: "active",
    });
    if (existingFood) {
      return res.status(400).json({
        success: false,
        message: "Tên món ăn đã tồn tại, vui lòng chọn tên khác!",
      });
    }

    const thumbnail = req.files?.thumbnail
      ? req.files.thumbnail[0].filename
      : null;

    const images = req.files?.images
      ? req.files.images.map((file) => file.filename)
      : [];

    const parseBoolean = (val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val === 1;
      if (typeof val === "string") return val === "true" || val === "1";
      return false;
    };

    // Map is_New từ form thành isNew cho model
    const isNewValue = parseBoolean(req.body.is_New ?? req.body.isNew);
    
    const newFood = new Food({
      ...req.body,
      price: Number(req.body.price),
      quantity: Number(req.body.quantity),
      rating: Number(req.body.rating) || 0,
      manufacture_date: req.body.manufacture_date
        ? new Date(req.body.manufacture_date)
        : null,
      expiry_date: req.body.expiry_date ? new Date(req.body.expiry_date) : null,
     
      category_id: req.body.category_id || null,
      shipping_id: req.body.shipping_id || null,
      is_featured: parseBoolean(req.body.is_featured ?? req.body.featured),
      isNew: isNewValue, // Map từ is_New hoặc isNew
      thumbnail,
      images,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });

    await newFood.save();

    return res.status(201).json({
      success: true,
      message: "Thêm món ăn thành công!",
      food: newFood,
    });
  } catch (error) {
    console.error("Lỗi khi thêm món ăn:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi thêm món ăn!",
      error: error.message,
    });
  }
};

module.exports.editFood = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm món ăn cũ
    const food = await Food.findOne({ _id: id });
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Món ăn không tồn tại",
      });
    }

    // Chỉ kiểm tra trùng tên khi client gửi name khác hiện tại
    if (typeof req.body.name !== "undefined" && req.body.name !== food.name) {
      const existingFood = await Food.findOne({
        name: req.body.name,
        _id: { $ne: id },
        deleted: false,
        status: "active",
      });
      if (existingFood) {
        return res.status(400).json({
          success: false,
          message: "Tên món ăn đã tồn tại, vui lòng chọn tên khác!",
        });
      }
    }

    const parseBoolean = (val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val === 1;
      if (typeof val === "string") return val === "true" || val === "1";
      return undefined;
    };

    // Helper: normalize possible ObjectId representations from body
    const normalizeObjectIdInput = (val) => {
      try {
        if (val === null || val === undefined) return null;
        if (typeof val === 'string') {
          const s = val.trim();
          if (s === '' || s === 'null' || s === 'undefined' || s === '[object Object]') return null;
          // Try JSON parse if looks like an object string
          if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('"') && s.endsWith('"'))) {
            try {
              const parsed = JSON.parse(s);
              if (parsed && typeof parsed === 'object') {
                return parsed._id || parsed.id || null;
              }
            } catch (_) {}
          }
          // assume s is an id string
          return s;
        }
        if (typeof val === 'object') {
          return val._id || val.id || null;
        }
        return null;
      } catch (_) {
        return null;
      }
    };

    // Cập nhật thông tin (chỉ khi được gửi lên)
    if (typeof req.body.name !== "undefined") {
      food.name = req.body.name || food.name;
    }
    if (typeof req.body.price !== "undefined") {
      food.price = req.body.price ? Number(req.body.price) : food.price;
    }
    if (typeof req.body.quantity !== "undefined") {
      food.quantity = req.body.quantity
        ? Number(req.body.quantity)
        : food.quantity;
    }
    if (typeof req.body.rating !== "undefined") {
      food.rating = req.body.rating ? Number(req.body.rating) : food.rating;
    }
    if (typeof req.body.unit !== "undefined") {
      food.unit = req.body.unit || food.unit;
    }
    // Only validate category_id if it's being updated
    if (typeof req.body.category_id !== "undefined") {
      const normalizedCategoryId = normalizeObjectIdInput(req.body.category_id);
      if (!normalizedCategoryId) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn danh mục cho món ăn!",
        });
      }
      food.category_id = normalizedCategoryId;
    }
    if (typeof req.body.status !== "undefined") {
      food.status = req.body.status || food.status;
    }
    if (typeof req.body.discount_id !== "undefined") {
      food.discount_id = normalizeObjectIdInput(req.body.discount_id);
    }
    if (typeof req.body.shipping_id !== "undefined") {
      food.shipping_id = normalizeObjectIdInput(req.body.shipping_id);
    }

    if (typeof req.body.manufacture_date !== "undefined") {
      food.manufacture_date = req.body.manufacture_date
        ? new Date(req.body.manufacture_date)
        : food.manufacture_date;
    }
    if (typeof req.body.expiry_date !== "undefined") {
      food.expiry_date = req.body.expiry_date
        ? new Date(req.body.expiry_date)
        : food.expiry_date;
    }

    const parsedFeatured = parseBoolean(
      req.body.is_featured ?? req.body.featured
    );
    if (typeof parsedFeatured !== "undefined") {
      food.is_featured = parsedFeatured;
    }

    // Map is_New từ form thành isNew cho model
    const parsedIsNew = parseBoolean(
      req.body.is_New ?? req.body.isNew
    );
    if (typeof parsedIsNew !== "undefined") {
      food.isNew = parsedIsNew;
    }

    // Cập nhật ảnh nếu có upload mới
    if (req.files?.thumbnail) {
      food.thumbnail = req.files.thumbnail[0].filename;
    }
    if (req.files?.images) {
      food.images = req.files.images.map((file) => file.filename);
    }

    // Add updatedBy tracking
    food.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await food.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật món ăn thành công!",
      food,
    });
  } catch (error) {
    console.error(
      "Lỗi khi cập nhật món ăn:",
      error && error.stack ? error.stack : error
    );
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật món ăn!",
      error: error && error.message ? error.message : String(error),
    });
  }
};

module.exports.changeStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    const food = await Food.findOne({ _id: id, deleted: false });
    if (!food) {
      return res.status(404).json({ error: "Không tìm thấy món ăn" });
    }

    // Cập nhật status và thêm tracking
    food.status = status;
    food.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await food.save();

    res.json(food);
  } catch (err) {
    console.error("Lỗi changeStatus:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};
// Xóa mềm danh mục
module.exports.deleted = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findOneAndUpdate(
      { _id: id },
      { 
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    return res.json({
      message: "Xóa mềm danh mục thành công",
      data: food,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
module.exports.listFoodDeleted = async (req, res) => {
  try {
    const foods = await Food.find({ deleted: true });

    return res.status(200).json({
      success: true,
      message: "Danh sách món ăn đã xóa",
      foods,
      count: foods.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách món ăn đã xóa:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách món ăn đã xóa",
      error: error.message,
    });
  }
};

// Khôi phục món ăn đã xóa
module.exports.restoreFood = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findOne({ _id: id });
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    if (!food.deleted) {
      return res.status(400).json({
        success: false,
        message: "Món ăn chưa bị xóa",
      });
    }

    food.deleted = false;
    await food.save();

    return res.status(200).json({
      success: true,
      message: "Khôi phục món ăn thành công",
      food,
    });
  } catch (error) {
    console.error("Lỗi khi khôi phục món ăn:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi khôi phục món ăn",
      error: error.message,
    });
  }
};

// Xóa vĩnh viễn món ăn
module.exports.forceFood = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findOne({ _id: id });
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    await Food.findOneAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Xóa món ăn vĩnh viễn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa món ăn vĩnh viễn:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa món ăn vĩnh viễn",
      error: error.message,
    });
  }
};

// Voucher management endpoints
module.exports.getVouchers = async (req, res) => {
  try {
    const vouchers = await Discount.find({ 
      deleted: false, 
      status: 'active' 
    }).select('name code value type description timeSlots');
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher thành công',
      vouchers
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách voucher',
      error: error.message,
    });
  }
};

module.exports.assignVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { voucherId } = req.body;
    
    if (!voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn voucher'
      });
    }
    
    // Kiểm tra món ăn tồn tại
    const food = await Food.findOne({ _id: id, deleted: false });
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }
    
    // Kiểm tra voucher tồn tại và đang hoạt động
    const voucher = await Discount.findOne({ 
      _id: voucherId, 
      deleted: false, 
      status: 'active' 
    });
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher không tồn tại hoặc không hoạt động'
      });
    }
    
    // Cập nhật voucher cho món ăn
    food.discount_id = voucherId;
    food.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });
    
    await food.save();
    
    // Populate voucher info để trả về
    const foodWithVoucher = await Food.findById(id)
      .populate('discount_id', 'name code value type')
      .populate('category_id', 'name');
    
    return res.status(200).json({
      success: true,
      message: 'Áp dụng voucher thành công',
      food: foodWithVoucher
    });
  } catch (error) {
    console.error('Lỗi khi áp dụng voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi áp dụng voucher',
      error: error.message,
    });
  }
};

module.exports.removeVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra món ăn tồn tại
    const food = await Food.findOne({ _id: id, deleted: false });
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }
    
    // Gỡ voucher khỏi món ăn
    food.discount_id = null;
    food.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });
    
    await food.save();
    
    return res.status(200).json({
      success: true,
      message: 'Gỡ voucher thành công',
      food
    });
  } catch (error) {
    console.error('Lỗi khi gỡ voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gỡ voucher',
      error: error.message,
    });
  }
};
