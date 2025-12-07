import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { BsCalendar, BsStarFill, BsArrowClockwise } from "react-icons/bs";
import { Link } from "react-router-dom";
import RatingStars from "../../../components/common/RatingStars";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false); // để hiển thị loading
  const [error, setError] = useState(null);
const API_BASE = `http://${window.location.hostname}:8080`;
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/services?t=${Date.now()}`, {
        credentials: "include",
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        // Kiểm tra cấu trúc response từ API mới
        if (data.success && data.services) {
          setServices(data.services);
        } else if (data.data) {
          setServices(data.data);
        } else if (Array.isArray(data)) {
          setServices(data);
        } else {
          setServices([]);
        }
      } else {
        setError("Không tải được dịch vụ.");
      }
    } catch (err) {
      console.error("Fetch services error:", err);
      setError("Lỗi server, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const renderRating = (rating) => {
    return (
      <div className="d-flex align-items-center">
        <BsStarFill className="text-warning me-1" />
        <span className="small">{rating}</span>
      </div>
    );
  };

  if (loading)
    return <div className="text-center my-5">Đang tải dịch vụ...</div>;
  if (error) return <div className="text-center my-5 text-danger">{error}</div>;

  return (
    <Container fluid className="my-5 px-4">
      <div className="text-center mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div></div>
          <h2 
            className="fw-bold mb-0"
            style={{ 
              color: '#1f2937',
              fontSize: '2.5rem',
              background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Dịch vụ thú cưng
          </h2>
          <Button
            variant="outline-primary"
            onClick={fetchServices}
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            <BsArrowClockwise size={16} />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Chăm sóc thú cưng của bạn với các dịch vụ chuyên nghiệp và tận tâm
        </p>
      </div>
      
      <Row className="g-4">
        {services.length > 0 ? (
          services.map((service, index) => (
            <Col key={service._id || index} xs={12} sm={6} md={4} lg={3}>
              <Card 
                className="h-100 border-0 animate-fade-in"
                style={{
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <Card.Img
                    variant="top"
                    src={service.image ? `${API_BASE}${service.image}` : "https://via.placeholder.com/800x400?text=No+Image"}
                    alt={service.serviceName || "Service"}
                    style={{ 
                      height: 180, 
                      objectFit: "cover",
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://via.placeholder.com/800x400?text=No+Image";
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
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

                  <Badge
                    className="position-absolute"
                    style={{ 
                      top: 12, 
                      left: 12,
                      background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
                      border: '2px solid white',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '50px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 5
                    }}
                  >
                    Dịch vụ
                  </Badge>
                  {/* Badge giảm giá - góc phải */}
                  {service.discount_id && service.discount_id.value && service.discount_id.status === "active" && (
                    <Badge
                      className="position-absolute"
                      style={{
                        top: 12,
                        right: 12,
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        border: "2px solid white",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "50px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        zIndex: 5,
                      }}
                    >
                      {(() => {
                        const discountValue = service.discount_id.value;
                        const discountType = service.discount_id.type;
                        if (discountType === "percent") {
                          return `-${discountValue}%`;
                        } else if (discountType === "amount") {
                          return `-${discountValue.toLocaleString("vi-VN")}₫`;
                        }
                        return "Giảm giá";
                      })()}
                    </Badge>
                  )}
                  {service.isHot && (
                    <Badge
                      className="position-absolute"
                      style={{ 
                        top: service.discount_id && service.discount_id.value && service.discount_id.status === "active" ? 60 : 12, 
                        right: 12,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: '2px solid white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '50px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 5
                      }}
                    >
                       Hot
                    </Badge>
                  )}
                </div>
                
                <Card.Body className="d-flex flex-column p-3">
                  <Card.Title as="h6" className="mb-2">
                    <Link
                      to={`/services/${service.slug || service._id}`}
                      className="text-decoration-none fw-bold"
                      style={{ 
                        color: '#1f2937',
                        fontSize: '1rem',
                        lineHeight: '1.3',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#f2760a'}
                      onMouseLeave={(e) => e.target.style.color = '#1f2937'}
                    >
                      {service.serviceName}
                    </Link>
                  </Card.Title>

                  {/* Rating */}
                  <div className="mb-2">
                    <RatingStars
                      rating={service?.rating || 0}
                      reviewCount={service?.reviewCount || 0}
                      className="mb-0"
                    />
                  </div>

                  {/* Giá và số lượt bán - cùng một dòng */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      {service.discount_id && service.discount_id.value && service.discount_id.status === "active" ? (
                        <div>
                          <div 
                            className="text-muted text-decoration-line-through small mb-0"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {Number(service.price || 0).toLocaleString("vi-VN")}₫
                          </div>
                          <div
                            className="fw-bold text-danger"
                            style={{ fontSize: '1.1rem' }}
                          >
                            {(() => {
                              const discountValue = service.discount_id.value;
                              const discountType = service.discount_id.type;
                              let finalPrice = Number(service.price || 0);
                              
                              if (discountType === "percent") {
                                finalPrice = finalPrice * (1 - discountValue / 100);
                              } else if (discountType === "amount") {
                                finalPrice = Math.max(0, finalPrice - discountValue);
                              }
                              
                              return finalPrice.toLocaleString("vi-VN") + "₫";
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-danger fw-bold" style={{ fontSize: '1.1rem' }}>
                          {service.price ? service.price.toLocaleString("vi-VN") + "₫" : "Liên hệ"}
                        </div>
                      )}
                    </div>
                    {/* Số lượt bán */}
                    {service?.sold_count > 0 && (
                      <div className="text-muted small text-end">
                        <div style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                          Đã bán
                        </div>
                        <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                          {service.sold_count.toLocaleString("vi-VN")}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/services/${service.slug || service._id}`}
                    className="btn btn-warning text-white mt-auto btn-sm"
                  >
                    <BsCalendar className="me-2" />
                    Đặt lịch
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="text-center py-5">
              <h4 className="text-muted">Chưa có dịch vụ nào</h4>
              <p className="text-muted">Vui lòng quay lại sau</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Services;
