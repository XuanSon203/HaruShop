import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PermissionDenied from '../../../components/auth/PermissionDenied';
import { useAuth } from '../../../hooks/useAuth';

// Ví dụ trang yêu cầu quyền admin
const AdminOnlyPage = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4>Trang chỉ dành cho Admin</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="success">
                <strong>Chào mừng, {user?.fullName}!</strong>
                <br />
                Bạn đang truy cập trang chỉ dành cho quản trị viên.
                <br />
                <small>Quyền: {isAdmin ? 'Admin' : 'User'}</small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Ví dụ trang yêu cầu quyền cụ thể
const PermissionRequiredPage = () => {
  const { user, permissions } = useAuth();

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4>Trang yêu cầu quyền cụ thể</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>Chào mừng, {user?.fullName}!</strong>
                <br />
                Bạn có quyền truy cập trang này.
                <br />
                <small>Quyền hiện tại: {permissions.join(', ')}</small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Component chính với các ví dụ
const ProtectedPageExample = () => {
  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h2>Ví dụ về Bảo vệ Trang</h2>
          <p className="text-muted">
            Các ví dụ về cách sử dụng ProtectedRoute để bảo vệ các trang khác nhau.
          </p>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>1. Trang chỉ dành cho Admin</h5>
            </Card.Header>
            <Card.Body>
              <ProtectedRoute 
                requireAdmin={true}
                fallback={<PermissionDenied message="Chỉ quản trị viên mới có thể truy cập trang này" />}
              >
                <AdminOnlyPage />
              </ProtectedRoute>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>2. Trang yêu cầu quyền cụ thể</h5>
            </Card.Header>
            <Card.Body>
              <ProtectedRoute 
                requiredPermissions={['manage_orders', 'view_orders']}
                fallback={<PermissionDenied message="Bạn cần quyền quản lý đơn hàng để truy cập trang này" />}
              >
                <PermissionRequiredPage />
              </ProtectedRoute>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>3. Cách sử dụng trong Hook</h5>
            </Card.Header>
            <Card.Body>
              <pre className="bg-light p-3 rounded">
{`// Trong component
const { requirePermission, hasPermission } = useAuth();

// Kiểm tra quyền trước khi thực hiện hành động
const handleDelete = () => {
  if (requirePermission('delete_orders')) {
    // Thực hiện xóa
  }
};

// Hiển thị nút dựa trên quyền
{hasPermission('edit_orders') && (
  <Button>Chỉnh sửa</Button>
)}`}
              </pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProtectedPageExample;

