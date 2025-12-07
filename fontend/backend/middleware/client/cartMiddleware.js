const Cart = require("../../model/CartModel");
const User = require("../../model/UserModel");

module.exports.cartId = async (req, res, next) => {
  try {
    const tokenUser = req.cookies.tokenUser;
    if (!tokenUser) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    }

    const user = await User.findOne({ tokenUser, deleted: false });
    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }

    let cart = await Cart.findOne({ user_id: String(user._id) });
    if (!cart) {
      cart = await Cart.create({
        user_id: String(user._id),
        products: [],
      });
    }
   
    req.user = user;
    req.cart = cart;

    next();
  } catch (error) {
    console.error("Lỗi middleware cartId:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi kiểm tra giỏ hàng." });
  }
};
