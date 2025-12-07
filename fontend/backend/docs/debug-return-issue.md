# Hướng dẫn Debug vấn đề hoàn hàng

## Vấn đề hiện tại
Frontend gửi data nhưng backend không cập nhật được đơn hàng.

## Các bước debug

### 1. Kiểm tra Frontend gửi data gì
Mở Developer Tools (F12) → Network tab → Gửi yêu cầu hoàn hàng → Xem request payload:

**Expected format:**
```json
{
  "order_id": "68cbde5dc3972946bc997e9c",
  "return_reason": "Sản phẩm bị hỏng trong quá trình vận chuyển", 
  "return_description": "sdsds",
  "return_images": []
}
```

### 2. Kiểm tra Backend nhận data
Trong console server, bạn sẽ thấy log:
```
Return request data: { order_id: '...', return_reason: '...', return_description: '...', return_images: [] }
```

### 3. Kiểm tra Database
Sau khi gửi yêu cầu, kiểm tra MongoDB:
```javascript
// Trong MongoDB shell hoặc MongoDB Compass
db.orders.findOne({_id: ObjectId("68cbde5dc3972946bc997e9c")})

// Kiểm tra trường return_request
db.orders.findOne({_id: ObjectId("68cbde5dc3972946bc997e9c")}, {return_request: 1})
```

### 4. Kiểm tra API endpoint
Test trực tiếp API:
```bash
curl -X POST http://localhost:8080/api/return/orders/request-return \
  -H "Content-Type: application/json" \
  -H "Cookie: tokenUser=your_token" \
  -d '{
    "order_id": "68cbde5dc3972946bc997e9c",
    "return_reason": "Test reason",
    "return_description": "Test description",
    "return_images": []
  }'
```

## Các lỗi có thể gặp

### 1. Lỗi Authentication
```
"Vui lòng đăng nhập" hoặc "Token không hợp lệ"
```
**Giải pháp:** Kiểm tra cookie `tokenUser` có tồn tại và hợp lệ không.

### 2. Lỗi Order không tồn tại
```
"Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập"
```
**Giải pháp:** Kiểm tra order_id có đúng không và user có quyền truy cập đơn hàng đó không.

### 3. Lỗi đã có yêu cầu hoàn hàng
```
"Đơn hàng này đã có yêu cầu hoàn hàng"
```
**Giải pháp:** Kiểm tra đơn hàng đã có `return_request` chưa.

### 4. Lỗi trạng thái đơn hàng
```
"Chỉ có thể yêu cầu hoàn hàng với đơn hàng đã hoàn thành hoặc đã giao"
```
**Giải pháp:** Kiểm tra trạng thái đơn hàng phải là `completed` hoặc `shipped`.

## Debug steps

### Step 1: Kiểm tra Frontend
1. Mở DevTools → Network
2. Gửi yêu cầu hoàn hàng
3. Xem request payload có đúng format không

### Step 2: Kiểm tra Backend logs
1. Xem console server có log "Return request data:" không
2. Xem có log "Order updated with return request:" không
3. Kiểm tra có lỗi gì trong console không

### Step 3: Kiểm tra Database
1. Kết nối MongoDB
2. Tìm đơn hàng theo ID
3. Kiểm tra trường `return_request` có được cập nhật không

### Step 4: Test API trực tiếp
1. Sử dụng Postman hoặc curl
2. Gửi request với đúng format
3. Kiểm tra response

## Expected Results

### Khi thành công:
```json
{
  "success": true,
  "message": "Yêu cầu hoàn hàng đã được gửi thành công",
  "return_request": {
    "status": "pending",
    "reason": "Sản phẩm bị hỏng trong quá trình vận chuyển",
    "description": "sdsds",
    "images": [],
    "requested_at": "2024-01-01T00:00:00.000Z",
    "requested_by": "user_id_here"
  }
}
```

### Database sẽ có:
```javascript
{
  "_id": "68cbde5dc3972946bc997e9c",
  "return_request": {
    "status": "pending",
    "reason": "Sản phẩm bị hỏng trong quá trình vận chuyển",
    "description": "sdsds",
    "images": [],
    "requested_at": "2024-01-01T00:00:00.000Z",
    "requested_by": "user_id_here"
  }
}
```

## Troubleshooting

Nếu vẫn không hoạt động:

1. **Kiểm tra routes:** Đảm bảo `/api/return` routes đã được thêm vào server.js
2. **Kiểm tra middleware:** Đảm bảo authentication middleware hoạt động đúng
3. **Kiểm tra database connection:** Đảm bảo MongoDB kết nối thành công
4. **Kiểm tra model:** Đảm bảo OrderModel có trường `return_request`
5. **Restart server:** Thử restart server để đảm bảo code mới được load
