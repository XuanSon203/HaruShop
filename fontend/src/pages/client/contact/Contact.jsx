import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import ContactForm from '../../../components/contact/ContactForm';
import ContactResponses from '../../../components/contact/ContactResponses';

const Contact = () => {
  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5">
        <Col>
          <div className="text-center">
            <h1 className="display-4 fw-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Liên hệ và Phản hồi với  HaiRuShop
            </h1>
            <p className="lead text-muted">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn mọi lúc
            </p>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Contact Information */}
        <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Thông tin liên hệ</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <div className="d-flex align-items-start">
                  <FaMapMarkerAlt className="text-primary me-3 mt-1" style={{ fontSize: '1.2rem' }} />
                  <div>
                    <h6 className="mb-1">Địa chỉ</h6>
                    <p className="text-muted mb-0">
                      123 Đường Nguyễn Huệ, Phường Bến Nghé<br />
                      Quận 1, TP. Hồ Chí Minh, Việt Nam
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-start">
                  <FaPhone className="text-primary me-3 mt-1" style={{ fontSize: '1.2rem' }} />
                  <div>
                    <h6 className="mb-1">Điện thoại</h6>
                    <p className="text-muted mb-0">
                      <a href="tel:19001234" className="text-decoration-none">
                        1900 1234
                      </a><br />
                      <a href="tel:0123456789" className="text-decoration-none">
                        0123 456 789
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-start">
                  <FaEnvelope className="text-primary me-3 mt-1" style={{ fontSize: '1.2rem' }} />
                  <div>
                    <h6 className="mb-1">Email</h6>
                    <p className="text-muted mb-0">
                      <a href="mailto:support@harushop.com" className="text-decoration-none">
                        support@harushop.com
                      </a><br />
                      <a href="mailto:info@harushop.com" className="text-decoration-none">
                        info@harushop.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-0">
                <div className="d-flex align-items-start">
                  <FaClock className="text-primary me-3 mt-1" style={{ fontSize: '1.2rem' }} />
                  <div>
                    <h6 className="mb-1">Giờ làm việc</h6>
                    <p className="text-muted mb-0">
                      Thứ 2 - Thứ 6: 8:00 - 22:00<br />
                      Thứ 7 - Chủ nhật: 9:00 - 21:00
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Contact Form */}
        <Col lg={8}>
          <ContactForm />
        </Col>
      </Row>

      {/* Contact Responses Section */}
      <Row className="mt-5">
        <Col>
          <ContactResponses />
        </Col>
      </Row>

      {/* FAQ Section */}
      <Row className="mt-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Câu hỏi thường gặp</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h6 className="text-primary">Làm thế nào để đặt hàng?</h6>
                    <p className="text-muted small">
                      Bạn có thể đặt hàng trực tiếp trên website hoặc gọi hotline 1900 1234. 
                      Chúng tôi sẽ hỗ trợ bạn trong suốt quá trình đặt hàng.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="text-primary">Thời gian giao hàng là bao lâu?</h6>
                    <p className="text-muted small">
                      Đối với khu vực nội thành: 1-2 ngày làm việc.<br />
                      Đối với các tỉnh khác: 3-5 ngày làm việc.
                    </p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="mb-4">
                    <h6 className="text-primary">Có thể đổi trả sản phẩm không?</h6>
                    <p className="text-muted small">
                      Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng, 
                      với điều kiện sản phẩm còn nguyên vẹn và có hóa đơn.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="text-primary">Phương thức thanh toán nào được hỗ trợ?</h6>
                    <p className="text-muted small">
                      Chúng tôi hỗ trợ thanh toán COD, chuyển khoản ngân hàng, 
                      ví điện tử và thẻ tín dụng.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Map Section */}
      <Row className="mt-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Vị trí cửa hàng</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div 
                className="bg-light d-flex align-items-center justify-content-center" 
                style={{ height: '400px' }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3259414047!2d106.6641!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ed2392c44df%3A0x46034c05a6352c0!2zVMO0IE5nw6AgVHLDqG4gUGjDsm5n!5e0!3m2!1svi!2s!4v1640995200000!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="HaruShop Location"
                ></iframe>
              </div>
              <div className="p-3">
                <h6 className="mb-2">
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  Địa chỉ cửa hàng
                </h6>
                <p className="mb-1">
                  <strong>HaruShop - Chi nhánh Quận 1</strong>
                </p>
                <p className="mb-1 text-muted">
                  123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                </p>
                <p className="mb-1 text-muted">
                  <FaPhone className="me-1" />
                  Hotline: 1900 1234 | 0123 456 789
                </p>
                <p className="mb-0 text-muted">
                  <FaClock className="me-1" />
                  Mở cửa: 8:00 - 22:00 (T2-CN)
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;