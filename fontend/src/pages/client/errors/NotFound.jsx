import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsHouseDoor, BsArrowLeft, BsSearch } from 'react-icons/bs';

function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSearch = () => {
    navigate('/search');
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} className="text-center">
          <div className="mb-4">
            <div 
              className="display-1 fw-bold text-primary mb-3"
              style={{ fontSize: '8rem', lineHeight: '1' }}
            >
              404
            </div>
            <h1 className="h2 mb-3">Trang không tìm thấy</h1>
            <p className="lead text-muted mb-4">
              Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
          </div>

          <div className="mb-5">
            <div className="d-flex justify-content-center mb-4">
              <div 
                className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '200px', height: '200px' }}
              >
                <BsSearch size={80} className="text-muted" />
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleGoHome}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <BsHouseDoor />
              Về trang chủ
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
              onClick={handleSearch}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <BsSearch />
              Tìm kiếm
            </Button>
          </div>

          <div className="text-muted small">
            <p>Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ với chúng tôi.</p>
            <p>
              <a href="/contact" className="text-decoration-none">
                Liên hệ hỗ trợ
              </a>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;
