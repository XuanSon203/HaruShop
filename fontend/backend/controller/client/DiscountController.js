const Discount = require("../../model/DiscountModel");

// API cho client - lấy danh sách voucher active
module.exports.getActiveVouchers = async (req, res) => {
  try {
    // Nhiều hệ thống không bật timeSlots, vì vậy trả về tất cả voucher đang active.
    // Nếu bạn cần giới hạn theo khung giờ, có thể bật bộ lọc timeSlots lại.
    const vouchers = await Discount.find({
      deleted: false,
      status: "active",
    }).select('name code description value type');

    res.json({ 
      success: true, 
      vouchers: vouchers.map(v => ({
        code: v.code,
        name: v.name,
        description: v.description,
        value: v.value,
        type: v.type
      }))
    });
  } catch (error) {
    console.error("Get active vouchers error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy danh sách voucher" });
  }
};

// API để validate voucher code
module.exports.validateVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ success: false, message: "Thiếu mã voucher" });
    }

    const currentDate = new Date();
    const currentTime = currentDate.toTimeString().slice(0, 5);
    const currentDateStr = currentDate.toISOString().slice(0, 10);
    
    const voucher = await Discount.findOne({
      code: code,
      deleted: false,
      status: "active",
      $or: [
        { timeSlots: { $exists: false } },
        {
          timeSlots: {
            $elemMatch: {
              date: currentDateStr,
              startTime: { $lte: currentTime },
              endTime: { $gte: currentTime }
            }
          }
        }
      ]
    });

    if (!voucher) {
      return res.json({ 
        success: false, 
        message: "Mã voucher không hợp lệ hoặc đã hết hạn" 
      });
    }

    res.json({ 
      success: true, 
      voucher: {
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        value: voucher.value,
        type: voucher.type
      }
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi validate voucher" });
  }
};

// API để validate discount code cho service booking
module.exports.validateDiscount = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: "Thiếu mã giảm giá" });
    }

    const currentDate = new Date();
    const currentTime = currentDate.toTimeString().slice(0, 5);
    const currentDateStr = currentDate.toISOString().slice(0, 10);
    
    const discount = await Discount.findOne({
      code: code,
      deleted: false,
      status: "active",
      $or: [
        { timeSlots: { $exists: false } },
        {
          timeSlots: {
            $elemMatch: {
              date: currentDateStr,
              startTime: { $lte: currentTime },
              endTime: { $gte: currentTime }
            }
          }
        }
      ]
    });

    if (!discount) {
      return res.json({ 
        success: false, 
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn" 
      });
    }

    res.json({ 
      success: true, 
      discount: {
        _id: discount._id,
        code: discount.code,
        name: discount.name,
        description: discount.description,
        value: discount.value,
        type: discount.type
      }
    });
  } catch (error) {
    console.error("Validate discount error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi validate mã giảm giá" });
  }
};
