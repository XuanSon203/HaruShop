import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Form, 
  Alert,
  Spinner,
  InputGroup,
  Dropdown,
  Pagination
} from 'react-bootstrap';
import { 
  FaEye, 
  FaReply, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaEnvelope,
  FaPhone,
  FaUser,
  FaCalendar,
  FaTag,
  FaChartBar
} from 'react-icons/fa';

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    replied: 0,
    closed: 0
  });

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, subjectFilter]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(subjectFilter && { subject: subjectFilter })
      });

      const response = await fetch(`http://localhost:8080/admin/contacts?${params}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
        setTotalPages(data.pagination.totalPages);
        setTotalContacts(data.pagination.totalContacts);
      } else {
        setError('Không thể tải danh sách liên hệ');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Fetch contacts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/admin/contacts/stats', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleViewDetail = (contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleReply = (contact) => {
    setSelectedContact(contact);
    setReplyMessage('');
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setReplying(true);
    try {
      const response = await fetch(`http://localhost:8080/admin/contacts/${selectedContact._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reply_message: replyMessage })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Gửi phản hồi thành công');
        setShowReplyModal(false);
        setReplyMessage('');
        fetchContacts();
        fetchStats();
      } else {
        setError(data.message || 'Gửi phản hồi thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Reply error:', err);
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/admin/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Xóa liên hệ thành công');
        fetchContacts();
        fetchStats();
      } else {
        setError(data.message || 'Xóa liên hệ thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
      console.error('Delete error:', err);
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
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <FaEnvelope className="me-2" />
            Quản lý phản hồi 
          </h2>
          <p className="text-muted">Quản lý các tin nhắn liên hệ từ khách hàng</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartBar className="text-primary mb-2" style={{ fontSize: '2rem' }} />
              <h4>{stats.total}</h4>
              <p className="text-muted mb-0">Tổng liên hệ</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaEnvelope className="text-warning mb-2" style={{ fontSize: '2rem' }} />
              <h4>{stats.pending}</h4>
              <p className="text-muted mb-0">Chờ phản hồi</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaReply className="text-success mb-2" style={{ fontSize: '2rem' }} />
              <h4>{stats.replied}</h4>
              <p className="text-muted mb-0">Đã phản hồi</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaTag className="text-secondary mb-2" style={{ fontSize: '2rem' }} />
              <h4>{stats.closed}</h4>
              <p className="text-muted mb-0">Đã đóng</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ phản hồi</option>
                <option value="replied">Đã phản hồi</option>
                <option value="closed">Đã đóng</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">Tất cả chủ đề</option>
                <option value="general">Thông tin chung</option>
                <option value="product">Hỏi về sản phẩm</option>
                <option value="service">Hỏi về dịch vụ</option>
                <option value="order">Hỏi về đơn hàng</option>
                <option value="complaint">Khiếu nại</option>
                <option value="suggestion">Góp ý</option>
                <option value="other">Khác</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setSubjectFilter('');
                }}
              >
                <FaFilter className="me-1" />
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Contacts Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Danh sách phản hồi  ({totalContacts})</h5>
            {loading && <Spinner animation="border" size="sm" />}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Khách hàng</th>
                  <th>Chủ đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id}>
                    <td>
                      <div>
                        <div className="fw-bold">
                          <FaUser className="me-1" />
                          {contact.name}
                        </div>
                        <div className="text-muted small">
                          <FaEnvelope className="me-1" />
                          {contact.email}
                        </div>
                        <div className="text-muted small">
                          <FaPhone className="me-1" />
                          {contact.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      {getSubjectBadge(contact.subject)}
                    </td>
                    <td>
                      {getStatusBadge(contact.status)}
                    </td>
                    <td>
                      <div className="small">
                        <FaCalendar className="me-1" />
                        {formatDate(contact.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetail(contact)}
                        >
                          <FaEye />
                        </Button>
                        {contact.status === 'pending' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleReply(contact)}
                          >
                            <FaReply />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(contact._id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            />
            {[...Array(totalPages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={currentPage === index + 1}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết liên hệ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContact && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6><FaUser className="me-2" />Thông tin khách hàng</h6>
                  <p><strong>Tên:</strong> {selectedContact.name}</p>
                  <p><strong>Email:</strong> {selectedContact.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedContact.phone}</p>
                </Col>
                <Col md={6}>
                  <h6><FaTag className="me-2" />Thông tin liên hệ</h6>
                  <p><strong>Chủ đề:</strong> {getSubjectBadge(selectedContact.subject)}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedContact.status)}</p>
                  <p><strong>Ngày gửi:</strong> {formatDate(selectedContact.createdAt)}</p>
                </Col>
              </Row>
              
              <h6><FaEnvelope className="me-2" />Nội dung tin nhắn</h6>
              <div className="border p-3 rounded bg-light">
                {selectedContact.message}
              </div>
              
              {selectedContact.reply_message && (
                <>
                  <h6 className="mt-3"><FaReply className="me-2" />Phản hồi</h6>
                  <div className="border p-3 rounded bg-success bg-opacity-10">
                    {selectedContact.reply_message}
                  </div>
                  {selectedContact.replied_at && (
                    <small className="text-muted">
                      Phản hồi lúc: {formatDate(selectedContact.replied_at)}
                    </small>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
          {selectedContact?.status === 'pending' && (
            <Button variant="primary" onClick={() => {
              setShowDetailModal(false);
              handleReply(selectedContact);
            }}>
              <FaReply className="me-1" />
              Phản hồi
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Phản hồi liên hệ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContact && (
            <div>
              <h6>Gửi phản hồi cho: {selectedContact.name} ({selectedContact.email})</h6>
              <Form.Group className="mb-3">
                <Form.Label>Nội dung phản hồi</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReplyModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendReply}
            disabled={replying || !replyMessage.trim()}
          >
            {replying ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang gửi...
              </>
            ) : (
              <>
                <FaReply className="me-1" />
                Gửi phản hồi
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Contact;

