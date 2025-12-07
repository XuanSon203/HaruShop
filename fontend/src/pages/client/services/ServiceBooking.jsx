import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Modal, ListGroup } from 'react-bootstrap';
import { BsCalendar, BsClock, BsGeoAlt, BsStarFill, BsGift, BsX } from 'react-icons/bs';
import { useParams } from 'react-router-dom';
import ServiceReviews from '../../../components/ServiceReviews';
import { BsFillStarFill } from "react-icons/bs";

function ServiceBooking() {
  const { slug } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    petName: '',
    petType: '',
    petAge: '',
    serviceDate: '',
    serviceTime: '',
    notes: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = `http://${window.location.hostname}:8080`;
  const [pricing, setPricing] = useState({
    subtotal: 0,
    total: 0
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        if (!slug) return;
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/services/${slug}?t=${Date.now()}`, { 
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Không tải được chi tiết dịch vụ');
        
        // Handle different response structures
        if (data.success && data.service) {
          setService(data.service);
        } else if (data.data) {
          setService(data.data);
        } else {
          throw new Error('Dữ liệu dịch vụ không hợp lệ');
        }
      } catch (e) {
        console.error('Fetch service error:', e);
        setError(e.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Lọc các giờ còn khả dụng dựa trên ngày được chọn
  const getAvailableTimeSlots = () => {
    if (!formData.serviceDate) return timeSlots;
    
    const selectedDate = new Date(formData.serviceDate);
    const today = new Date();
    const now = new Date();
    
    // Nếu chọn ngày hôm nay, chỉ hiển thị giờ chưa trôi qua
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      return timeSlots.filter(time => {
        const [hour, minute] = time.split(':').map(Number);
        const timeInMinutes = hour * 60 + minute;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        // Chỉ ẩn các giờ đã qua
        return timeInMinutes > currentTimeInMinutes;
      });
    }
    
    // Nếu chọn ngày khác, hiển thị tất cả giờ
    return timeSlots;
  };

  const petTypes = ['Chó', 'Mèo', 'Thỏ', 'Hamster', 'Khác'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Nếu thay đổi ngày, reset giờ
    if (name === 'serviceDate') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        serviceTime: '' // Reset giờ khi thay đổi ngày
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };





  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!service?._id) {
      setError('Không tìm thấy thông tin dịch vụ');
      return;
    }

    // Kiểm tra giờ khả dụng
    if (getAvailableTimeSlots().length === 0) {
      setError('Không còn giờ khả dụng cho ngày đã chọn. Vui lòng chọn ngày khác.');
      return;
    }

    if (!formData.serviceTime) {
      setError('Vui lòng chọn giờ đặt lịch');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare the booking data
      const bookingData = {
        service_id: service._id,
        fullName: formData.name,
        phone: formData.phone,
        petName: formData.petName,
        typePet: formData.petType,
        agePet: formData.petAge,
        dateOrder: formData.serviceDate,
        hoursOrder: `${formData.serviceDate}T${formData.serviceTime}:00`,
        note: formData.notes,
      };

      const response = await fetch(`${API_BASE}/orderservices/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra khi đặt lịch');
      }

      // Success - show success message and reset form
    setShowSuccess(true);
      setFormData({
        name: '',
        phone: '',
        petName: '',
        petType: '',
        petAge: '',
        serviceDate: '',
        serviceTime: '',
        notes: '',
      });
      setPricing({
        subtotal: service?.price || 0,
        total: service?.price || 0
      });

    setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Có lỗi xảy ra khi đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++) stars.push(<BsStarFill key={`full-${i}`} className="text-warning" />);
    if (hasHalf) stars.push(<BsStarFill key="half" className="text-warning" />);
    return stars;
  };

  if (loading) return <div className="text-center my-5">Đang tải chi tiết dịch vụ...</div>;
  if (error) return <div className="text-center my-5 text-danger">{error}</div>;
  if (!service) return null;

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
           Đặt lịch dịch vụ
        </h2>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Đặt lịch dịch vụ chăm sóc thú cưng chuyên nghiệp
        </p>
      </div>

      {showSuccess && (
        <Alert 
          variant="success" 
          dismissible 
          onClose={() => setShowSuccess(false)}
          className="border-0 rounded-3 mb-4"
          style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span>✅</span>
            <span className="fw-medium">Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</span>
          </div>
        </Alert>
      )}

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

      <Row className="g-4">
        {/* Thông tin dịch vụ */}
        <Col lg={4}>
          <Card 
            className="mb-4 border-0 animate-fade-in"
            style={{
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <Card.Img
                variant="top"
                src={
                  service?.image
                    ? (service.image.startsWith('http')
                        ? service.image
                        : (service.image.startsWith('/')
                            ? `${API_BASE}${service.image}`
                            : `${API_BASE}/uploads/services/${service.image}`))
                    : 'https://via.placeholder.com/800x400?text=No+Image'
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image';
                }}
                style={{ 
                  height: 220, 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
              {/* Gradient overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%)',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <Card.Body className="p-4">
              <h5 className="mb-3 fw-bold" style={{ color: '#1f2937' }}>{service?.serviceName || service?.name}</h5>
              
              <div className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  {renderRating(service?.rating || 0)}
                  <span className="text-muted">({service?.reviewCount || 0} đánh giá)</span>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-danger h5 fw-bold">
                  {Number(service?.price || 0).toLocaleString('vi-VN')}₫
                </span>
                {service?.duration && <Badge bg="info" className="ms-2">{service.duration}</Badge>}
              </div>

              <p className="text-muted mb-3">{service?.description}</p>

              <div className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <BsGeoAlt className="text-primary" />
                  <span>{service?.location}</span>
                </div>
                <small className="text-muted">{service?.address}</small>
              </div>

              <div className="d-flex align-items-center gap-2">
                <BsClock className="text-primary" />
                <span>Thời gian làm việc: 8:00 - 18:00</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Form đặt lịch */}
        <Col lg={8}>
          <Card 
            className="border-0 animate-fade-in"
            style={{
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
            }}
          >
            <Card.Header 
              className="border-0 p-4"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: 'white',
                borderRadius: '20px 20px 0 0'
              }}
            >
              <h5 className="mb-0 fw-bold fs-4"> Đặt lịch dịch vụ</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Họ và tên *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên thú cưng *</Form.Label>
                      <Form.Control
                        type="text"
                        name="petName"
                        value={formData.petName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại thú cưng *</Form.Label>
                      <Form.Select
                        name="petType"
                        value={formData.petType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Chọn loại thú cưng</option>
                        {petTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tuổi thú cưng</Form.Label>
                      <Form.Control
                        type="text"
                        name="petAge"
                        value={formData.petAge}
                        onChange={handleInputChange}
                        placeholder="VD: 2 tuổi"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày đặt lịch *</Form.Label>
                      <Form.Control
                        type="date"
                        name="serviceDate"
                        value={formData.serviceDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giờ đặt lịch *</Form.Label>
                      <Form.Select
                        name="serviceTime"
                        value={formData.serviceTime}
                        onChange={handleInputChange}
                        required
                        disabled={getAvailableTimeSlots().length === 0}
                      >
                        <option value="">
                          {getAvailableTimeSlots().length === 0 
                            ? "Không có giờ khả dụng" 
                            : "Chọn giờ"}
                        </option>
                        {getAvailableTimeSlots().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </Form.Select>
                      {getAvailableTimeSlots().length === 0 && formData.serviceDate && (
                        <Form.Text className="text-warning">
                          <small>
                             Không còn giờ khả dụng cho ngày hôm nay. Vui lòng chọn ngày khác.
                          </small>
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>


                <Form.Group className="mb-4">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Mô tả thêm về thú cưng hoặc yêu cầu đặc biệt..."
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="fw-bold py-3"
                    disabled={loading || getAvailableTimeSlots().length === 0}
                    style={{
                      background: (loading || getAvailableTimeSlots().length === 0)
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                        : 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      boxShadow: (loading || getAvailableTimeSlots().length === 0)
                        ? '0 4px 14px 0 rgba(156, 163, 175, 0.4)'
                        : '0 4px 14px 0 rgba(242, 118, 10, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && getAvailableTimeSlots().length > 0) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px 0 rgba(242, 118, 10, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && getAvailableTimeSlots().length > 0) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 14px 0 rgba(242, 118, 10, 0.4)';
                      }
                    }}
                  >
                    <BsCalendar className="me-2" />
                    {loading 
                      ? ' Đang xử lý...' 
                      : getAvailableTimeSlots().length === 0 
                        ? ' Không có giờ khả dụng'
                        : ` Đặt lịch ngay - ${Number(pricing.total || service?.price || 0).toLocaleString('vi-VN')}₫`
                    }
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Service Reviews Section */}
      {service?._id && (
        <Row className="mt-5">
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header 
                className="border-0 p-4"
                style={{
                  background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
                  color: 'white',
                  borderRadius: '15px 15px 0 0'
                }}
              >
                <h5 className="mb-0 fw-bold"><BsFillStarFill /> Đánh giá từ khách hàng</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <ServiceReviews serviceId={service._id} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

    </Container>
  );
}

export default ServiceBooking;
