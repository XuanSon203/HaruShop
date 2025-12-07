const PaymentMethod = require("../../model/PaymentMethodModel");

module.exports.index = async (req, res) => {
  try {
    const { page = 1, limit = 10, method, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    const query = { deleted: false };
    if (method) query.paymentMethod = method;
    if (status) query.status = status;

    const total = await PaymentMethod.countDocuments(query);
    const payments = await PaymentMethod.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    res.json({
      success: true,
      payments,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("List payments error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thanh toán",
    });
  }
};
module.exports.add = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !description || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu name, description hoặc status",
      });
    }

    const image = req.file ? req.file.filename : null; // ✅ Đọc file từ Multer


    const doc = new PaymentMethod({
      name,
      description,
      image,
      status: status === "true", // ✅ convert string to bool
    });

    await doc.save();

    return res.status(201).json({
      success: true,
      payment: doc,
    });
  } catch (error) {
    console.error("Add payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo thanh toán",
    });
  }
};
module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        success: false,
        message: "Thiếu ID",
      });

    let doc = await PaymentMethod.findById(id);
    if (!doc)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán",
      });

    const { name, description, status } = req.body;

    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;
    if (status !== undefined) doc.status = status === "true";

    if (req.file) {
      // ✅ Xóa ảnh cũ nếu có
      if (doc.image) {
        const oldPath = path.join(__dirname, "../uploads/payments", doc.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // ✅ Gán ảnh mới
      doc.image = req.file.filename;
    }

    await doc.save();

    res.json({
      success: true,
      payment: doc,
    });
  } catch (error) {
    console.error("Edit payment error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi sửa phương thức thanh toán",
    });
  }
};

module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Thiếu ID" });

    const doc = await PaymentMethod.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy phương thức thanh toán",
        });

    doc.deleted = true;
    doc.deletedAt = new Date();

    await doc.save();
    res.json({ success: true, message: "Đã xóa PaymentMethod (soft delete)" });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
