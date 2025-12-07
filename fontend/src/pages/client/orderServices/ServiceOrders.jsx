import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Pagination, Row, Spinner } from 'react-bootstrap';
import { BsCalendar, BsClock, BsEnvelope, BsEye, BsGift, BsStar, BsStarFill, BsTelephone, BsXCircle } from 'react-icons/bs';
import { Link } from 'react-router-dom';

function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
const API_BASE = `http://${window.location.hostname}:8080`;
  const statusColors = {
    'Pending': 'warning',
    'Confirmed': 'info',
    'In Progress': 'primary',
    'Completed': 'success',
    'Cancelled': 'danger'
  };

  const statusLabels = {
    'Pending': 'Chờ xử lý',
    'Confirmed': 'Đã xác nhận',
    'In Progress': 'Đang thực hiện',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy'
  };

  const paymentMethodLabels = {
    'cash': 'Tiền mặt',
    'bank_transfer': 'Chuyển khoản ngân hàng',
    'credit_card': 'Thẻ tín dụng',
    'e_wallet': 'Ví điện tử',
    'other': 'Khác'
  };

  useEffect(() => {
    fetchOrders();
    loadVouchers();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '5'
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${API_BASE}/orderservices?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách đơn dịch vụ');
      }

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.totalOrders || 0);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đơn dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async () => {
    try {
      const response = await fetch(`${API_BASE}/discounts/active`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAvailableVouchers(data.vouchers || []);
      }
    } catch (err) {
      console.error('Load vouchers error:', err);
    }
  };

  const validateVoucher = async (code) => {
    try {
      const response = await fetch(`${API_BASE}/discounts/validate/${code}`, {
        credentials: 'include'
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Validate voucher error:', err);
      return { success: false, message: 'Lỗi khi kiểm tra voucher' };
    }
  };

  const handleVoucherSubmit = async () => {
    if (!voucherCode.trim()) return;
    
    const result = await validateVoucher(voucherCode);
    if (result.success) {
      setSelectedVoucher(result.voucher);
      setShowVoucherModal(false);
      setVoucherCode('');
    } else {
      setError(result.message || 'Voucher không hợp lệ');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn dịch vụ này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/orderservices/${orderId}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể hủy đơn dịch vụ');
      }

      // Refresh orders list
      fetchOrders();
    } catch (err) {
      console.error('Cancel order error:', err);
      setError(err.message || 'Có lỗi xảy ra khi hủy đơn dịch vụ');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    if (!rating || !rating.score) return null;
    
    return (
      <div className="d-flex align-items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>
            {i < rating.score ? (
              <BsStarFill className="text-warning" size={16} />
            ) : (
              <BsStar className="text-muted" size={16} />
            )}
          </span>
        ))}
        <span className="text-muted small">({rating.score}/5)</span>
        {rating.is_updated && (
          <Badge bg="info" className="ms-1" style={{ fontSize: '0.6rem' }}>
            Đã cập nhật
          </Badge>
        )}
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải danh sách đơn dịch vụ...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h2 
          className="fw-bold mb-3"
          style={{ 
            color: '#1f2937',
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          📋 Đơn dịch vụ của tôi
        </h2>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Quản lý và theo dõi các đơn dịch vụ đã đặt
        </p>
      </div>

      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError('')}
          className="border-0 rounded-3 mb-4"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            color: '#dc2626'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span>❌</span>
            <span className="fw-medium">{error}</span>
          </div>
        </Alert>
      )}

      {/* Filter */}
      <Row className="mb-4">
        <Col md={6}>
          <div className="d-flex gap-2 align-items-center">
            <span className="fw-medium">Lọc theo trạng thái:</span>
            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="Confirmed">Đã xác nhận</option>
              <option value="In Progress">Đang thực hiện</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
        </Col>
        <Col md={6} className="text-end">
          <span className="text-muted">
            Tổng cộng: <strong>{totalOrders}</strong> đơn dịch vụ
          </span>
        </Col>
      </Row>

      {orders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h5 className="text-muted">Chưa có đơn dịch vụ nào</h5>
            <p className="text-muted">Bạn chưa đặt dịch vụ nào. Hãy khám phá các dịch vụ của chúng tôi!</p>
            <Button as={Link} to="/services" variant="primary">
              Xem dịch vụ
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-4">
            {orders.map((order) => (
              <Col key={order._id} lg={12}>
                <Card 
                  className="border-0 shadow-sm"
                  style={{
                    borderRadius: '15px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-4">
                    <Row className="align-items-center">
                      <Col md={8}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <Badge 
                            bg={statusColors[order.status]} 
                            className="px-3 py-2"
                            style={{ fontSize: '0.9rem' }}
                          >
                            {statusLabels[order.status]}
                          </Badge>
                          <span className="text-muted">
                            Mã đơn: <strong>#{order._id.slice(-8)}</strong>
                          </span>
                          <span className="text-muted">
                            <BsCalendar className="me-1" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>

                        {order.services && order.services.map((service, index) => (
                          <div key={index} className="mb-3">
                            <Row className="g-3">
                              <Col md={3}>
                                {service.services_id?.image && (
                                  <div className="mb-2">
                                    <img
                                      src={
                                        service.services_id.image.startsWith('http')
                                          ? service.services_id.image
                                          : (service.services_id.image.startsWith('/')
                                              ? `${API_BASE}${service.services_id.image}`
                                              : `${API_BASE}/uploads/services/${service.services_id.image}`)
                                      }
                                      alt={service.services_id.serviceName}
                                      className="img-fluid rounded"
                                      style={{ 
                                        maxHeight: '120px', 
                                        objectFit: 'cover',
                                        width: '100%'
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </Col>
                              <Col md={9}>
                                <h6 className="fw-bold mb-2" style={{ color: '#1f2937' }}>
                                  {service.services_id?.serviceName || 'Dịch vụ không xác định'}
                                </h6>
                                
                                {service.services_id?.description && (
                                  <p className="text-muted small mb-2">{service.services_id.description}</p>
                                )}
                                
                                <Row className="g-2">
                                  <Col sm={6}>
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                      <BsTelephone size={16} />
                                      <span>{service.fullName}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted mt-1">
                                      <BsTelephone size={16} />
                                      <span>{service.phone}</span>
                                    </div>
                                    {service.email && (
                                      <div className="d-flex align-items-center gap-2 text-muted mt-1">
                                        <BsEnvelope size={16} />
                                        <span>{service.email}</span>
                                      </div>
                                    )}
                                  </Col>
                                  <Col sm={6}>
                                    <div className="text-muted">
                                      <strong>Thú cưng:</strong> {service.petName} ({service.typePet})
                                    </div>
                                    {service.agePet && (
                                      <div className="text-muted">
                                        <strong>Tuổi:</strong> {service.agePet} tuổi
                                      </div>
                                    )}
                                    <div className="d-flex align-items-center gap-2 text-muted mt-1">
                                      <BsCalendar size={16} />
                                      <span>{formatDate(service.dateOrder)}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                      <BsClock size={16} />
                                      <span>{formatTime(service.hoursOrder)}</span>
                                    </div>
                                  </Col>
                                </Row>

                                {service.note && (
                                  <div className="mt-2">
                                    <strong>Ghi chú:</strong>
                                    <p className="text-muted mb-0 mt-1">{service.note}</p>
                                  </div>
                                )}

                                <div className="mt-2">
                                  {order.summary ? (
                                    <div>
                                      {order.summary.discount_amount > 0 && (
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                          <span className="text-muted text-decoration-line-through small">
                                            {Number(order.summary.subtotal).toLocaleString('vi-VN')}₫
                                          </span>
                                          <Badge bg="success" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                            -{order.discount_id?.type === 'percent' ? `${order.discount_id.value}%` : `${Number(order.discount_id?.value || 0).toLocaleString('vi-VN')}₫`}
                                          </Badge>
                                        </div>
                                      )}
                                      <span className="h6 text-primary fw-bold">
                                        {Number(order.summary.total).toLocaleString('vi-VN')}₫
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="h6 text-primary fw-bold">
                                      {Number(service.services_id?.price || 0).toLocaleString('vi-VN')}₫
                                    </span>
                                  )}
                                </div>

                                {/* Payment Method Display */}
                                {order.status === 'Completed' && order.paymentMethod && (
                                  <div className="mt-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="text-muted small">
                                        <strong>Phương thức thanh toán:</strong>
                                      </span>
                                      <Badge bg="success" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                        {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                {/* Rating Display */}
                                {order.status === 'Completed' && (
                                  <div className="mt-2">
                                    {order.rating && order.rating.score ? (
                                      <div className="d-flex align-items-center gap-2">
                                        {renderStars(order.rating)}
                                        {order.rating.comment && (
                                          <span className="text-muted small">
                                            "{order.rating.comment.length > 50 
                                              ? order.rating.comment.substring(0, 50) + '...' 
                                              : order.rating.comment}"
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="text-muted small">Chưa đánh giá</span>
                                        <Button
                                          as={Link}
                                          to={`/service-orders/${order._id}`}
                                          variant="outline-primary"
                                          size="sm"
                                          className="px-2 py-1"
                                          style={{ fontSize: '0.75rem' }}
                                        >
                                          <BsStar size={12} className="me-1" />
                                          Đánh giá
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Col>
                            </Row>
                          </div>
                        ))}
                      </Col>

                      <Col md={4} className="text-end">
                        <div className="d-flex flex-column gap-2">
                          <Button
                            as={Link}
                            to={`/service-orders/${order._id}`}
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center justify-content-center gap-2"
                          >
                            <BsEye size={16} />
                            Chi tiết
                          </Button>
                          
                          {availableVouchers.length > 0 && order.status === 'Pending' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => setShowVoucherModal(true)}
                              className="d-flex align-items-center justify-content-center gap-2"
                            >
                              <BsGift size={16} />
                              Chọn voucher
                            </Button>
                          )}
                          
                          {order.status === 'Pending' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCancelOrder(order._id)}
                              className="d-flex align-items-center justify-content-center gap-2"
                            >
                              <BsXCircle size={16} />
                              Hủy đơn
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Voucher Selection Modal */}
      <Modal show={showVoucherModal} onHide={() => setShowVoucherModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsGift className="me-2" />
            Chọn voucher
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nhập mã voucher</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập mã voucher..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
            </Form.Group>
            
            {availableVouchers.length > 0 && (
              <div className="mb-3">
                <Form.Label>Hoặc chọn từ danh sách</Form.Label>
                <Form.Select
                  value={selectedVoucher?.code || ''}
                  onChange={(e) => {
                    const selected = availableVouchers.find(v => v.code === e.target.value);
                    setSelectedVoucher(selected || null);
                  }}
                >
                  <option value="">Chọn voucher</option>
                  {availableVouchers.map((voucher) => (
                    <option key={voucher.code} value={voucher.code}>
                      {voucher.name} - {voucher.type === 'percent' 
                        ? `Giảm ${voucher.value}%` 
                        : `Giảm ${voucher.value.toLocaleString('vi-VN')}₫`}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVoucherModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleVoucherSubmit}>
            Áp dụng voucher
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ServiceOrders;
