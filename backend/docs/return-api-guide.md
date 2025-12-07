# Hướng dẫn API Hoàn hàng/Hoàn tiền

## Tổng quan
API này cho phép khách hàng yêu cầu hoàn hàng/hoàn tiền và admin xử lý các yêu cầu này.

## Endpoints

### 1. Yêu cầu hoàn hàng (Đơn hàng sản phẩm)
**POST** `/api/return/orders/request-return`

**Body:**
```json
{
  "order_id": "order_id_here",
  "return_reason": "Lý do hoàn hàng",
  "return_description": "Mô tả chi tiết",
  "return_images": ["url1", "url2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yêu cầu hoàn hàng đã được gửi thành công",
  "return_request": {
    "status": "pending",
    "reason": "Lý do hoàn hàng",
    "requested_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Lấy danh sách yêu cầu hoàn hàng của user
**GET** `/api/return/orders/return-requests?page=1&limit=10&status=pending`

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalOrders": 50
}
```

### 3. Admin xử lý yêu cầu hoàn hàng
**POST** `/api/return/orders/process-return`

**Body:**
```json
{
  "order_id": "order_id_here",
  "action": "approved", // hoặc "rejected"
  "admin_note": "Ghi chú của admin"
}
```

### 4. Lấy danh sách yêu cầu hoàn hàng cho admin
**GET** `/api/return/orders/return-requests-admin?page=1&limit=10&status=pending`

## Logic hiển thị nút hoàn hàng

### Điều kiện hiển thị nút hoàn hàng:
1. Đơn hàng có trạng thái `completed` hoặc `shipped`
2. Chưa có yêu cầu hoàn hàng (`return_request` không tồn tại)
3. User đã đăng nhập và là chủ sở hữu đơn hàng

### Code JavaScript để kiểm tra:
```javascript
function shouldShowReturnButton(order) {
  // Kiểm tra trạng thái đơn hàng
  const validStatuses = ['completed', 'shipped'];
  if (!validStatuses.includes(order.status)) {
    return false;
  }
  
  // Kiểm tra đã có yêu cầu hoàn hàng chưa
  if (order.return_request && order.return_request.status) {
    return false;
  }
  
  return true;
}
```

### Code JavaScript để ẩn nút sau khi gửi yêu cầu:
```javascript
async function requestReturn(orderId, returnData) {
  try {
    const response = await fetch('/api/return/orders/request-return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        order_id: orderId,
        ...returnData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Ẩn nút hoàn hàng
      const returnButton = document.getElementById(`return-btn-${orderId}`);
      if (returnButton) {
        returnButton.style.display = 'none';
      }
      
      // Hoặc cập nhật trạng thái đơn hàng
      order.return_request = result.return_request;
    }
    
    return result;
  } catch (error) {
    console.error('Error requesting return:', error);
  }
}
```

## Trạng thái yêu cầu hoàn hàng

- `pending`: Đang chờ xử lý
- `approved`: Đã được chấp nhận
- `rejected`: Đã bị từ chối
- `completed`: Đã hoàn thành

## Lưu ý quan trọng

1. **Ẩn nút hoàn hàng**: Sau khi gửi yêu cầu thành công, nút hoàn hàng sẽ ẩn đi và không hiện lại dù có reload trang
2. **Kiểm tra trạng thái**: Luôn kiểm tra `return_request.status` để xác định trạng thái yêu cầu
3. **Bảo mật**: Chỉ cho phép user xem và tạo yêu cầu hoàn hàng cho đơn hàng của chính họ
4. **Admin**: Chỉ admin mới có thể xử lý (approve/reject) các yêu cầu hoàn hàng




