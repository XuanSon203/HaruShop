import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Table, Image } from 'react-bootstrap';
import { BsArrowLeft, BsXCircle, BsStar, BsStarFill, BsCheckCircle, BsTruck, BsBox, BsClock } from 'react-icons/bs';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../../components/nofication/Nofication';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [rateItem, setRateItem] = useState(null);
  const [rateStars, setRateStars] = useState(5);
  const API_BASE = `http://${window.location.hostname}:8080`;

  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'shipping': 'primary',
    'shipped': 'primary',
    'completed': 'success',
    'cancelled': 'danger',
    'returned': 'secondary'
  };

  const statusLabels = {
    'pending': 'Chờ xác nhận',
    'processing': 'Đang xử lý',
    'shipping': 'Đang giao',
    'shipped': 'Đã giao cho DVVC',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'returned': 'Hoàn hàng'
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
      
      const response = await fetch(`${API_BASE}/orders/${id}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải chi tiết đơn hàng');
      }

      setOrder(data.order);
    } catch (err) {
      console.error('Fetch order detail error:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      setCancelling(true);
      
      const response = await fetch(`${API_BASE}/orders/${id}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể hủy đơn hàng');
      }

      addNotification('Đơn hàng đã được hủy thành công', 'success');
      await fetchOrderDetail();
    } catch (err) {
      console.error('Cancel order error:', err);
      addNotification(err.message || 'Có lỗi xảy ra khi hủy đơn hàng', 'danger');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Tính toán timeline vận chuyển dựa trên status và updatedBy
  const shippingTimeline = useMemo(() => {
    if (!order) return [];
    const timeline = [];

    // Mốc 1: Đơn hàng đã được đặt (luôn có)
    timeline.push({
      date: new Date(order.createdAt),
      label: 'Đơn hàng đã được đặt',
      icon: <BsBox />,
      color: 'success',
      isCompleted: true,
      status: 'pending',
    });

    // Mốc 2: Đang giao (nếu status là shipping, shipped)
    if (order.status === 'shipping' || order.status === 'shipped') {
      // Tìm thời gian chuyển sang shipping/shipped từ updatedBy
      let shippingDate = null;
      if (order.updatedBy && order.updatedBy.length > 0) {
        // Tìm lần cập nhật đầu tiên có status shipping hoặc shipped
        for (let i = order.updatedBy.length - 1; i >= 0; i--) {
          const update = order.updatedBy[i];
          if (update.updatedAt) {
            shippingDate = new Date(update.updatedAt);
            break;
          }
        }
      }
      // Nếu không tìm thấy trong updatedBy, dùng updatedAt hoặc createdAt + 1 ngày
      if (!shippingDate) {
        shippingDate = order.updatedAt 
          ? new Date(order.updatedAt) 
          : new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000);
      }

      timeline.push({
        date: shippingDate,
        label: 'Đang giao',
        icon: <BsTruck />,
        color: 'primary',
        isCompleted: order.status === 'completed',
        status: 'shipping',
      });
    }

    // Mốc 3: Đã giao (nếu status là completed)
    if (order.status === 'completed') {
      // Tìm thời gian completed từ updatedBy hoặc deliveredAt
      let completedDate = null;
      if (order.deliveredAt) {
        completedDate = new Date(order.deliveredAt);
      } else if (order.updatedBy && order.updatedBy.length > 0) {
        // Tìm lần cập nhật cuối cùng (thường là khi completed)
        const lastUpdate = order.updatedBy[order.updatedBy.length - 1];
        if (lastUpdate.updatedAt) {
          completedDate = new Date(lastUpdate.updatedAt);
        }
      }
      // Nếu không tìm thấy, dùng updatedAt
      if (!completedDate) {
        completedDate = order.updatedAt 
          ? new Date(order.updatedAt) 
          : new Date();
      }

      timeline.push({
        date: completedDate,
        label: 'Đã giao',
        icon: <BsCheckCircle />,
        color: 'success',
        isCompleted: true,
        status: 'completed',
      });
    }

    // Sắp xếp theo thời gian (cũ nhất trước, mới nhất sau)
    timeline.sort((a, b) => a.date - b.date);

    return timeline;
  }, [order]);

  // Tính thời gian nhận hàng dự kiến
  const estimatedDeliveryDate = useMemo(() => {
    if (!order || !order.shipping_id) return null;
    
    const estimatedDays = order.shipping_id.estimated_delivery_time 
      ? parseInt(order.shipping_id.estimated_delivery_time.replace(/[^0-9]/g, '')) || 3
      : 3;
    
    const shippingDate = order.status === 'shipped' || order.status === 'shipping' 
      ? (order.updatedBy && order.updatedBy.length > 0 
          ? new Date(order.updatedBy[order.updatedBy.length - 1].updatedAt)
          : new Date(order.updatedAt || order.createdAt))
      : new Date(order.createdAt);
    
    const deliveryDate = new Date(shippingDate);
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    
    return deliveryDate;
  }, [order]);

  const handleRateProduct = async (product) => {
    if (!product.product_id || !product.category_id) {
      addNotification('Thiếu thông tin sản phẩm', 'danger');
      return;
    }

    try {
      setRatingLoading(true);
      const response = await fetch(`${API_BASE}/orders/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product.product_id,
          category_id: product.category_id,
          rating: rateStars,
          comment: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đánh giá sản phẩm');
      }

      addNotification('Đánh giá thành công!', 'success');
      setRateItem(null);
      setRateStars(5);
      await fetchOrderDetail();
    } catch (err) {
      console.error('Rate product error:', err);
      addNotification(err.message || 'Có lỗi xảy ra khi đánh giá', 'danger');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Đang tải chi tiết đơn hàng...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Lỗi</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="outline-danger" onClick={() => navigate('/orders')}>
              <BsArrowLeft className="me-2" />
              Quay lại danh sách đơn hàng
            </Button>
            <Button variant="primary" onClick={fetchOrderDetail}>
              Thử lại
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Không tìm thấy đơn hàng</Alert.Heading>
          <p>Đơn hàng bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <Button variant="outline-warning" onClick={() => navigate('/orders')}>
            <BsArrowLeft className="me-2" />
            Quay lại danh sách đơn hàng
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/orders')}
          >
            <BsArrowLeft className="me-2" />
            Quay lại
          </Button>
          <div>
            <h4 className="mb-0">Chi tiết đơn hàng</h4>
            <small className="text-muted">Mã đơn: #{String(order._id).slice(-8).toUpperCase()}</small>
          </div>
        </div>
        <Badge bg={statusColors[order.status] || 'secondary'} className="px-3 py-2">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      {/* Địa chỉ nhận hàng và Timeline */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-light">
              <h6 className="mb-0 fw-bold">Địa Chỉ Nhận Hàng</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>{order.customer_info?.fullName || order.user_id?.fullName || '—'}</strong>
              </div>
              <div className="mb-2 text-muted">
                {order.customer_info?.phone || order.user_id?.phone || '—'}
              </div>
              <div className="text-muted">
                {order.customer_info?.address || '—'}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">Theo Dõi Đơn Hàng</h6>
                {order.shipping_id?.name && (
                  <Badge bg="info">{order.shipping_id.name}</Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {shippingTimeline.length > 0 ? (
                <div className="position-relative">
                  {shippingTimeline.map((item, index) => (
                    <div key={index} className="d-flex mb-3">
                      <div className="me-3 d-flex flex-column align-items-center">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center ${
                            item.isCompleted ? `bg-${item.color}` : 'bg-secondary'
                          }`}
                          style={{ width: '32px', height: '32px', color: 'white', flexShrink: 0 }}
                        >
                          {item.icon}
                        </div>
                        {index < shippingTimeline.length - 1 && (
                          <div
                            className={`border-start border-2 ${
                              shippingTimeline[index + 1]?.isCompleted 
                                ? `border-${shippingTimeline[index + 1].color}` 
                                : 'border-secondary'
                            }`}
                            style={{ height: '60px', marginTop: '4px', minHeight: '60px' }}
                          />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium mb-1">{item.label}</div>
                        <div className="text-muted small">
                          {formatTime(item.date)} {formatDateShort(item.date)}
                        </div>
                        {item.label === 'Đã giao' && (
                          <div className="text-success small mt-1">
                            Giao hàng thành công
                          </div>
                        )}
                        {item.label === 'Đang giao' && order.status !== 'completed' && (
                          <div className="text-muted small mt-1">
                            Đơn hàng sẽ sớm được giao, vui lòng chú ý điện thoại
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">
                  Chưa có thông tin vận chuyển
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Thời gian nhận hàng dự kiến */}
      {estimatedDeliveryDate && (order.status === 'shipping' || order.status === 'shipped') && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center gap-2">
            <BsClock />
            <strong>Thời gian nhận hàng dự kiến:</strong>
            <span>{formatDate(estimatedDeliveryDate)}</span>
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {/* Sản phẩm */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Sản phẩm trong đơn</h5>
            </Card.Header>
            <Card.Body>
              {order.products?.map((product, index) => (
                <div key={index} className="d-flex gap-3 mb-4 pb-4 border-bottom">
                  <Image
                    src={(() => {
                      const productInfo = product?.product_info || {};
                      if (productInfo.thumbnail) {
                        const folder = productInfo.type === "accessory" ? "accessory" : "foods";
                        return `${API_BASE}/uploads/products/${folder}/${productInfo.thumbnail}`;
                      }
                      if (productInfo.images && productInfo.images.length > 0) {
                        const folder = productInfo.type === "accessory" ? "accessory" : "foods";
                        return `${API_BASE}/uploads/products/${folder}/${productInfo.images[0]}`;
                      }
                      return "/placeholder.jpg";
                    })()}
                    style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    rounded
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold mb-1">{product.product_info?.name || 'Sản phẩm'}</div>
                    {product.category_id?.name && (
                      <div className="text-muted small mb-2">Phân loại hàng: {product.category_id.name}</div>
                    )}
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <span className="text-muted">x{product.quantity}</span>
                      {product.discount > 0 ? (
                        <>
                          <span className="text-decoration-line-through text-muted">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-danger fw-bold">
                            {formatPrice(product.amount / product.quantity)}
                          </span>
                        </>
                      ) : (
                        <span className="text-danger fw-bold">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    {order.status === 'completed' && (
                      <div className="mt-2">
                        {product.alreadyRated ? (
                          <Badge bg="success">Đã đánh giá</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setRateItem(product);
                              setRateStars(5);
                            }}
                          >
                            <BsStarFill className="me-1" />
                            Đánh giá
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-danger">
                      {formatPrice(product.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Thông tin hoàn hàng */}
          {order.return_request?.isReturned && (
            <Card className="mb-4 border-warning">
              <Card.Header className="bg-warning bg-opacity-10">
                <h5 className="mb-0 text-warning">
                  <BsXCircle className="me-2" />
                  Thông tin hoàn hàng
                </h5>
              </Card.Header>
              <Card.Body>
                {order.return_request.return_reason && (
                  <div className="mb-3">
                    <strong>Lý do hoàn hàng:</strong>
                    <p className="mt-1">{order.return_request.return_reason}</p>
                  </div>
                )}
                {order.return_request.return_description && (
                  <div className="mb-3">
                    <strong>Mô tả chi tiết:</strong>
                    <p className="mt-1">{order.return_request.return_description}</p>
                  </div>
                )}
                {order.return_request.requested_at && (
                  <div className="mb-3">
                    <strong>Ngày yêu cầu:</strong>
                    <p className="mt-1">{formatDate(order.return_request.requested_at)}</p>
                  </div>
                )}
                {order.return_request.status && (
                  <div>
                    <strong>Trạng thái:</strong>
                    <Badge
                      bg={
                        order.return_request.status === 'approved' ? 'success' :
                        order.return_request.status === 'rejected' ? 'danger' :
                        'warning'
                      }
                      className="ms-2"
                    >
                      {order.return_request.status === 'approved' ? 'Đã duyệt' :
                       order.return_request.status === 'rejected' ? 'Đã từ chối' :
                       'Đang chờ xử lý'}
                    </Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Tổng thanh toán */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Tổng tiền hàng</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Tổng tiền hàng:</span>
                <span className="fw-bold">{formatPrice(order.summary?.subtotal || 0)}</span>
              </div>
              {order.summary?.voucher_discount > 0 && (
                <div className="d-flex justify-content-between mb-3 text-success">
                  <span>Giảm giá voucher:</span>
                  <span className="fw-bold">-{formatPrice(order.summary.voucher_discount)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-3">
                <span>Phí vận chuyển:</span>
                <span className="fw-bold">
                  {order.summary?.shipping_fee > 0
                    ? formatPrice(order.summary.shipping_fee)
                    : 'Miễn phí'}
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Thành tiền:</strong>
                <strong className="text-danger fs-4">
                  {formatPrice(order.summary?.total || 0)}
                </strong>
              </div>
            </Card.Body>
          </Card>

          {/* Phương thức thanh toán */}
          <Card className="mb-4">
            <Card.Header className="bg-warning bg-opacity-10">
              <h6 className="mb-0 fw-bold">Phương thức Thanh toán</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                {order.payment_id?.name || 'Thanh toán khi nhận hàng'}
              </div>
              {order.payment_id?.name && order.payment_id.name.toLowerCase().includes('cod') && (
                <Alert variant="warning" className="mb-0 mt-2 py-2">
                  <small>
                    Vui lòng thanh toán {formatPrice(order.summary?.total || 0)} khi nhận hàng.
                  </small>
                </Alert>
              )}
            </Card.Body>
          </Card>


          {/* Nút hủy đơn hàng */}
          {order.status === 'pending' && (
            <Card className="mt-4">
              <Card.Body>
                <Button
                  variant="danger"
                  className="w-100"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <BsXCircle className="me-2" />
                      Hủy đơn hàng
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal đánh giá */}
      {rateItem && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setRateItem(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Đánh giá sản phẩm</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRateItem(null)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>{rateItem.product_info?.name || 'Sản phẩm'}</strong>
                </div>
                <div className="mb-3">
                  <label className="form-label">Số sao:</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setRateStars(star)}
                      >
                        {star <= rateStars ? (
                          <BsStarFill size={30} color="#ffc107" />
                        ) : (
                          <BsStar size={30} color="#ccc" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setRateItem(null)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleRateProduct(rateItem)}
                  disabled={ratingLoading}
                >
                  {ratingLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi đánh giá'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default OrderDetail;

