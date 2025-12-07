const Customer = require("../../model/AddressModel");
const User = require("../../model/UserModel");

module.exports.index = async (req, res) => {
  try {
    // If tokenUser cookie is present, filter by that user's id
    const tokenUser = req.cookies?.tokenUser;
    let filter = {};
    if (tokenUser) {
      try {
        const user = await User.findOne({ tokenUser, deleted: false });
        if (user) {
          filter.user_id = user._id;
        }
      } catch (_) {}
    }

    const customers = await Customer.find(filter).select(
      "fullName phone address user_id"
    );
    // map addresses to flat display strings for FE convenience
    const data = customers.map((c) => ({
      _id: c._id,
      fullName: c.fullName,
      phone: c.phone,
      user_id: c.user_id,
      address: c.address,
    }));
    res.json({ success: true, customers: data });
  } catch (error) {
    console.error("Customer index error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
module.exports.add = async (req, res) => {
  try {
    const { user_id, fullName, phone, address } = req.body || {};

    if (!fullName || !phone || !address) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin" });
    }

    // Kiểm tra số lượng địa chỉ tối đa (5 địa chỉ)
    let filter = {};
    if (user_id) {
      filter.user_id = user_id;
    } else {
      // Nếu không có user_id, lấy từ tokenUser
      const tokenUser = req.cookies?.tokenUser;
      if (tokenUser) {
        try {
          const user = await User.findOne({ tokenUser, deleted: false });
          if (user) {
            filter.user_id = user._id;
          }
        } catch (_) {}
      }
    }

    const addressCount = await Customer.countDocuments(filter);
    if (addressCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có tối đa 5 địa chỉ. Vui lòng xóa một địa chỉ hoặc thay đổi địa chỉ hiện có.",
      });
    }

    // Check duplicate phone number
    const existed = await Customer.findOne({ phone: String(phone).trim() });
    if (existed) {
      return res
        .status(409)
        .json({ success: false, message: "Số điện thoại đã được sử dụng" });
    }
    // Normalize into schema shape
    const doc = new Customer({
      user_id: user_id || filter.user_id || undefined,
      fullName,
      phone,
      address,
    });
    await doc.save();
    res.status(201).json({ success: true, customer: doc });
  } catch (error) {
    console.error("Customer add error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật thông tin khách hàng (sửa địa chỉ, tên, điện thoại)
module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params || {};
    const { fullName, phone, address } = req.body || {};

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu id khách hàng" });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khách hàng" });
    }

    // Nếu đổi số điện thoại, kiểm tra trùng số ở bản ghi khác
    if (phone && String(phone).trim() !== String(customer.phone)) {
      const duplicated = await Customer.findOne({
        phone: String(phone).trim(),
        _id: { $ne: id },
      });
      if (duplicated) {
        return res.status(409).json({
          success: false,
          message: "Số điện thoại đã được sử dụng",
        });
      }
    }

    if (typeof fullName === "string" && fullName.trim()) {
      customer.fullName = fullName.trim();
    }
    if (typeof phone === "string" && phone.trim()) {
      customer.phone = phone.trim();
    }
    if (typeof address !== "undefined") {
      customer.address = address;
    }

    await customer.save();

    res.json({ success: true, customer });
  } catch (error) {
    console.error("Customer edit error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa địa chỉ
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params || {};

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu id địa chỉ" });
    }

    // Kiểm tra quyền: chỉ cho phép xóa địa chỉ của chính user đó
    const tokenUser = req.cookies?.tokenUser;
    let user = null;
    if (tokenUser) {
      try {
        user = await User.findOne({ tokenUser, deleted: false });
      } catch (_) {}
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ" });
    }

    // Kiểm tra quyền: chỉ cho phép xóa địa chỉ của chính user đó
    if (user && customer.user_id && String(customer.user_id) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa địa chỉ này",
      });
    }

    await Customer.findByIdAndDelete(id);

    res.json({ success: true, message: "Xóa địa chỉ thành công" });
  } catch (error) {
    console.error("Customer delete error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
