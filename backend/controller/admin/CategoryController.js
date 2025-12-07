const Category = require("../../model/CategoryModel");
const Account = require("../../model/AccountModel");
const { populateUserInfo, populateUserInfoArray } = require("../../helpers/populateUserInfo");

module.exports.index = async (req, res) => {
  try {
    const find = {
      deleted: false,
    };

    const countCategoryDeleted = await Category.countDocuments({
      deleted: true,
    });
    const categories = await Category.find(find);
    
    // Populate user information
    const categoriesWithUserInfo = await populateUserInfoArray(categories);
    
    res.status(200).json({
      categories: categoriesWithUserInfo,
      countCategoryDeleted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách Category",
      error: error.message,
    });
  }
};

module.exports.add = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    let sortOrder = req.body.sortOrder;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Kiểm tra tên đã tồn tại
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Tên category đã tồn tại" });
    }

    if (sortOrder === undefined || sortOrder === null || sortOrder === "") {
      const countProducts = await Category.countDocuments({});
      sortOrder = countProducts + 1;
    }
    sortOrder = Number(sortOrder);

    const category = new Category({
      name,
      description,
      parentId: parentId || null,
      sortOrder: Number(sortOrder),
      image: imageUrl,
      createdBy: {
        account_id: req.account?._id || null,
        createdAt: new Date(),
      },
    });

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, sortOrder, status } = req.body;
    const category = await Category.findOne({ _id: id });
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parentId = parentId || null;
    category.sortOrder =
      sortOrder !== undefined ? sortOrder : category.sortOrder;
    category.status = status || category.status;

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    // Add updatedBy tracking
    category.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await category.save();

    res.status(200).json({
      message: "Cập nhật danh mục thành công",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
module.exports.deleted = async (req, res) => {
  try {

    const { id } = req.params;

    // Cập nhật deleted = true
    const result = await Category.findOneAndUpdate(
      { _id: id },
      { 
        deleted: true,
        deletedBy: {
          account_id: req.account?._id || null,
          deletedAt: new Date(),
        }
      },
      { new: true } // trả về document sau khi update
    );

    if (!result) {
      return res.status(404).json({ message: "Category không tồn tại" });
    }

    return res.status(200).json({
      message: "Xóa Category thành công (đánh dấu deleted)",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi xóa Category",
      error: error.message,
    });
  }
};
module.exports.listCategoryDeleted = async (req, res) => {
  try {
   
    const listCategoryDeleted = await Category.find({
      deleted: true,
    });

    return res.status(200).json(listCategoryDeleted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách danh mục đã xóa",
      error: error.message,
    });
  }
};
module.exports.resetCategory = async (req, res) => {
  try {
   
    const { id } = req.params;

    // Kiểm tra category tồn tại
    const category = await Category.findOne({ _id: id });
    if (!category) {
      return res.status(404).json({ message: "Category không tồn tại" });
    }

    // Cập nhật trạng thái deleted về false
    category.deleted = false;
    await category.save();

    return res.status(200).json({
      message: "Khôi phục danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi khôi phục danh mục",
      error: error.message,
    });
  }
};
module.exports.deleteCategory = async (req, res) => {
  try {
   
    const { id } = req.params;
    const result = await Category.deleteOne({ _id: id});

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Category không tồn tại hoặc đã bị xóa" });
    }

    return res.status(200).json({
      message: "Xóa danh mục thành công (xóa vĩnh viễn)",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi xóa danh mục",
      error: error.message,
    });
  }
};
module.exports.changeStatus = async (req, res) => {
  try {
   
    const { id, status } = req.params;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }
    
    const category = await Category.findOne({ _id: id, deleted: false });
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Cập nhật status và thêm tracking
    category.status = status;
    category.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await category.save();

    res.status(200).json({ message: "Đổi trạng thái thành công", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
module.exports.changePosition = async (req, res) => {
  try {
  
    const id = req.params.id; // Lấy id từ params (ví dụ: /category/:id)
    const { sortOrder } = req.body; // Lấy sortOrder từ body của request

    // Kiểm tra nếu id hoặc sortOrder không được cung cấp
    if (!id || sortOrder === undefined) {
      return res.status(400).json({ message: "ID và sortOrder là bắt buộc" });
    }

    // Tìm category theo id
    const category = await Category.findOne({ _id: id, deleted: false });
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Cập nhật sortOrder và thêm tracking
    category.sortOrder = sortOrder;
    category.updatedBy.push({
      account_id: req.account?._id || null,
      updatedAt: new Date(),
    });

    await category.save();

    res.status(200).json({ message: "Cập nhật vị trí thành công", category });
  } catch (error) {
    console.error("Lỗi khi thay đổi vị trí:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
