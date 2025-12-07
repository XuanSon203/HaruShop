const Account = require("../../model/AccountModel");
const Role = require("../../model/RoleModel");

module.exports.requireAuth = async (req, res, next) => {
  try {
    // Lấy token từ cookies hoặc Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
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

    // Lấy role kèm quyền (không cần kiểm tra role name)
    const role = await Role.findById(account.role_id).select(
      "roleName permissions"
    );

    // Nếu role không tồn tại
    if (!role) {
      // Xóa cookie nếu có
      res.clearCookie("token", { path: "/" });
      res.clearCookie("fullName", { path: "/" });
      return res.status(403).json({
        success: false,
        message: "Không tìm thấy thông tin quyền hạn. Vui lòng liên hệ quản trị viên.",
        redirect: "/admin/auth/login",
      });
    }

    // Kiểm tra nếu role không phải admin thì đẩy về login
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
        redirect: "/admin/auth/login",
      });
    }

    req.account = account;
    req.role = role;

    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
};
