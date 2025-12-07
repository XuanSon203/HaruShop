const Discount = require("../../model/DiscountModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

// Helper function để kiểm tra xem discount có còn trong thời gian áp dụng không
const isDiscountExpired = (timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) {
    return false; // Nếu không có timeSlots, coi như không hết hạn
  }

  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM

  // Kiểm tra xem có timeSlot nào còn trong thời gian áp dụng không
  const hasActiveTimeSlot = timeSlots.some(slot => {
    if (!slot.date || !slot.startTime || !slot.endTime) return false;

    const slotDate = slot.date; // Đã là string format YYYY-MM-DD
    const slotStartTime = slot.startTime; // String format HH:MM
    const slotEndTime = slot.endTime; // String format HH:MM

    // So sánh ngày
    if (slotDate > currentDateStr) {
      // Ngày trong tương lai - còn hiệu lực
      return true;
    } else if (slotDate === currentDateStr) {
      // Cùng ngày - kiểm tra giờ
      // TimeSlot còn hiệu lực nếu: startTime <= currentTime <= endTime
      if (slotStartTime <= currentTimeStr && slotEndTime >= currentTimeStr) {
        // Đang trong khung giờ áp dụng - còn hiệu lực
        return true;
      }
    }
    // Ngày đã qua hoặc cùng ngày nhưng đã hết giờ
    return false;
  });

  // Nếu không có timeSlot nào còn hiệu lực, discount đã hết hạn
  return !hasActiveTimeSlot;
};

// Helper function để tự động cập nhật status của discount dựa trên thời gian
const autoUpdateDiscountStatus = async (discount) => {
  if (!discount || discount.status === 'inactive') {
    return discount; // Không cần cập nhật nếu đã inactive
  }

  const isExpired = isDiscountExpired(discount.timeSlots);
  
  if (isExpired && discount.status === 'active') {
    // Tự động cập nhật thành inactive
    discount.status = 'inactive';
    discount.updatedBy.push({
      account_id: null, // Tự động cập nhật, không có account
      updatedAt: new Date(),
    });
    await discount.save();
    
    // Tự động xóa discount_id khỏi tất cả sản phẩm đang sử dụng discount này
    try {
      const discountId = discount._id;
      
      // Xóa discount_id khỏi Food products
      const foodUpdateResult = await Food.updateMany(
        { discount_id: discountId, deleted: false },
        { 
          $unset: { discount_id: "" },
          $push: {
            updatedBy: {
              account_id: null,
              updatedAt: new Date()
            }
          }
        }
      );
      
      // Xóa discount_id khỏi Accessory products
      const accessoryUpdateResult = await Accessory.updateMany(
        { discount_id: discountId, deleted: false },
        { 
          $unset: { discount_id: "" },
          $push: {
            updatedBy: {
              account_id: null,
              updatedAt: new Date()
            }
          }
        }
      );
      
    } catch (error) {
      console.error(`Lỗi khi xóa discount_id khỏi sản phẩm:`, error);
    }
  }

  return discount;
};

