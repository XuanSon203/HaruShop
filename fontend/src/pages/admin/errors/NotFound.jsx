import React from 'react';
import { Container, Row, Col, Button, Card, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsHouseDoor, BsArrowLeft, BsGear, BsExclamationTriangle } from 'react-icons/bs';

function AdminNotFound() {
  const navigate = useNavigate();

  const handleGoDashboard = () => {
    navigate('/admin');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoLogin = () => {
    navigate('/admin/auth/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Admin Header */}
      <Navbar bg="primary" variant="dark" className="shadow-sm">
        <Container>
          <Navbar.Brand href="/admin" className="fw-bold">
            <i className="fas fa-cog me-2"></i>
            Manager Shop
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link href="/admin/auth/login" className="text-white">
              <i className="fas fa-sign-in-alt me-1"></i>
              Đăng nhập
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5 text-center">
                <div className="mb-4">
                  <div 
                    className="display-1 fw-bold text-danger mb-3"
                    style={{ fontSize: '6rem', lineHeight: '1' }}
                  >
                    404
                  </div>
                  <h1 className="h3 mb-3 text-dark">Trang không tìm thấy</h1>
                  <p className="text-muted mb-4">
                    Trang quản trị bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-center mb-3">
                    <div 
                      className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '120px', height: '120px' }}
                    >
                      <BsExclamationTriangle size={50} className="text-danger" />
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleGoDashboard}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <BsHouseDoor />
                    Về Dashboard
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="lg" 
                    onClick={handleGoBack}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <BsArrowLeft />
                    Quay lại
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="lg" 
                    onClick={handleGoLogin}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <BsGear />
                    Đăng nhập
                  </Button>
                </div>

                <div className="text-muted small">
                  <p className="mb-2">
                    <strong>Gợi ý:</strong>
                  </p>
                  <ul className="list-unstyled text-start">
                    <li>• Kiểm tra URL có đúng không</li>
                    <li>• Đảm bảo bạn có quyền truy cập trang này</li>
                    <li>• Liên hệ quản trị viên nếu cần hỗ trợ</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AdminNotFound;
