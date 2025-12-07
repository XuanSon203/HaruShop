import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { BsCalendar, BsClock, BsTelephone, BsEnvelope, BsArrowLeft, BsXCircle, BsStar, BsStarFill, BsPencil, BsTrash } from 'react-icons/bs';
import { Link, useParams, useNavigate } from 'react-router-dom';
import RatingModal from '../../../components/RatingModal';

function ServiceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
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
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/orderservices/${id}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải chi tiết đơn dịch vụ');
      }

      setOrder(data.order);
    } catch (err) {
      console.error('Fetch order detail error:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải chi tiết đơn dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn dịch vụ này?')) {
      return;
    }

    try {
      setCancelling(true);
      
      const response = await fetch(`${API_BASE}/orderservices/${id}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể hủy đơn dịch vụ');
      }

      // Refresh order data
      await fetchOrderDetail();
    } catch (err) {
      console.error('Cancel order error:', err);
      setError(err.message || 'Có lỗi xảy ra khi hủy đơn dịch vụ');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }

    try {
      setRatingLoading(true);
      
      const response = await fetch(`${API_BASE}/orderservices/${id}/rating`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa đánh giá');
      }

      // Refresh order data
      await fetchOrderDetail();
    } catch (err) {
      console.error('Delete rating error:', err);
      setError(err.message || 'Có lỗi xảy ra khi xóa đánh giá');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRatingSubmit = (rating) => {
    setOrder(prev => ({
      ...prev,
      rating
    }));
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

  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải chi tiết đơn dịch vụ...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center">
          <h5>Không thể tải đơn dịch vụ</h5>
          <p>{error}</p>
          <Button as={Link} to="/service-orders" variant="primary">
            Quay lại danh sách
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="my-5">
        <Alert variant="warning" className="text-center">
          <h5>Không tìm thấy đơn dịch vụ</h5>
          <p>Đơn dịch vụ không tồn tại hoặc bạn không có quyền xem.</p>
          <Button as={Link} to="/service-orders" variant="primary">
            Quay lại danh sách
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/service-orders')}
          className="d-flex align-items-center gap-2"
        >
          <BsArrowLeft size={16} />
          Quay lại
        </Button>
        <div>
          <h2 
            className="fw-bold mb-0"
            style={{ 
              color: '#1f2937',
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Chi tiết đơn dịch vụ
          </h2>
        </div>
      </div>

      <Row className="g-4">
        {/* Order Info */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
            <Card.Header 
              className="border-0 p-4"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: 'white',
                borderRadius: '15px 15px 0 0'
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1 fw-bold">Thông tin đơn dịch vụ</h5>
                  <p className="mb-0 opacity-75">Mã đơn: #{order._id.slice(-8)}</p>
                </div>
                <Badge 
                  bg={statusColors[order.status]} 
                  className="px-3 py-2"
                  style={{ fontSize: '1rem' }}
                >
                  {statusLabels[order.status]}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {order.services && order.services.map((service, index) => (
                <div key={index}>
                  {/* Service Info */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                      Dịch vụ: {service.services_id?.serviceName || 'Dịch vụ không xác định'}
                    </h6>
                    
                    {service.services_id?.image && (
                      <div className="mb-3">
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
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {service.services_id?.description && (
                      <p className="text-muted mb-3">{service.services_id.description}</p>
                    )}

                    <div className="mb-3">
                      {order.summary ? (
                        <div>
                          <div className="mb-2">
                            <strong>Giá gốc:</strong> {Number(order.summary.subtotal).toLocaleString('vi-VN')}₫
                          </div>
                          {order.summary.discount_amount > 0 && (
                            <div className="mb-2">
                              <strong>Giảm giá:</strong> 
                              <span className="text-success ms-2">
                                -{Number(order.summary.discount_amount).toLocaleString('vi-VN')}₫
                                {order.discount_id && (
                                  <span className="ms-2">
                                    ({order.discount_id.name})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="h5 text-primary fw-bold">
                              Tổng cộng: {Number(order.summary.total).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="h5 text-primary fw-bold">
                          Giá dịch vụ: {Number(service.services_id?.price || 0).toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                      Thông tin khách hàng
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="d-flex align-items-center gap-2">
                          <BsTelephone size={18} className="text-primary" />
                          <div>
                            <div className="fw-medium">{service.fullName}</div>
                            <small className="text-muted">Họ và tên</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex align-items-center gap-2">
                          <BsTelephone size={18} className="text-primary" />
                          <div>
                            <div className="fw-medium">{service.phone}</div>
                            <small className="text-muted">Số điện thoại</small>
                          </div>
                        </div>
                      </Col>
                      
                    </Row>
                  </div>

                  {/* Pet Info */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                      Thông tin thú cưng
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <div>
                          <div className="fw-medium">{service.petName}</div>
                          <small className="text-muted">Tên thú cưng</small>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <div className="fw-medium">{service.typePet}</div>
                          <small className="text-muted">Loại thú cưng</small>
                        </div>
                      </Col>
                      {service.agePet && (
                        <Col md={6}>
                          <div>
                            <div className="fw-medium">{service.agePet} tuổi</div>
                            <small className="text-muted">Tuổi thú cưng</small>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>

                  {/* Schedule Info */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                      Thông tin lịch hẹn
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="d-flex align-items-center gap-2">
                          <BsCalendar size={18} className="text-primary" />
                          <div>
                            <div className="fw-medium">{formatDate(service.dateOrder)}</div>
                            <small className="text-muted">Ngày đặt lịch</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex align-items-center gap-2">
                          <BsClock size={18} className="text-primary" />
                          <div>
                            <div className="fw-medium">{formatTime(service.hoursOrder)}</div>
                            <small className="text-muted">Giờ đặt lịch</small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Notes */}
                  {service.note && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                        Ghi chú
                      </h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-0">{service.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
            <Card.Header 
              className="border-0 p-4"
              style={{
                background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
                color: 'white',
                borderRadius: '15px 15px 0 0'
              }}
            >
              <h5 className="mb-0 fw-bold">Tóm tắt đơn hàng</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Mã đơn:</span>
                  <span className="fw-medium">#{order._id.slice(-8)}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Trạng thái:</span>
                  <Badge bg={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Ngày đặt:</span>
                  <span className="fw-medium">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>

              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Cập nhật lần cuối:</span>
                    <span className="fw-medium">{formatDateTime(order.updatedAt)}</span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {order.status === 'Completed' && order.paymentMethod && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Phương thức thanh toán:</span>
                    <Badge bg="success" className="px-3 py-2">
                      {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                    </Badge>
                  </div>
                </div>
              )}

              <hr />

              {/* Rating Section */}
              {order.status === 'Completed' && (
                <div className="mb-3">
                  <h6 className="fw-bold mb-3" style={{ color: '#1f2937' }}>
                    Đánh giá dịch vụ
                  </h6>
                  
                  {order.rating && order.rating.score ? (
                    <div className="p-3 bg-light rounded">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="d-flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>
                              {i < order.rating.score ? (
                                <BsStarFill className="text-warning" size={20} />
                              ) : (
                                <BsStar className="text-muted" size={20} />
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="fw-medium">{order.rating.score}/5 sao</span>
                        {order.rating.is_updated && (
                          <Badge bg="info" className="ms-2" style={{ fontSize: '0.7rem' }}>
                            Đã cập nhật
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-muted small mb-2">
                        <span>Đánh giá lúc: {formatDateTime(order.rating.rated_at)}</span>
                        {order.rating.updated_at && order.rating.is_updated && (
                          <span className="ms-3">
                            Cập nhật lúc: {formatDateTime(order.rating.updated_at)}
                          </span>
                        )}
                      </div>
                      
                      {order.rating.comment && (
                        <p className="mb-2">{order.rating.comment}</p>
                      )}
                      
                      {order.rating.images && order.rating.images.length > 0 && (
                        <div className="mb-2">
                          <Row className="g-2">
                            {order.rating.images.map((image, index) => (
                              <Col key={index} xs={6} md={4}>
                                <img
                                  src={image}
                                  alt={`Rating ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{ height: '80px', objectFit: 'cover' }}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                      
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setShowRatingModal(true)}
                          className="d-flex align-items-center gap-1"
                        >
                          <BsPencil size={14} />
                          Chỉnh sửa
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleDeleteRating}
                          disabled={ratingLoading}
                          className="d-flex align-items-center gap-1"
                        >
                          <BsTrash size={14} />
                          {ratingLoading ? 'Đang xóa...' : 'Xóa đánh giá'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted mb-3">Bạn chưa đánh giá dịch vụ này</p>
                      <Button
                        variant="primary"
                        onClick={() => setShowRatingModal(true)}
                        className="d-flex align-items-center gap-2"
                      >
                        <BsStar size={16} />
                        Đánh giá dịch vụ
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {order.status === 'Pending' && (
                <div className="d-grid">
                  <Button
                    variant="outline-danger"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <BsXCircle size={16} />
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn dịch vụ'}
                  </Button>
                </div>
              )}

              <div className="mt-3">
                <small className="text-muted">
                  Nếu bạn có thắc mắc về đơn dịch vụ, vui lòng liên hệ với chúng tôi qua hotline hoặc email.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rating Modal */}
      <RatingModal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        orderId={id}
        existingRating={order?.rating}
        onRatingSubmit={handleRatingSubmit}
      />
    </Container>
  );
}

export default ServiceOrderDetail;
