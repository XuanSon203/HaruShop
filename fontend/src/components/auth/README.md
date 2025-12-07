# Hệ thống Bảo vệ Quyền Truy cập

## Tổng quan

Hệ thống này cung cấp các component và hook để bảo vệ các trang và chức năng dựa trên quyền truy cập của người dùng.

## Các Component chính

### 1. AuthGuard
Component bảo vệ toàn bộ layout admin, kiểm tra:
- Token hợp lệ
- Quyền truy cập cơ bản
- Chuyển hướng về login nếu chưa đăng nhập
- Chuyển hướng về trang unauthorized nếu không có quyền

### 2. ProtectedRoute
Component bảo vệ các trang cụ thể với các tùy chọn:
- `requiredPermissions`: Mảng các quyền cần thiết
- `requireAdmin`: Yêu cầu quyền admin
- `fallback`: Component hiển thị khi không có quyền

### 3. PermissionDenied
Component hiển thị khi người dùng không có quyền truy cập.

## Hook useAuth

Cung cấp các chức năng:
- `user`: Thông tin người dùng hiện tại
- `permissions`: Danh sách quyền của người dùng
- `isAdmin`: Kiểm tra có phải admin không
- `hasPermission(permission)`: Kiểm tra quyền cụ thể
- `hasAnyPermission(permissions)`: Kiểm tra có bất kỳ quyền nào trong danh sách
- `requireAuth()`: Yêu cầu đăng nhập
- `requirePermission(permission)`: Yêu cầu quyền cụ thể
- `logout()`: Đăng xuất

## Cách sử dụng

### 1. Bảo vệ toàn bộ layout
```jsx
// LayoutAdmin.jsx
<AuthGuard>
  <PermissionsProvider>
    {/* Nội dung admin */}
  </PermissionsProvider>
</AuthGuard>
```

### 2. Bảo vệ trang cụ thể
```jsx
// Trang yêu cầu quyền admin
<ProtectedRoute requireAdmin={true}>
  <AdminOnlyPage />
</ProtectedRoute>

// Trang yêu cầu quyền cụ thể
<ProtectedRoute 
  requiredPermissions={['manage_orders', 'view_orders']}
  fallback={<PermissionDenied />}
>
  <OrdersPage />
</ProtectedRoute>
```

### 3. Sử dụng trong component
```jsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, hasPermission, requirePermission } = useAuth();

  const handleDelete = () => {
    if (requirePermission('delete_orders')) {
      // Thực hiện xóa
    }
  };

  return (
    <div>
      {hasPermission('edit_orders') && (
        <Button>Chỉnh sửa</Button>
      )}
    </div>
  );
};
```

### 4. Kiểm tra quyền trong API calls
```jsx
const fetchData = async () => {
  if (!requirePermission('view_orders')) return;
  
  // Gọi API
};
```

## Các trang lỗi

### 1. NotFound (404)
- Hiển thị khi URL không tồn tại
- Có nút điều hướng về trang chủ

### 2. Unauthorized (403)
- Hiển thị khi không có quyền truy cập
- Có nút đăng nhập lại và quay lại

## API Endpoints

### GET /admin/auth/verify
Kiểm tra token và trả về thông tin user + quyền:
```json
{
  "success": true,
  "account": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "status": "active"
  },
  "role": {
    "id": "...",
    "roleName": "admin",
    "permissions": ["manage_users", "manage_orders", ...]
  }
}
```

## Lưu ý

1. **Token Management**: Token được lưu trong cookie và tự động gửi kèm request
2. **Auto Redirect**: Tự động chuyển hướng về login khi token hết hạn
3. **Permission Caching**: Thông tin quyền được cache trong context
4. **Error Handling**: Xử lý lỗi và hiển thị thông báo phù hợp
5. **Security**: Tất cả kiểm tra quyền đều được thực hiện ở cả frontend và backend

