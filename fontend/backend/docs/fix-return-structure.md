# Hướng dẫn sửa cấu trúc return request

## Vấn đề hiện tại
Database đang có các trường return ở root level thay vì trong object `return_request`:
```javascript
{
  "_id": "68d3a0c2d60d302b7e61af81",
  "isReturned": false,
  "returnReason": "",
  "return_description": "",
  "return_reason": ""
  // Thiếu return_request object
}
```

## Cấu trúc đúng
Database nên có cấu trúc như này:
```javascript
{
  "_id": "68d3a0c2d60d302b7e61af81",
  "return_request": {
    "status": "pending",
    "reason": "Sản phẩm bị hỏng trong quá trình vận chuyển",
    "description": "Sản phẩm bị vỡ khi nhận hàng",
    "images": [],
    "requested_at": "2024-01-01T00:00:00.000Z",
    "requested_by": "user_id_here"
  }
}
```

## Các bước sửa

### Bước 1: Chạy script cleanup
```bash
cd backend
node scripts/cleanup-return-fields.js
```

Script này sẽ:
- Tìm tất cả orders có trường return cũ
- Tạo `return_request` object từ các trường cũ
- Xóa các trường cũ
- Lưu lại cấu trúc mới

### Bước 2: Kiểm tra database
Sau khi chạy script, kiểm tra MongoDB:
```javascript
// Tìm order đã được cleanup
db.orders.findOne({_id: ObjectId("68d3a0c2d60d302b7e61af81")})

// Kiểm tra return_request object
db.orders.findOne({_id: ObjectId("68d3a0c2d60d302b7e61af81")}, {return_request: 1})
```

### Bước 3: Test API
```bash
cd backend
node scripts/test-return-api.js
```

### Bước 4: Test từ frontend
1. Mở trang đơn hàng
2. Tìm đơn hàng có status "completed" hoặc "shipped"
3. Click nút "Hoàn hàng"
4. Điền thông tin và gửi
5. Kiểm tra database có cập nhật `return_request` không

## Expected Results

### Sau khi cleanup:
```javascript
{
  "_id": "68d3a0c2d60d302b7e61af81",
  "return_request": {
    "status": "pending",
    "reason": "Sản phẩm bị hỏng trong quá trình vận chuyển",
    "description": "Sản phẩm bị vỡ khi nhận hàng",
    "images": [],
    "requested_at": "2024-01-01T00:00:00.000Z",
    "requested_by": "68c15682f87490374370ee02"
  }
  // Không còn các trường cũ: isReturned, returnReason, etc.
}
```

### API Response:
```json
{
  "success": true,
  "message": "Yêu cầu hoàn hàng đã được gửi thành công",
  "return_request": {
    "status": "pending",
    "reason": "Sản phẩm bị hỏng trong quá trình vận chuyển",
    "description": "Sản phẩm bị vỡ khi nhận hàng",
    "images": [],
    "requested_at": "2024-01-01T00:00:00.000Z",
    "requested_by": "68c15682f87490374370ee02"
  }
}
```

## Troubleshooting

### Nếu script cleanup không hoạt động:
1. Kiểm tra kết nối MongoDB
2. Kiểm tra quyền truy cập database
3. Chạy script với quyền admin

### Nếu API vẫn không hoạt động:
1. Kiểm tra routes đã được thêm vào server.js
2. Restart server
3. Kiểm tra console logs
4. Test với Postman

### Nếu frontend vẫn không hiển thị đúng:
1. Kiểm tra logic hiển thị nút hoàn hàng
2. Kiểm tra state management
3. Hard refresh trang (Ctrl+F5)

## Lưu ý quan trọng

1. **Backup database** trước khi chạy script cleanup
2. **Test trên môi trường dev** trước khi deploy production
3. **Kiểm tra tất cả orders** có return request để đảm bảo không mất dữ liệu
4. **Monitor logs** trong quá trình cleanup
