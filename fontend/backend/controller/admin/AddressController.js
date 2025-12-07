const Customer = require("../../model/AddressModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

// GET /admin/customers?search=&page=&limit=
module.exports.index = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", user_id } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const query = {};
    // If logged-in user exists (via token cookie), scope customers to that user by default
    try {
      const tokenUser = req.cookies?.tokenUser;
      if (tokenUser) {
        const User = require("../../model/UserModel");
        const u = await User.findOne({ tokenUser, deleted: false }).select("_id");
        if (u) query.user_id = u._id;
      }
    } catch (_) {}
    // explicit user_id filter (optional)
    if (user_id) query.user_id = user_id;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const totalCustomers = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("fullName phone address createdAt createdBy updatedBy deletedBy")
      .lean();

    // Populate user information
    const customersWithUserInfo = await populateUserInfoArray(customers);

    return res.json({
      success: true,
      customers: customersWithUserInfo,
      totalCustomers,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCustomers / limitNum),
    });
  } catch (err) {
    console.error("Admin Customer index error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /admin/customers/stats - quick total count only
module.exports.stats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({});
    return res.json({ success: true, totalCustomers });
  } catch (err) {
    console.error("Admin Customer stats error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /admin/customers/:id
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Thiếu ID" });
    
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    
    const { fullName, phone, address } = req.body || {};
    if (fullName !== undefined) customer.fullName = String(fullName);
    if (phone !== undefined) customer.phone = String(phone);
    if (address !== undefined) customer.address = String(address);
    
    // Add updatedBy tracking
    customer.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });
    
    await customer.save();
    
    // Populate user information before returning
    const customerWithUserInfo = await populateUserInfo(customer);
    
    return res.json({ success: true, customer: customerWithUserInfo });
  } catch (err) {
    console.error("Admin Customer update error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /admin/customers/:id
module.exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Thiếu ID" });
    
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    
    
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    
    return res.json({ 
      success: true, 
      message: "Đã xoá khách hàng",
      deletedCustomer: {
        id: customer._id,
        fullName: customer.fullName,
        phone: customer.phone,
        deletedBy: req.account?._id || null,
        deletedAt: new Date()
      }
    });
  } catch (err) {
    console.error("Admin Customer remove error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};


