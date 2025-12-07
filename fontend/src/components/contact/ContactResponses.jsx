import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Alert, 
  Spinner, 
  Form, 
  Button, 
  Badge,
  Row,
  Col,
  InputGroup
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaEnvelope, 
  FaReply, 
  FaCalendar,
  FaUser,
  FaTag,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaSync
} from 'react-icons/fa';
import ContactAuthGuard from './ContactAuthGuard';

const ContactResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [showAll, setShowAll] = useState(false);
const API_BASE = `http://${window.location.hostname}:8080`;
  // Load liên hệ của tài khoản hiện tại khi component mount
  useEffect(() => {
    loadUserContacts();
  }, []);

  const loadUserContacts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/contact/user-contacts`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResponses(data.contacts || []);
        setShowAll(true);
      } else {
        setError(data.message || 'Lỗi tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Load user contacts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllResponses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/contact/all-responses`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResponses(data.contacts || []);
        setShowAll(true);
      } else {
        setError(data.message || 'Lỗi tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Load responses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      setError('Vui lòng nhập email để tìm kiếm');
      return;
    }

    setSearching(true);
    setError('');
    
    try {
      // Tìm kiếm liên hệ theo email
      const response = await fetch(`${API_BASE}/contact/search?email=${encodeURIComponent(searchEmail)}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResponses(data.contacts || []);
        setShowAll(false);
        if (data.contacts.length === 0) {
          setError('Không tìm thấy liên hệ nào với email này');
        }
      } else {
        setError(data.message || 'Lỗi tìm kiếm');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Chờ phản hồi' },
      replied: { variant: 'success', text: 'Đã phản hồi' },
      closed: { variant: 'secondary', text: 'Đã đóng' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getSubjectBadge = (subject) => {
    const subjectConfig = {
      general: { variant: 'info', text: 'Thông tin chung' },
      product: { variant: 'primary', text: 'Hỏi về sản phẩm' },
      service: { variant: 'success', text: 'Hỏi về dịch vụ' },
      order: { variant: 'warning', text: 'Hỏi về đơn hàng' },
      complaint: { variant: 'danger', text: 'Khiếu nại' },
      suggestion: { variant: 'secondary', text: 'Góp ý' },
      other: { variant: 'dark', text: 'Khác' }
    };
    
    const config = subjectConfig[subject] || { variant: 'secondary', text: subject };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ContactAuthGuard>
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                <FaReply className="me-2" />
                Liên hệ của tôi
              </h5>
              <p className="mb-0 mt-2">
                {showAll ? 'Hiển thị liên hệ của tài khoản hiện tại' : 'Kết quả tìm kiếm theo email'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={loadUserContacts}
                disabled={loading}
              >
                <FaSync className="me-1" />
                Làm mới
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
        {/* Search Form */}
        <Form onSubmit={handleSearch} className="mb-4">
          <Row className="g-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>
                  <FaEnvelope className="me-1" />
                  Tìm kiếm theo email
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email để tìm kiếm liên hệ cụ thể"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="outline-secondary"
                    disabled={searching}
                  >
                    {searching ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FaSearch />
                    )}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={loadUserContacts}
                disabled={loading}
              >
                <FaFilter className="me-1" />
                Xem của tôi
              </Button>
            </Col>
          </Row>
        </Form>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Đang tải...</p>
          </div>
        )}

        {/* Results */}
        {responses.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <FaCheckCircle className="me-2 text-success" />
                {showAll ? `Hiển thị ${responses.length} liên hệ của tôi` : `Tìm thấy ${responses.length} liên hệ`}
              </h6>
              {showAll && (
                <small className="text-muted">
                  Hiển thị tất cả liên hệ của tài khoản hiện tại
                </small>
              )}
            </div>
            
            {responses.map((contact, index) => (
              <Card key={contact._id || index} className="mb-3 border-start border-4 border-primary">
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <div className="mb-2">
                        <h6 className="mb-1">
                          <FaUser className="me-2" />
                          {contact.name}
                        </h6>
                        <p className="text-muted mb-1">
                          <FaEnvelope className="me-1" />
                          {contact.email}
                        </p>
                        <div className="d-flex gap-2 mb-2">
                          {getSubjectBadge(contact.subject)}
                          {getStatusBadge(contact.status)}
                        </div>
                        <p className="text-muted small mb-2">
                          <FaCalendar className="me-1" />
                          Gửi lúc: {formatDate(contact.createdAt)}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <h6 className="text-primary">Nội dung liên hệ:</h6>
                        <div className="bg-light p-3 rounded">
                          {contact.message}
                        </div>
                      </div>
                    </Col>
                    
                    <Col md={4}>
                      {contact.status === 'replied' && contact.reply_message ? (
                        <div>
                          <h6 className="text-success">
                            <FaReply className="me-2" />
                            Phản hồi từ HaruShop
                          </h6>
                          <div className="bg-success bg-opacity-10 p-3 rounded border border-success">
                            <p className="mb-2">{contact.reply_message}</p>
                            <small className="text-muted">
                              <FaClock className="me-1" />
                              Phản hồi lúc: {formatDate(contact.replied_at)}
                            </small>
                          </div>
                        </div>
                      ) : contact.status === 'pending' ? (
                        <div className="text-center">
                          <div className="bg-warning bg-opacity-10 p-3 rounded border border-warning">
                            <FaClock className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                            <h6 className="text-warning">Đang chờ phản hồi</h6>
                            <p className="text-muted small mb-0">
                              Chúng tôi sẽ phản hồi trong thời gian sớm nhất
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-secondary bg-opacity-10 p-3 rounded border border-secondary">
                            <FaTag className="text-secondary mb-2" style={{ fontSize: '2rem' }} />
                            <h6 className="text-secondary">Đã đóng</h6>
                            <p className="text-muted small mb-0">
                              Liên hệ này đã được đóng
                            </p>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        {/* No results message */}
        {responses.length === 0 && !error && !loading && (
          <div className="text-center py-4">
            <FaEnvelope className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <h6 className="text-muted">
              {showAll ? 'Chưa có liên hệ nào' : 'Chưa có liên hệ nào'}
            </h6>
            <p className="text-muted small">
              {showAll 
                ? 'Bạn chưa gửi liên hệ nào. Hãy gửi liên hệ để có thể xem phản hồi tại đây' 
                : 'Hãy gửi liên hệ trước để có thể xem phản hồi tại đây'
              }
            </p>
          </div>
        )}
        </Card.Body>
      </Card>
    </ContactAuthGuard>
  );
};

export default ContactResponses;
