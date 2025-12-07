import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsShieldX, BsArrowLeft, BsHouseDoor } from 'react-icons/bs';

const PermissionDenied = ({ message = 'Bạn không có quyền truy cập chức năng này' }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoDashboard = () => {
    navigate('/admin');
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5 text-center">
              <div className="mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <div 
                    className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '100px', height: '100px' }}
                  >
                    <BsShieldX size={50} className="text-warning" />
                  </div>
                </div>
                <h4 className="text-warning mb-3">Không có quyền truy cập</h4>
                <p className="text-muted">{message}</p>
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleGoBack}
                  className="d-flex align-items-center gap-2"
                >
                  <BsArrowLeft />
                  Quay lại
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleGoDashboard}
                  className="d-flex align-items-center gap-2"
                >
                  <BsHouseDoor />
                  Về Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PermissionDenied;