module.exports.index = async (req, res) => {
  try {
    let find = { deleted: false };
    const discounts = await Discount.find(find);
    const countDiscountDeleted = await Discount.countDocuments({ deleted: true });
    
    // Tự động cập nhật status cho các discount đã hết thời gian
    const updatedDiscounts = await Promise.all(
      discounts.map(discount => autoUpdateDiscountStatus(discount))
    );
    
    // Populate user information
    const discountsWithUserInfo = await populateUserInfoArray(updatedDiscounts);
    
    res.json({ discounts: discountsWithUserInfo, countDiscountDeleted });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.add = async (req, res) => {
  try {
    // Tạo mã giảm giá ngẫu nhiên: HRD + 6 ký tự số
    const code = "HRD" + Math.floor(100000 + Math.random() * 900000);
    req.body.code = code;
    
    const discount = new Discount({ 
      ...req.body,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });
    
    await discount.save();
    
    // Populate user information before returning
    const discountWithUserInfo = await populateUserInfo(discount);
    
    res.status(201).json({
      message: "Tạo discount thành công",
      data: discountWithUserInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo discount" });
  }
};
module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params; // Lấy id từ URL
    const { name, type, value, description, timeSlots } = req.body;

    if (!id) return res.status(400).json({ message: "Thiếu id" });

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    const previousStatus = discount.status;
    const previousTimeSlots = discount.timeSlots;

    // Update fields
    discount.name = name || discount.name;
    discount.type = type || discount.type;
    discount.value = value || discount.value;
    discount.description = description || discount.description;
    discount.timeSlots = timeSlots || discount.timeSlots;
    
    // Tự động cập nhật status dựa trên thời gian mới
    if (discount.timeSlots && discount.timeSlots.length > 0) {
      const isExpired = isDiscountExpired(discount.timeSlots);
      
      if (isExpired && discount.status === 'active') {
        // Thời gian mới đã qua và đang active → chuyển sang inactive
        discount.status = 'inactive';
        
        // Tự động xóa discount_id khỏi sản phẩm
        try {
          const discountId = discount._id;
          const foodUpdateResult = await Food.updateMany(
            { discount_id: discountId, deleted: false },
            { 
              $unset: { discount_id: "" },
              $push: {
                updatedBy: {
                  account_id: req.account?._id || null,
                  updatedAt: new Date()
                }
              }
            }
          );
          
          const accessoryUpdateResult = await Accessory.updateMany(
            { discount_id: discountId, deleted: false },
            { 
              $unset: { discount_id: "" },
              $push: {
                updatedBy: {
                  account_id: req.account?._id || null,
                  updatedAt: new Date()
                }
              }
            }
          );
          
        } catch (error) {
          console.error(`Lỗi khi xóa discount_id khỏi sản phẩm:`, error);
        }
      } else if (!isExpired && discount.status === 'inactive') {
        // Thời gian mới chưa qua và đang inactive → chuyển sang active
        discount.status = 'active';
      }
    }
    
    // Add updatedBy tracking
    discount.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await discount.save();

    // Populate user information before returning
    const discountWithUserInfo = await populateUserInfo(discount);

    res.json({ message: "Cập nhật thành công", discount: discountWithUserInfo });
  } catch (err) {
    console.error("Lỗi khi cập nhật:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports.deleted = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Thiếu id" });

  try {
    const result = await Discount.findOneAndUpdate(
      { _id: id },
      {
        deleted: true,
        deletedAt: Date.now(),
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    // Populate user information before returning
    const discountWithUserInfo = await populateUserInfo(result);

    res.json({ message: "Đã đánh dấu xóa thành công", discount: discountWithUserInfo });
  } catch (error) {
    console.error("Lỗi khi xóa:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports.changeStatus = async (req, res) => {
  try {
    const discountId = req.params.id;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const discount = await Discount.findOne({ _id: discountId });
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy discount" });
    }

    const previousStatus = discount.status;
    discount.status = status;
    
    // Add updatedBy tracking
    discount.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });
    
    await discount.save();

    // Nếu chuyển từ active sang inactive, tự động xóa discount_id khỏi sản phẩm
    if (previousStatus === 'active' && status === 'inactive') {
      try {
        // Xóa discount_id khỏi Food products
        const foodUpdateResult = await Food.updateMany(
          { discount_id: discountId, deleted: false },
          { 
            $unset: { discount_id: "" },
            $push: {
              updatedBy: {
                account_id: req.account?._id || null,
                updatedAt: new Date()
              }
            }
          }
        );
        
        // Xóa discount_id khỏi Accessory products
        const accessoryUpdateResult = await Accessory.updateMany(
          { discount_id: discountId, deleted: false },
          { 
            $unset: { discount_id: "" },
            $push: {
              updatedBy: {
                account_id: req.account?._id || null,
                updatedAt: new Date()
              }
            }
          }
        );
        
      } catch (error) {
        console.error(`Lỗi khi xóa discount_id khỏi sản phẩm:`, error);
        // Không throw error để không làm gián đoạn response
      }
    }

    // Populate user information before returning
    const discountWithUserInfo = await populateUserInfo(discount);

    res.json({ message: "Cập nhật trạng thái thành công", discount: discountWithUserInfo });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports.listDiscountDeleted = async (req, res) => {
  try {
    const deletedDiscounts = await Discount.find({ deleted: true }).sort({
      deletedAt: -1,
    });

    // Populate user information for deleted discounts
    const discountsWithUserInfo = await populateUserInfoArray(deletedDiscounts);

    res.json(discountsWithUserInfo);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách discount đã xóa:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
module.exports.delete = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Thiếu id" });

  try {
    const result = await Discount.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy discount" });
    }

    res.json({ message: "Đã xóa discount thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa discount:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Khôi phục discount đã xóa (deleted = false, xóa deletedAt)
module.exports.restore = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Thiếu id" });

  try {
    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy discount" });
    }

    discount.deleted = false;
    discount.deletedAt = undefined;
    
    // Add updatedBy tracking for restore action
    discount.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await discount.save();

    // Populate user information before returning
    const discountWithUserInfo = await populateUserInfo(discount);

    res.json({ message: "Đã khôi phục discount thành công", discount: discountWithUserInfo });
  } catch (err) {
    console.error("Lỗi khi khôi phục discount:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
