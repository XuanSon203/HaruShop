const Account = require("../../model/AccountModel");
const Role = require("../../model/RoleModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

module.exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu",
      });
    }

    // Tìm tài khoản theo email (case-insensitive)
    const account = await Account.findOne({
      email:email
    });


    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu",
      });
    }

    // Kiểm tra quyền (phải có role_id mới cho login)
    if (!account.role_id) {
      return res.status(403).json({
        success: false,
        message:
          "Tài khoản không có quyền truy cập. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Kiểm tra role trước khi cho phép login (chỉ cho admin login)
    const role = await Role.findById(account.role_id).select("roleName");
    if (!role || role.roleName !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không có quyền truy cập trang quản trị. Vui lòng đăng nhập với tài khoản admin.",
      });
    }

    // Tạo token mới (random string)
    const token = crypto.randomBytes(32).toString("hex");

    // Lưu token vào DB
    account.token = token;
    await account.save();

    // Lưu token vào cookie: Session cookie (tự xóa khi đóng trình duyệt)
    res.cookie("token", token, {
      httpOnly: false, // cho phép frontend đọc được
      secure: false, // nếu dùng https => true
      sameSite: "Lax",
      // Không set maxAge để cookie tự xóa khi đóng trình duyệt (session cookie)
      path: "/", // đảm bảo cookie có thể đọc từ mọi route
    });

    // Lưu tên đầy đủ để hiển thị trên giao diện (session cookie)
    res.cookie("fullName", account.fullName || "", {
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      // Không set maxAge để cookie tự xóa khi đóng trình duyệt
      path: "/",
    });

    // Trả thông tin account về FE
    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      account: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        role: account.role_id,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
};
// Verify token and get user info
module.exports.verify = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    // Tìm account có token trong DB
    const account = await Account.findOne({ token }).select("-password");
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Kiểm tra role_id tồn tại
    if (!account.role_id) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không có quyền truy cập. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Lấy role kèm quyền
    const role = await Role.findById(account.role_id).select("roleName permissions");

    // Nếu role không tồn tại
    if (!role) {
      // Xóa cookie nếu có
      res.clearCookie("token", { path: "/" });
      res.clearCookie("fullName", { path: "/" });
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy thông tin quyền hạn. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Kiểm tra nếu role không phải admin
    if (role.roleName !== "admin") {
      // Xóa token trong database
      account.token = null;
      await account.save();
      
      // Xóa cookie
      res.clearCookie("token", { path: "/" });
      res.clearCookie("fullName", { path: "/" });
      
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập trang quản trị. Vui lòng đăng nhập với tài khoản admin.",
      });
    }

    return res.json({
      success: true,
      account: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        status: account.status,
      },
      role: {
        id: role._id,
        roleName: role.roleName,
        permissions: role.permissions || [],
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Logout
module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (token) {
      const account = await Account.findOne({ token: token });
      if (account) {
        account.token = null;
        await account.save();
      }
    }
    // Xóa tất cả cookie liên quan
    res.clearCookie("token", {
      httpOnly: false,
      sameSite: "Lax",
      secure: false,
      path: "/",
    });
    res.clearCookie("fullName", {
      httpOnly: false,
      sameSite: "Lax",
      secure: false,
      path: "/",
    });
    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi logout:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};
