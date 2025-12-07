import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  Alert, 
  Row, 
  Col,
  Spinner
} from 'react-bootstrap';
import { 
  FaEnvelope, 
  FaUser, 
  FaPhone, 
  FaTag, 
  FaComment,
  FaPaperPlane,
  FaCheckCircle
} from 'react-icons/fa';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
const API_BASE = `http://${window.location.hostname}:8080`;
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'general',
          message: ''
        });
      } else {
        setError(data.message || 'Gửi liên hệ thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối server. Vui lòng thử lại sau.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = [
    { value: 'general', label: 'Thông tin chung' },
    { value: 'product', label: 'Hỏi về sản phẩm' },
    { value: 'service', label: 'Hỏi về dịch vụ' },
    { value: 'order', label: 'Hỏi về đơn hàng' },
    { value: 'complaint', label: 'Khiếu nại' },
    { value: 'suggestion', label: 'Góp ý' },
    { value: 'other', label: 'Khác' }
  ];

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">
          <FaEnvelope className="me-2" />
          Liên hệ với chúng tôi
        </h4>
        <p className="mb-0 mt-2">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
      </Card.Header>
      <Card.Body className="p-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            <FaCheckCircle className="me-2" />
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" />
                  Họ và tên *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  required
                  maxLength={100}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaEnvelope className="me-1" />
                  Email *
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  required
                  maxLength={100}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaPhone className="me-1" />
                  Số điện thoại *
                </Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  required
                  maxLength={20}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaTag className="me-1" />
                  Chủ đề *
                </Form.Label>
                <Form.Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  {subjectOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>
              <FaComment className="me-1" />
              Nội dung tin nhắn *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Nhập nội dung tin nhắn của bạn..."
              required
              minLength={10}
              maxLength={2000}
            />
            <Form.Text className="text-muted">
              Tối thiểu 10 ký tự, tối đa 2000 ký tự ({formData.message.length}/2000)
            </Form.Text>
          </Form.Group>

          <div className="d-grid">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !formData.name || !formData.email || !formData.phone || !formData.message}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-2" />
                  Gửi liên hệ
                </>
              )}
            </Button>
          </div>
        </Form>

        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="mb-2">Thông tin liên hệ khác:</h6>
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Email:</strong> support@harushop.com
              </p>
              <p className="mb-1">
                <strong>Hotline:</strong> 1900 1234
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Thời gian:</strong> 8:00 - 22:00 (T2-CN)
              </p>
              <p className="mb-0">
                <strong>Phản hồi:</strong> Trong vòng 24h
              </p>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ContactForm;

