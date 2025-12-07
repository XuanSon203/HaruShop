const User = require("../../model/UserModel");
const Role = require("../../model/RoleModel");
const bcrypt = require("bcrypt");
const Account = require("../../model/AccountModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

const crypto = require("crypto");

module.exports.index = async (req, res) => {
  try {
    // Lấy query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "createdAt"; // mặc định sort theo ngày tạo
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // Điều kiện tìm kiếm
    let find = { deleted: false };
    if (search) {
      find.name = { $regex: search, $options: "i" };
    }

    // Đếm số user đã xóa
    const countUserDeleted = await User.countDocuments({ deleted: true });

    // Đếm tổng số user thỏa điều kiện
   const totalUsers = await User.countDocuments(find);
 
    // Skip + limit phân trang
    const skip = (page - 1) * limit;

    // Lấy danh sách user
    const users = await User.find(find)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // Populate user information for createdBy, updatedBy, deletedBy
    const usersWithUserInfo = await populateUserInfoArray(users);
    
    // Trả về JSON
    res.json({
      users: usersWithUserInfo,
      countUserDeleted,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports.listUserDeleted = async (req, res) => {
  try {
    const users = await User.find({ deleted: true });
    
    // Populate user information for deleted users
    const usersWithUserInfo = await populateUserInfoArray(users);
    
    res.json({ users: usersWithUserInfo }); // trả về object có key users
  } catch (error) {
    console.error("Lỗi listUserDeleted:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports.addUser = async (req, res) => {
  try {
    const password = req.body.password;
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    
    // Lưu user mới (thay password bằng hashPassword)
    const newUser = new User({
      ...req.body,
      password: hashPassword,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });
    
    await newUser.save();
    
    // Auto-create admin support Account for owner (chủ) if missing
    try {
      await ensureOwnerSupportAccount(newUser);
    } catch (autoErr) {
      console.error("Ensure owner support Account on create error:", autoErr);
    }

    // Populate user information before returning
    const userWithUserInfo = await populateUserInfo(newUser);

    res.json(userWithUserInfo);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.editUser = async (req, res) => {
  try {
    const { user_id, fullName, email, phone } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Thiếu user_id" });
    }

    // Find user first to add updatedBy tracking
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    
    // Add updatedBy tracking
    user.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await user.save();

    // Ensure admin support Account for owner after edit
    try {
      await ensureOwnerSupportAccount(user);
    } catch (autoErr) {
      console.error("Ensure owner support Account on edit error:", autoErr);
    }

    // Populate user information before returning
    const userWithUserInfo = await populateUserInfo(user);

    res.json(userWithUserInfo);
  } catch (err) {
    console.error("Lỗi update:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};
module.exports.deletedUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id, 
      { 
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    const users = await User.find({ deleted: false });
    
    // Populate user information for remaining users
    const usersWithUserInfo = await populateUserInfoArray(users);

    res.json(usersWithUserInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PUT /admin/users/changeStatus/:id/:status
module.exports.changeStatus = async (req, res) => {
  try {
    const { id, newStatus } = req.params;


    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    user.status = newStatus;
    
    // Add updatedBy tracking
    user.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await user.save();

    // Populate user information before returning
    const userWithUserInfo = await populateUserInfo(user);

    res.json(userWithUserInfo);
  } catch (err) {
    console.error("Lỗi changeStatus:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};
module.exports.resetUser = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không tồn tại" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    user.deleted = false;
    
    // Add updatedBy tracking for restore action
    user.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await user.save();

    // Populate user information before returning
    const userWithUserInfo = await populateUserInfo(user);

    res.status(200).json({
      message: "Reset user thành công",
      user: userWithUserInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
// Xóa khỏi CSDL
module.exports.deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không được để trống" });
    }

    // Check if user exists before deletion
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user để xóa" });
    }


    const result = await User.deleteOne({ _id: id });
    const account = await Account.deleteOne({user_id:id});

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy user để xóa" });
    }

    // Xóa thành công
    res.status(200).json({ 
      message: "Xóa user vĩnh viễn thành công",
      deletedUser: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        deletedBy: req.account?._id || null,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};