const User = require("../../model/UserModel");

// Middleware for web pages (redirects to login)
module.exports.requireAuth = async (req, res, next) => {
  const tokenUser = req.cookies.tokenUser;
  if (!tokenUser) {
    res.redirect(`/user/login`);
  } else {
    const user = await User.findOne({
      tokenUser: tokenUser,
    }).select("-password");
    if (!user) {
      req.flash("error","Vui lòng đăng nhập ! ")
      res.redirect(`/user/login`);
      return;
    }
    res.locals.user = user;
    next();
  }
};

// Middleware for API routes (returns JSON response)
module.exports.requireAuthAPI = async (req, res, next) => {
  try {
    const tokenUser = req.cookies.tokenUser;
    if (!tokenUser) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    const user = await User.findOne({
      tokenUser: tokenUser,
      deleted: false
    }).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Lỗi middleware requireAuthAPI:", error);
    return res.status(500).json({ message: "Lỗi server khi xác thực." });
  }
};

// Optional auth middleware - sets req.user if token exists, but doesn't require it
module.exports.optionalAuthAPI = async (req, res, next) => {
  try {
    const tokenUser = req.cookies.tokenUser;
    if (tokenUser) {
      const user = await User.findOne({
        tokenUser: tokenUser,
        deleted: false
      }).select("-password");
      
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Lỗi middleware optionalAuthAPI:", error);
    next(); // Continue even if there's an error
  }
};
