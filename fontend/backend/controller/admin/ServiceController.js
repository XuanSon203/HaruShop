const Service = require("../../model/ServiceModel");
const Category = require("../../model/CategoryModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

module.exports.index = async (req, res) => {
  try {
    // Lấy query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // Điều kiện tìm kiếm
    let find = { deleted: false };
    if (search) {
      find.serviceName = { $regex: search, $options: "i" };
    }

    // Đếm số dịch vụ đã xóa (soft delete)
    const countServiceDeleted = await Service.countDocuments({ deleted: true });

    // Đếm tổng số dịch vụ thỏa điều kiện
    const totalServices = await Service.countDocuments(find);

    // Skip + limit phân trang
    const skip = (page - 1) * limit;

    // Lấy danh sách service
    const services = await Service.find(find)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Populate user information
    const servicesWithUserInfo = await populateUserInfoArray(services);

    // Trả về JSON
    res.json({
      services: servicesWithUserInfo,
      countServiceDeleted,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalServices / limit),
        totalServices,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy services:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Thêm service mới
module.exports.add = async (req, res) => {
  try {
    const { serviceName, description, price } = req.body;

    // --- VALIDATE CƠ BẢN ---
    if (!serviceName || !description || !price) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    if (!serviceName.trim()) {
      return res
        .status(400)
        .json({ message: "Tên dịch vụ không được để trống" });
    }

    if (!description.trim()) {
      return res.status(400).json({ message: "Mô tả không được để trống" });
    }

    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ message: "Giá phải là số lớn hơn 0" });
    }

    // --- KIỂM TRA TRÙNG TÊN ---
    const existingService = await Service.findOne({
      serviceName: { $regex: new RegExp("^" + serviceName + "$", "i") },
      deleted: false,
      status: "active",
    });

    if (existingService) {
      return res.status(400).json({ message: "Tên dịch vụ đã tồn tại" });
    }

    // --- VALIDATE FILE ẢNH (nếu có) ---
    let imageUrl = null;
    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Chỉ chấp nhận ảnh JPG/PNG" });
      }
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Ảnh phải nhỏ hơn 2MB" });
      }
      imageUrl = `/uploads/services/${req.file.filename}`;
    }

    // --- TẠO SERVICE ---
    const service = new Service({
      serviceName: serviceName.trim(),
      description: description.trim(),
      price: Number(price),
      image: imageUrl,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });

    const savedService = await service.save();

    res.status(201).json({
      message: "Thêm dịch vụ thành công",
      service: savedService,
    });
  } catch (error) {
    console.error("Lỗi khi thêm service:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // --- Kiểm tra trùng tên (theo user_id, loại trừ id hiện tại) ---
    if (updateData.serviceName) {
      const exists = await Service.findOne({
        serviceName: {
          $regex: new RegExp("^" + updateData.serviceName + "$", "i"),
        },
        _id: { $ne: id },
        deleted: false,
        status: "active",
      });
      if (exists) {
        return res.status(400).json({
          message: "Tên dịch vụ đã tồn tại, vui lòng chọn tên khác",
        });
      }
    }

    // --- Nếu có file ảnh ---
    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Chỉ chấp nhận ảnh JPG/PNG" });
      }
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Ảnh phải nhỏ hơn 2MB" });
      }
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    // --- Update vào DB ---
    const service = await Service.findOneAndUpdate(
      { _id: id }, 
      { 
        ...updateData,
        $push: {
          updatedBy: {
            account_id: req.account?._id || null,
            updatedAt: new Date(),
          }
        }
      }, 
      {
        new: true,
      }
    );

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    return res.json({
      message: "Cập nhật dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Tên dịch vụ đã tồn tại, vui lòng chọn tên khác",
      });
    }
    console.error("Lỗi khi update service:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// Xóa mềm danh mục
module.exports.deleted = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndUpdate(
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

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    return res.json({
      message: "Xóa mềm danh mục thành công",
      data: service,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
module.exports.changeStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    // Cập nhật status và thêm tracking, không validate toàn bộ document
    const updatedService = await Service.findByIdAndUpdate(
      id,
      {
        status: status,
        $push: {
          updatedBy: {
            account_id: req.account?._id || null,
            updatedAt: new Date(),
          },
        },
      },
      { new: true } // trả về document mới
    );

    if (!updatedService) {
      return res.status(404).json({ error: "Không tìm thấy dịch vụ" });
    }

    res.json(updatedService);
  } catch (err) {
    console.error("Lỗi changeStatus:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};
module.exports.listServicesDeleted = async (req, res) => {
  try {
    const listServices = await Service.find({ deleted: true });

    // Trả về JSON
    res.json({
      services: listServices,
      totalDeleted: listServices.length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dịch vụ đã xóa:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
module.exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndUpdate(
      { _id: id },
      { deleted: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    return res.json({ message: "Khôi phục dịch vụ thành công", data: service });
  } catch (error) {
    console.error("Lỗi khôi phục dịch vụ:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- Xóa vĩnh viễn ---
module.exports.forceDelete = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOneAndDelete({
      _id: id,
    });

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    return res.json({ message: "Xóa vĩnh viễn dịch vụ thành công" });
  } catch (error) {
    console.error("Lỗi xóa vĩnh viễn:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
