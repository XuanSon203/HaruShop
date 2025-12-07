const Accessory = require('../../model/AccessoriesModel');
const Discount = require('../../model/DiscountModel');
const { populateUserInfo, populateUserInfoArray } = require('../../helpers/populateUserInfo');

// Helper function để parse boolean từ string
const parseBoolean = (value) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const lower = value.toLowerCase().trim();
		if (lower === 'true' || lower === '1') return true;
		if (lower === 'false' || lower === '0' || lower === '') return false;
	}
	if (typeof value === 'number') return value !== 0;
	return undefined;
};

module.exports.index = async (req, res) => {
	try {
	
		let find = { deleted: false,  };
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;

		const countAccessoryDeleted = await Accessory.countDocuments({ deleted: true });
		const totalAccessories = await Accessory.countDocuments(find);

		const skip = (page - 1) * limit;
    const accessories = await Accessory.find(find)
      .populate('discount_id', 'name code value type')
      .populate('category_id', 'name')
      .populate('shipping_id', 'name price')
			.skip(skip)
			.limit(limit);

		// Populate user information
		const accessoriesWithUserInfo = await populateUserInfoArray(accessories);

		return res.status(200).json({
			success: true,
			message: 'Lấy danh sách phụ kiện thành công!',
			countAccessoryDeleted,
			accessories: accessoriesWithUserInfo,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalAccessories / limit),
				totalAccessories,
				limit,
			},
		});
	} catch (error) {
		console.error('Lỗi khi lấy danh sách phụ kiện:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi lấy danh sách phụ kiện!',
			error: error.message,
		});
	}
};

module.exports.addAccessory = async (req, res) => {
	try {
		// Debug incoming body fields
		const existing = await Accessory.findOne({ name: req.body.name ,deleted:false,status:"active"});
		if (existing) {
			return res.status(400).json({
				success: false,
				message: 'Tên phụ kiện đã tồn tại, vui lòng chọn tên khác!',
			});
		}

		const thumbnail = req.files?.thumbnail ? req.files.thumbnail[0].filename : null;
		const images = req.files?.images ? req.files.images.map((file) => file.filename) : [];

		// Xử lý is_featured và isNew
		const parsedIsFeatured = parseBoolean(req.body.is_featured);
		const parsedIsNew = parseBoolean(req.body.isNew);
		
		// Đảm bảo chỉ chọn một trong hai: is_featured hoặc isNew
		const finalIsFeatured = parsedIsFeatured === true ? true : false;
		const finalIsNew = parsedIsNew === true && !finalIsFeatured ? true : false;
		
    const newAccessory = new Accessory({
			...req.body,
			price: Number(req.body.price),
			quantity: Number(req.body.quantity),
			rating: Number(req.body.rating) || 0,
			category_id: req.body.category_id || null,
      shipping_id: req.body.shipping_id || null,
			is_featured: finalIsFeatured,
			isNew: finalIsNew,
			thumbnail,
			images,
			createdBy: {
				account_id: req.account?._id || null,
				createdAt: new Date(),
			},
		});

		await newAccessory.save();

		return res.status(201).json({
			success: true,
			message: 'Thêm phụ kiện thành công!',
			accessory: newAccessory,
		});
	} catch (error) {
		console.error('Lỗi khi thêm phụ kiện:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi thêm phụ kiện!',
			error: error.message,
		});
	}
};

