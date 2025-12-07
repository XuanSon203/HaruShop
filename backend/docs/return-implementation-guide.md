# Hướng dẫn triển khai chức năng hoàn hàng/hoàn tiền

## Tổng quan
Chức năng hoàn hàng/hoàn tiền đã được triển khai hoàn chỉnh với các tính năng:
- Khách hàng có thể yêu cầu hoàn hàng/hoàn tiền
- Nút hoàn hàng sẽ ẩn đi sau khi gửi yêu cầu thành công
- Không hiện lại dù có reload trang
- Admin có thể xử lý yêu cầu hoàn hàng

## Các file đã được cập nhật

### Backend Models
1. **OrderModel.js** - Thêm trường `return_request`
2. **OrderServices.js** - Thêm trường `return_request`

### Backend Controllers
1. **OrderController.js** - Thêm các function:
   - `requestReturn()` - Yêu cầu hoàn hàng
   - `getReturnRequests()` - Lấy danh sách yêu cầu hoàn hàng của user
   - `processReturnRequest()` - Admin xử lý yêu cầu hoàn hàng
   - `getReturnRequestsForAdmin()` - Lấy danh sách yêu cầu hoàn hàng cho admin

2. **OrderSevicesController.js** - Thêm các function:
   - `requestReturn()` - Yêu cầu hoàn tiền dịch vụ
   - `getReturnRequests()` - Lấy danh sách yêu cầu hoàn tiền của user
   - `processServiceReturnRequest()` - Admin xử lý yêu cầu hoàn tiền
   - `getServiceReturnRequestsForAdmin()` - Lấy danh sách yêu cầu hoàn tiền cho admin

### Backend Routes
1. **returnRoutes.js** - Routes mới cho API hoàn hàng
2. **server.js** - Thêm `/api/return` routes

### Frontend
1. **Orders.jsx** - Cập nhật logic ẩn nút hoàn hàng
2. **ServiceOrders.jsx** - Cập nhật logic ẩn nút hoàn tiền

## API Endpoints

### Đơn hàng sản phẩm
- `POST /api/return/orders/request-return` - Yêu cầu hoàn hàng
- `GET /api/return/orders/return-requests` - Lấy danh sách yêu cầu hoàn hàng của user
- `POST /api/return/orders/process-return` - Admin xử lý yêu cầu hoàn hàng
- `GET /api/return/orders/return-requests-admin` - Lấy danh sách yêu cầu hoàn hàng cho admin

### Đơn dịch vụ
- `POST /api/return/orderservices/request-return` - Yêu cầu hoàn tiền
- `GET /api/return/orderservices/return-requests` - Lấy danh sách yêu cầu hoàn tiền của user
- `POST /api/return/orderservices/process-return` - Admin xử lý yêu cầu hoàn tiền
- `GET /api/return/orderservices/return-requests-admin` - Lấy danh sách yêu cầu hoàn tiền cho admin

## Logic hiển thị nút hoàn hàng

### Điều kiện hiển thị nút:
1. Đơn hàng có trạng thái `completed` hoặc `shipped`
2. Chưa có yêu cầu hoàn hàng (`return_request` không tồn tại)
3. User đã đăng nhập và là chủ sở hữu đơn hàng

### Code kiểm tra trong frontend:
```javascript
// Trong Orders.jsx
{(order.status === "completed" || order.status === "shipped") && !order.return_request && (
  <Button onClick={() => handleOpenReturnModal(order)}>
    🔄 Hoàn hàng
  </Button>
)}

// Trong ServiceOrders.jsx  
{order.status === 'Completed' && !order.return_request && (
  <Button onClick={() => handleOpenReturnModal(order)}>
    Hoàn tiền
  </Button>
)}
```

## Logic ẩn nút sau khi gửi yêu cầu

### Cập nhật state ngay lập tức:
```javascript
// Trong handleReturnRequest
if (res.ok && data.success) {
  // Cập nhật trạng thái đơn hàng ngay lập tức để ẩn nút
  setOrders(prevOrders => 
    prevOrders.map(order => 
      order._id === returnOrder._id 
        ? { ...order, return_request: data.return_request }
        : order
    )
  );
}
```

## Trạng thái yêu cầu hoàn hàng

- `pending`: Đang chờ xử lý
- `approved`: Đã được chấp nhận  
- `rejected`: Đã bị từ chối
- `completed`: Đã hoàn thành

## Cách test

1. **Tạo đơn hàng** với trạng thái `completed` hoặc `shipped`
2. **Kiểm tra nút hoàn hàng** hiển thị
3. **Gửi yêu cầu hoàn hàng** với lý do
4. **Kiểm tra nút ẩn đi** và hiển thị badge trạng thái
5. **Reload trang** - nút vẫn ẩn
6. **Admin xử lý** yêu cầu hoàn hàng

## Lưu ý quan trọng

1. **Bảo mật**: Chỉ user sở hữu đơn hàng mới có thể tạo yêu cầu hoàn hàng
2. **Trạng thái**: Nút hoàn hàng chỉ hiển thị với đơn hàng đã hoàn thành/giao
3. **Một lần**: Mỗi đơn hàng chỉ có thể tạo một yêu cầu hoàn hàng
4. **Admin**: Chỉ admin mới có thể xử lý (approve/reject) các yêu cầu
5. **Persistence**: Trạng thái được lưu trong database, không mất khi reload

## Troubleshooting

### Nút hoàn hàng vẫn hiển thị sau khi gửi yêu cầu:
- Kiểm tra API response có chứa `return_request` không
- Kiểm tra logic cập nhật state trong frontend
- Kiểm tra console log để debug

### API không hoạt động:
- Kiểm tra routes đã được thêm vào server.js
- Kiểm tra URL endpoint trong frontend
- Kiểm tra authentication middleware

### Database không cập nhật:
- Kiểm tra model schema đã có trường `return_request`
- Kiểm tra controller logic
- Kiểm tra database connection



