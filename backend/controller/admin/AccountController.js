const Account = require("../../model/AccountModel");
const User = require("../../model/UserModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const saltRounds = 10;

module.exports.index = async (req, res) => {
  try {
    let find = { deleted: false };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const countAccountDeleted = await Account.countDocuments({ deleted: true });
    const totalAccount = await Account.countDocuments(find);

    const accounts = await Account.find(find).skip(skip).limit(limit);

    res.status(200).json({
      accounts,
      countAccountDeleted,
      currentPage: page,
      totalPages: Math.ceil(totalAccount / limit),
      total: totalAccount,
      limit,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách accounts:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách accounts" });
  }
};

module.exports.add = async (req, res) => {
  try {
    const { userName,fullName, email, password } = req.body;

    // 1️⃣ Kiểm tra trùng username
    const existingUsername = await Account.findOne({
      userName,
      deleted: false,
    });
    if (existingUsername) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
    }

    // 2️⃣ Kiểm tra trùng email (trong bảng account)
    const existingEmail = await Account.findOne({
      email,
      deleted: false,
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    // 2️⃣.1 Kiểm tra trùng email với bảng user (khách hàng)
    const existingUserEmail = await User.findOne({ email, deleted: false }).select("_id");
    if (existingUserEmail) {
      return res.status(400).json({ message: "Email này đã tồn tại ở tài khoản khách hàng!" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4️⃣ Tạo token
    const token = crypto.randomBytes(32).toString("hex");

    // 5️⃣ Tạo tài khoản mới
    const account = new Account({
      userName,
      fullName,
      email,
      password: hashedPassword,
      token,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });

    await account.save();

   res.status(201).json({
  success: true,
  message: "Tạo tài khoản thành công",
  account
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo tài khoản" });
  }
};

module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ message: "Thiếu ID tài khoản" });
    }

    // Kiểm tra tài khoản tồn tại
    const account = await Account.findOne({
      _id: id,
      deleted: false,
    });
    
    if (!account) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản hoặc đã bị xóa!" });
    }

    // Kiểm tra trùng userName
    if (updateData.userName && updateData.userName !== account.userName) {
      const existingUserName = await Account.findOne({
        userName: updateData.userName,
        _id: { $ne: id },
        deleted: false,
      });
      if (existingUserName) {
        return res.status(400).json({
          message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác!",
        });
      }
    }

    // Kiểm tra trùng email (bảng account)
    if (updateData.email && updateData.email !== account.email) {
      const existingEmail = await Account.findOne({
        email: updateData.email,
        _id: { $ne: id },
        deleted: false,
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email đã được sử dụng, vui lòng chọn email khác!",
        });
      }

      // Kiểm tra trùng email với bảng user (khách hàng)
      const existingUserEmail = await User.findOne({ email: updateData.email, deleted: false }).select("_id");
      if (existingUserEmail) {
        return res.status(400).json({
          message: "Email này đã tồn tại ở tài khoản khách hàng!",
        });
      }
    }

    // Kiểm tra trùng số điện thoại
    if (updateData.phone && updateData.phone !== account.phone) {
      const existingPhone = await Account.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
        deleted: false,
      });
      if (existingPhone) {
        return res
          .status(400)
          .json({ message: "Số điện thoại đã được đăng ký!" });
      }
    }

    // Hash lại mật khẩu nếu có nhập
    if (updateData.password && updateData.password.trim() !== "") {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    } else {
      delete updateData.password;
    }

    // Cập nhật dữ liệu
    Object.assign(account, updateData);

    // Thêm tracking
    account.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await account.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      account
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật account:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật account!" });
  }
};

module.exports.deleted = async (req, res) => {
  try {
    const accountId = req.params.id;

    // Kiểm tra tài khoản tồn tại
    const account = await Account.findOne({ _id: accountId, deleted: false });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Tài khoản không tồn tại hoặc đã bị xóa!" });
    }

    // Soft delete
    const deletedAccount = await Account.findByIdAndUpdate(
      accountId,
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Đã chuyển trạng thái xóa thành công!",
      account: deletedAccount,
    });
  } catch (err) {
    console.error("Lỗi khi xóa account:", err);
    return res.status(500).json({ message: "Lỗi server khi xóa account!" });
  }
};

module.exports.changeStatus = async (req, res) => {
  try {
    const { id, newStatus } = req.params;


    const account = await Account.findOne({ _id: id, deleted: false });
    if (!account) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản" });
    }

    // Cập nhật status
    account.status = newStatus;
    account.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await account.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      account
    });
  } catch (err) {
    console.error("Lỗi changeStatus:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

module.exports.accountDeleted = async (req, res) => {
  try {
    let find = { deleted: true };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalAccount = await Account.countDocuments(find);

    const accounts = await Account.find(find).skip(skip).limit(limit);

    res.status(200).json({
      accounts,
      currentPage: page,
      totalPages: Math.ceil(totalAccount / limit),
      total: totalAccount,
      limit,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách accounts đã xóa:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách accounts" });
  }
};

// Khôi phục tài khoản (reset trạng thái deleted)
module.exports.resetUser = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không tồn tại" });
    }

    const account = await Account.findOne({ _id: id, deleted: true });
    if (!account) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Khôi phục
    account.deleted = false;
    account.deletedAt = null;
    account.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await account.save();

    res.status(200).json({
      success: true,
      message: "Khôi phục tài khoản thành công",
      account,
    });
  } catch (error) {
    console.error("Lỗi khi khôi phục user:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Xóa vĩnh viễn tài khoản
module.exports.deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không tồn tại" });
    }

    const account = await Account.findOne({ _id: id, deleted: true });
    if (!account) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Xóa vĩnh viễn
    await Account.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa vĩnh viễn user:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};