module.exports.editAccessory = async (req, res) => {
	try {
	
		const { id } = req.params;
		const existing = await Accessory.findOne({ name: req.body.name, _id: { $ne: id },deleted:false, status:"active" });
		if (existing) {
			return res.status(400).json({
				success: false,
				message: 'Tên phụ kiện đã tồn tại, vui lòng chọn tên khác!',
			});
		}

		const accessory = await Accessory.findOne({ _id: id, deleted: false });
		if (!accessory) {
			return res.status(404).json({ success: false, message: 'Phụ kiện không tồn tại' });
		}

		accessory.name = req.body.name || accessory.name;
		accessory.price = req.body.price ? Number(req.body.price) : accessory.price;
		accessory.quantity = req.body.quantity ? Number(req.body.quantity) : accessory.quantity;
		accessory.rating = req.body.rating ? Number(req.body.rating) : accessory.rating;
    // Ensure ids are primitives (avoid object payloads)
    if (typeof req.body.category_id !== 'undefined') {
      accessory.category_id = req.body.category_id || null;
    }
    if (typeof req.body.shipping_id !== 'undefined') {
      accessory.shipping_id = req.body.shipping_id || null;
    }
		accessory.discount_id = req.body.discount_id !== undefined ? req.body.discount_id : accessory.discount_id;
		accessory.status = req.body.status || accessory.status;
		accessory.material = req.body.material || accessory.material;
		accessory.size = req.body.size || accessory.size;
		accessory.color = req.body.color || accessory.color;
		accessory.brand = req.body.brand || accessory.brand;
		
		// Xử lý is_featured và isNew
		const parsedIsFeatured = parseBoolean(req.body.is_featured);
		const parsedIsNew = parseBoolean(req.body.isNew);
		
		// Đảm bảo chỉ chọn một trong hai: is_featured hoặc isNew
		if (typeof parsedIsFeatured !== 'undefined' || typeof parsedIsNew !== 'undefined') {
			if (parsedIsFeatured === true) {
				accessory.is_featured = true;
				accessory.isNew = false; // Tự động bỏ chọn isNew nếu chọn is_featured
			} else if (parsedIsNew === true) {
				accessory.isNew = true;
				accessory.is_featured = false; // Tự động bỏ chọn is_featured nếu chọn isNew
			} else {
				// Nếu cả hai đều false, giữ nguyên giá trị hiện tại
				if (typeof parsedIsFeatured !== 'undefined') {
					accessory.is_featured = false;
				}
				if (typeof parsedIsNew !== 'undefined') {
					accessory.isNew = false;
				}
			}
		}
		
		accessory.warranty = req.body.warranty || accessory.warranty;
		accessory.description = req.body.description|| accessory.description;
		if (req.files?.thumbnail) {
			accessory.thumbnail = req.files.thumbnail[0].filename;
		}
		if (req.files?.images) {
			accessory.images = req.files.images.map((file) => file.filename);
		}

		// Thêm tracking cho việc cập nhật
		accessory.updatedBy.push({
			account_id: req.account?._id || null,
			updatedAt: new Date(),
		});

		await accessory.save();

		return res.status(200).json({
			success: true,
			message: 'Cập nhật phụ kiện thành công!',
			accessory,
		});
	} catch (error) {
		console.error('Lỗi khi cập nhật phụ kiện:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi cập nhật phụ kiện!',
			error: error.message,
		});
	}
};

module.exports.changeStatus = async (req, res) => {
	try {
	
		const { id, status } = req.params;
		const accessory = await Accessory.findOne({ _id: id, deleted: false });
		if (!accessory) {
			return res.status(404).json({ error: 'Không tìm thấy phụ kiện' });
		}

		// Cập nhật status và thêm tracking
		accessory.status = status;
		accessory.updatedBy.push({
			account_id: req.account?._id || null,
			updatedAt: new Date(),
		});

		await accessory.save();

		res.json(accessory);
	} catch (err) {
		console.error('Lỗi changeStatus:', err);
		res.status(500).json({ error: 'Lỗi server' });
	}
};

module.exports.deleted = async (req, res) => {
	try {
	
		const { id } = req.params;
		const accessory = await Accessory.findOneAndUpdate(
			{ _id: id, deleted: false }, 
			{ 
				deleted: true,
				deletedBy: {
					account_id: req.account?._id || null,
					deletedAt: new Date(),
				}
			}, 
			{ new: true }
		);
		if (!accessory) {
			return res.status(404).json({ message: 'Không tìm thấy phụ kiện' });
		}
		return res.json({ message: 'Xóa mềm phụ kiện thành công', data: accessory });
	} catch (error) {
		return res.status(500).json({ message: 'Lỗi server', error });
	}
};

module.exports.listAccessoryDeleted = async (req, res) => {
	try {
	
		const accessories = await Accessory.find({ deleted: true });
		
		// Populate user information
		const accessoriesWithUserInfo = await populateUserInfoArray(accessories);
		
		return res.status(200).json({
			success: true,
			message: 'Danh sách phụ kiện đã xóa',
			accessories: accessoriesWithUserInfo,
			count: accessories.length,
		});
	} catch (error) {
		console.error('Lỗi khi lấy danh sách phụ kiện đã xóa:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi lấy danh sách phụ kiện đã xóa',
			error: error.message,
		});
	}
};

