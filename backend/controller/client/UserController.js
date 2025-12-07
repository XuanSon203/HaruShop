const User = require("../../model/UserModel");
const Cart = require("../../model/CartModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const ForgotPassword = require("../../model/Forgot-PasswordModel");
const generateMailHelper = require("../../helpers/generrate");
const sendMailHelper = require("../../helpers/send-mail");
module.exports.index = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies && req.cookies.tokenUser;
    const tokenFromBody = req.body && req.body.tokenUser;
    const tokenFromHeader = req.headers && req.headers["x-token-user"]; // optional header
    const token = tokenFromCookie || tokenFromBody || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const user = await User.findOne({ tokenUser: token, deleted: false });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports.register = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Kiểm tra input
    if (!email || !phone || !password) {
      return res
        .status(400)
        .json({ error: { input: "Vui lòng nhập đầy đủ thông tin" } });
    }

    // Check email & phone tồn tại
    const emailExists = await User.findOne({ email });
    const phoneExists = await User.findOne({ phone });

    let errors = {};
    if (emailExists) errors.email = "Email đã tồn tại";
    if (phoneExists) errors.phone = "Số điện thoại đã được đăng ký";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: errors });
    }
    // Hash password
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    // Lưu user mới (thay password bằng hashPassword)
    const newUser = new User({
      ...req.body,
      password: hashPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { server: "Lỗi server, vui lòng thử lại" } });
  }
};
// Đăng nhập
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Tìm user
    const user = await User.findOne({ email, deleted: false });
    if (!user) return res.status(400).json({ error: "Email không tồn tại" });

    if (user.status === "inactive") {
      return res.status(400).json({
        error:
          "Tài khoản này đã bị khóa. Liên hệ với quản trị viên để biết thêm thông tin!",
      });
    }

    // 2. Kiểm tra mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Tăng số lần nhập sai
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = failedAttempts;
      
      // Nếu nhập sai 5 lần → khóa tài khoản
      if (failedAttempts >= 5) {
        user.status = "inactive";
        user.failedLoginAttempts = 0; // Reset counter sau khi khóa
        await user.save();
        return res.status(400).json({
          error: "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên!",
        });
      }
      
      // Nếu nhập sai 3 lần → cảnh báo
      if (failedAttempts === 3) {
        await user.save();
        return res.status(400).json({
          error: "Bạn đã nhập sai mật khẩu 3 lần. Nếu nhập sai thêm 2 lần nữa, tài khoản sẽ bị khóa!",
        });
      }
      
      // Nhập sai nhưng chưa đến 3 lần
      await user.save();
      return res.status(400).json({ error: "Sai mật khẩu" });
    }

    // Đăng nhập thành công → reset counter
    user.failedLoginAttempts = 0;
    
    // Tạo mới tokenUser để phiên đăng nhập mới
    const newToken = crypto.randomBytes(24).toString("hex");
    user.tokenUser = newToken;
    await user.save();

    // Set cookie httpOnly để phía client không truy cập được token
    res.cookie("tokenUser", newToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false, // đặt true nếu dùng HTTPStokenUser
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: "/",
    });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Logout
module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.tokenUser;
    const cartId = req.cookies && req.cookies.cartId;
    if (token) {
      const user = await User.findOne({ tokenUser: token });
      if (user) {
        user.tokenUser = null;
        await user.save();
      }
    }
    res.clearCookie("cartId", {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      domain: "localhost"
    });
    res.clearCookie("tokenUser", {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      domain: "localhost"
    });
    res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi logout:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;
    const { fullName, email, phone } = req.body;

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    // Find user by token
    const user = await User.findOne({ tokenUser: tokenUser, deleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Check if email is already used by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email: email,
        deleted: false,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng bởi tài khoản khác",
        });
      }
    }

    // Update user info
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      select: "-password",
    });

    return res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin",
    });
  }
};

// Change password
module.exports.changePassword = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;
    const { currentPassword, newPassword } = req.body;

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    // Find user by token
    const user = await User.findOne({ tokenUser: tokenUser, deleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(user._id, { password: hashedNewPassword });

    return res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu",
    });
  }
};

// Upload avatar
module.exports.uploadAvatar = async (req, res) => {
  try {
    const tokenUser = req.cookies?.tokenUser;

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file hình ảnh",
      });
    }

    // Find user by token
    const user = await User.findOne({ tokenUser: tokenUser, deleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Update avatar path
    const avatarPath = req.file.filename;
    await User.findByIdAndUpdate(user._id, { avatar: avatarPath });

    return res.json({
      success: true,
      message: "Cập nhật avatar thành công",
      avatar: avatarPath,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật avatar",
    });
  }
};
module.exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại",
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Admin.",
      });
    }

    // 1. Tạo mã OTP và lưu vào collection
    const otp = generateMailHelper.generateRandomNumber(6);

    const objectForgotPassword = {
      email: email,
      otp: otp,
      expireAt: Date.now() + 3 * 60 * 1000, // hết hạn sau 3 phút
    };

    const forgotPassword = new ForgotPassword(objectForgotPassword);
    await forgotPassword.save();

    // 2. Gửi mail
    const subject = "Mã OTP lấy lại mật khẩu";
    const html = `
      Mã OTP lấy lại mật khẩu là <b>${otp}</b>. 
      Thời hạn sử dụng là 3 phút. Không chia sẻ mã này cho bất kỳ ai.
    `;
    sendMailHelper.sendMail(email, subject, html);
    return res.status(200).json({
      success: true,
      message: "Đã gửi mã OTP đến email của bạn.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Verify OTP
module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mã OTP",
      });
    }

    // Find latest OTP record for email and otp
    const record = await ForgotPassword.findOne({ email, otp }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ" });
    }

    if (record.expireAt && new Date(record.expireAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn" });
    }

    return res.status(200).json({ success: true, message: "Xác thực OTP thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server khi xác thực OTP" });
  }
};

// Reset password with email + otp
module.exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email, mã OTP và mật khẩu mới",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const record = await ForgotPassword.findOne({ email, otp }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ" });
    }

    if (record.expireAt && new Date(record.expireAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn" });
    }

    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(user._id, { password: hashedNewPassword });

    // Cleanup OTPs for this email
    await ForgotPassword.deleteMany({ email });

    return res.status(200).json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server khi đặt lại mật khẩu" });
  }
};
