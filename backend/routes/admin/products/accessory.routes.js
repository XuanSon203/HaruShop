const express = require('express');
const routes = express.Router();
const multer = require('multer');
const path = require('path');
const accessoriesController = require('../../../controller/admin/AccessoriesController');

// Cấu hình nơi lưu ảnh (tạm dùng thư mục foods cho đồng nhất hạ tầng hiện tại)
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/products/accessory');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	}
});

const upload = multer({ storage: storage });


// Lấy danh sách phụ kiện
routes.get('/', accessoriesController.index);

// Thêm phụ kiện với upload ảnh đại diện và ảnh phụ
routes.post(
	'/add',
	upload.fields([
		{ name: 'thumbnail', maxCount: 1 },
		{ name: 'images', maxCount: 10 }
	]),
	accessoriesController.addAccessory
);

// Đổi trạng thái
routes.put('/changeStatus/:id/:status', accessoriesController.changeStatus);

// Xóa mềm
routes.delete('/deleted/:id', accessoriesController.deleted);

// Sửa phụ kiện (có thể upload ảnh mới)
routes.put(
	'/edit/:id',
	upload.fields([
		{ name: 'thumbnail', maxCount: 1 },
		{ name: 'images', maxCount: 10 }
	]),
	accessoriesController.editAccessory
);

// Danh sách đã xóa
routes.get('/deleted', accessoriesController.listAccessoryDeleted);

// Khôi phục
routes.put('/restore/:id', accessoriesController.restoreAccessory);

// Xóa vĩnh viễn
routes.delete('/force/:id', accessoriesController.forceAccessory);

// Voucher management routes
routes.get('/vouchers', accessoriesController.getVouchers);
routes.put('/:id/voucher', accessoriesController.assignVoucher);
routes.delete('/:id/voucher', accessoriesController.removeVoucher);

module.exports = routes;