module.exports.restoreAccessory = async (req, res) => {
	try {
		
		const { id } = req.params;
		const accessory = await Accessory.findOne({ _id: id, deleted: true });
		if (!accessory) {
			return res.status(404).json({ success: false, message: 'Không tìm thấy phụ kiện' });
		}
		if (!accessory.deleted) {
			return res.status(400).json({ success: false, message: 'Phụ kiện chưa bị xóa' });
		}
		
		// Khôi phục và thêm tracking
		accessory.deleted = false;
		accessory.updatedBy.push({
			account_id: req.account?._id || null,
			updatedAt: new Date(),
		});
		
		await accessory.save();
		return res.status(200).json({ success: true, message: 'Khôi phục phụ kiện thành công', accessory });
	} catch (error) {
		console.error('Lỗi khi khôi phục phụ kiện:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi khôi phục phụ kiện',
			error: error.message,
		});
	}
};

module.exports.forceAccessory = async (req, res) => {
	try {
		const { id } = req.params;
		const accessory = await Accessory.findOne({ _id: id });
		if (!accessory) {
			return res.status(404).json({ success: false, message: 'Không tìm thấy phụ kiện' });
		}
		await Accessory.findOneAndDelete({ _id: id });
		return res.status(200).json({ success: true, message: 'Xóa phụ kiện vĩnh viễn thành công' });
	} catch (error) {
		console.error('Lỗi khi xóa phụ kiện vĩnh viễn:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi xóa phụ kiện vĩnh viễn',
			error: error.message,
		});
	}
};

// Voucher management endpoints
module.exports.getVouchers = async (req, res) => {
	try {
		const vouchers = await Discount.find({ 
			deleted: false, 
			status: 'active' 
		}).select('name code value type description timeSlots');
		
		return res.status(200).json({
			success: true,
			message: 'Lấy danh sách voucher thành công',
			vouchers
		});
	} catch (error) {
		console.error('Lỗi khi lấy danh sách voucher:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi lấy danh sách voucher',
			error: error.message,
		});
	}
};

module.exports.assignVoucher = async (req, res) => {
	try {
		const { id } = req.params;
		const { voucherId } = req.body;
		
		if (!voucherId) {
			return res.status(400).json({
				success: false,
				message: 'Vui lòng chọn voucher'
			});
		}
		
		// Kiểm tra phụ kiện tồn tại
		const accessory = await Accessory.findOne({ _id: id, deleted: false });
		if (!accessory) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy phụ kiện'
			});
		}
		
		// Kiểm tra voucher tồn tại và đang hoạt động
		const voucher = await Discount.findOne({ 
			_id: voucherId, 
			deleted: false, 
			status: 'active' 
		});
		if (!voucher) {
			return res.status(404).json({
				success: false,
				message: 'Voucher không tồn tại hoặc không hoạt động'
			});
		}
		
		// Cập nhật voucher cho phụ kiện
		accessory.discount_id = voucherId;
		accessory.updatedBy.push({
			account_id: req.account?._id || null,
			updatedAt: new Date(),
		});
		
		await accessory.save();
		
		// Populate voucher info để trả về
		const accessoryWithVoucher = await Accessory.findById(id)
			.populate('discount_id', 'name code value type')
			.populate('category_id', 'name');
		
		return res.status(200).json({
			success: true,
			message: 'Áp dụng voucher thành công',
			accessory: accessoryWithVoucher
		});
	} catch (error) {
		console.error('Lỗi khi áp dụng voucher:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi áp dụng voucher',
			error: error.message,
		});
	}
};

module.exports.removeVoucher = async (req, res) => {
	try {
		const { id } = req.params;
		
		// Kiểm tra phụ kiện tồn tại
		const accessory = await Accessory.findOne({ _id: id, deleted: false });
		if (!accessory) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy phụ kiện'
			});
		}
		
		// Gỡ voucher khỏi phụ kiện
		accessory.discount_id = null;
		accessory.updatedBy.push({
			account_id: req.account?._id || null,
			updatedAt: new Date(),
		});
		
		await accessory.save();
		
		return res.status(200).json({
			success: true,
			message: 'Gỡ voucher thành công',
			accessory
		});
	} catch (error) {
		console.error('Lỗi khi gỡ voucher:', error);
		return res.status(500).json({
			success: false,
			message: 'Có lỗi xảy ra khi gỡ voucher',
			error: error.message,
		});
	}
};
	