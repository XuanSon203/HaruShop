const Role = require("../../model/RoleModel");
const {
  populateUserInfo,
  populateUserInfoArray,
} = require("../../helpers/populateUserInfo");

module.exports.index = async (req, res) => {
  try {
    let find = {
      deleted: false,
    };
    const roles = await Role.find(find);

    // Populate user information
    const rolesWithUserInfo = await populateUserInfoArray(roles);

    res.json(rolesWithUserInfo);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách roles:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports.addRole = async (req, res) => {
  try {
    const role = new Role({
      ...req.body,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });
    await role.save();

    // Populate user info
    const roleWithUserInfo = await populateUserInfo(role);

    // 📩 Gửi SMS thông báo (chỉ để test)
    try {
      const phone = process.env.TO_NUMBER; // Lấy số test từ .env
      const message = `🔔 Vai trò mới '${role.name}' vừa được tạo trong hệ thống.`;
      await sendSMS(phone, message);
    } catch (smsError) {
      console.error("❌ Lỗi khi gửi SMS thông báo:", smsError);
    }

    res.json(roleWithUserInfo);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.editRole = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không được để trống" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Không tìm thấy role" });
    }

    // Update fields
    Object.assign(role, req.body);

    // Add updatedBy tracking
    role.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await role.save();

    // Populate user information before returning
    const roleWithUserInfo = await populateUserInfo(role);

    res.status(200).json(roleWithUserInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
module.exports.deletedRole = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID không được để trống" });
    }

    const deletedRole = await Role.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        },
      },
      { new: true } // trả về document đã update
    );

    if (!deletedRole) {
      return res.status(404).json({ message: "Không tìm thấy role" });
    }

    // Populate user information before returning
    const roleWithUserInfo = await populateUserInfo(deletedRole);

    res.status(200).json({
      message: "Xóa role thành công",
      role: roleWithUserInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
// Controller example
module.exports.changeStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: "Role không tồn tại" });

    role.status = role.status === "active" ? "inactive" : "active";

    // Add updatedBy tracking
    role.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await role.save();

    // Populate user information before returning
    const roleWithUserInfo = await populateUserInfo(role);

    res.status(200).json(roleWithUserInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// Get role by id
module.exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role || role.deleted) {
      return res.status(404).json({ message: "Không tìm thấy role" });
    }

    // Populate user information before returning
    const roleWithUserInfo = await populateUserInfo(role);

    res.json(roleWithUserInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Update role permissions
module.exports.updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "permissions phải là mảng" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Không tìm thấy role" });
    }

    role.permissions = permissions;

    // Add updatedBy tracking
    role.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await role.save();

    // Populate user information before returning
    const roleWithUserInfo = await populateUserInfo(role);

    res.json({
      message: "Cập nhật permissions thành công",
      role: roleWithUserInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
