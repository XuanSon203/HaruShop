import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { BsStar, BsStarFill, BsImage, BsCalendar } from 'react-icons/bs';

function ServiceReviews({ serviceId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const REVIEWS_PER_PAGE = 6; // Hiển thị 6 đánh giá mỗi lần

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  useEffect(() => {
    if (reviews.length > 0) {
      if (showAll) {
        setDisplayedReviews(reviews);
      } else {
        setDisplayedReviews(reviews.slice(0, REVIEWS_PER_PAGE));
      }
      setHasMore(reviews.length > REVIEWS_PER_PAGE);
    }
  }, [reviews, showAll]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:8080/services/${serviceId}/reviews`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải đánh giá');
      }

      if (data.success && data.reviews) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < rating ? (
          <BsStarFill className="text-warning" size={16} />
        ) : (
          <BsStar className="text-muted" size={16} />
        )}
      </span>
    ));
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

  const handleShowMore = () => {
    setShowAll(true);
  };

  const handleShowLess = () => {
    setShowAll(false);
  };

  // Tính toán thống kê đánh giá
  const getRatingStats = () => {
    if (reviews.length === 0) return null;
    
    const totalScore = reviews.reduce((sum, review) => sum + review.score, 0);
    const averageRating = totalScore / reviews.length;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      ratingCounts[review.score]++;
    });

    return {
      average: Math.round(averageRating * 10) / 10,
      total: reviews.length,
      counts: ratingCounts
    };
  };

  const stats = getRatingStats();

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải đánh giá...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">Chưa có đánh giá nào cho dịch vụ này</p>
      </div>
    );
  }

  return (
    <div>
      {/* Thống kê đánh giá */}
      {stats && (
        <Card className="mb-4 border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={3} className="text-center">
                <div className="display-4 fw-bold text-primary">{stats.average}</div>
                <div className="d-flex justify-content-center mb-2">
                  {renderStars(Math.round(stats.average))}
                </div>
                <small className="text-muted">Trung bình từ {stats.total} đánh giá</small>
              </Col>
              <Col md={9}>
                <div className="row g-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="col-12">
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted" style={{ width: '20px' }}>{star}★</small>
                        <div className="flex-grow-1">
                          <div 
                            className="bg-warning rounded" 
                            style={{ 
                              height: '8px',
                              width: `${(stats.counts[star] / stats.total) * 100}%`,
                              transition: 'width 0.5s ease'
                            }}
                          ></div>
                        </div>
                        <small className="text-muted" style={{ width: '30px' }}>
                          {stats.counts[star]}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0">Đánh giá từ khách hàng ({reviews.length})</h5>
          {!showAll && displayedReviews.length > 0 && (
            <small className="text-muted">
              Đang hiển thị {displayedReviews.length} trong {reviews.length} đánh giá
            </small>
          )}
        </div>
        {hasMore && (
          <div className="d-flex gap-2">
            {!showAll ? (
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleShowMore}
                className="d-flex align-items-center gap-1"
                style={{
                  transition: 'all 0.3s ease',
                  borderRadius: '20px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,123,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Xem thêm ({reviews.length - REVIEWS_PER_PAGE} đánh giá)
              </Button>
            ) : (
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleShowLess}
                className="d-flex align-items-center gap-1"
                style={{
                  transition: 'all 0.3s ease',
                  borderRadius: '20px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(108,117,125,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Thu gọn
              </Button>
            )}
          </div>
        )}
      </div>
      <Row className="g-3">
        {displayedReviews.map((review, index) => (
          <Col key={index} xs={12} md={6}>
            <Card 
              className="h-100 border-0 shadow-sm"
              style={{
                animation: 'fadeInUp 0.5s ease-out',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="d-flex">
                    {renderStars(review.score)}
                  </div>
                  <span className="fw-medium">{review.score}/5</span>
                  {review.is_updated && (
                    <Badge bg="info" className="ms-2" style={{ fontSize: '0.6rem' }}>
                      Đã cập nhật
                    </Badge>
                  )}
                </div>
                
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="fw-medium">{review.customerName}</span>
                  <span className="text-muted small">
                    <BsCalendar size={12} className="me-1" />
                    {formatDate(review.rated_at)}
                  </span>
                </div>

                {review.comment && (
                  <p className="mb-2 text-muted small">{review.comment}</p>
                )}

                {review.images && review.images.length > 0 && (
                  <div className="mt-2">
                    <Row className="g-1">
                      {review.images.slice(0, 3).map((image, imgIndex) => (
                        <Col key={imgIndex} xs={4}>
                          <img
                            src={image}
                            alt={`Review ${imgIndex + 1}`}
                            className="img-fluid rounded"
                            style={{ height: '60px', objectFit: 'cover' }}
                          />
                        </Col>
                      ))}
                      {review.images.length > 3 && (
                        <Col xs={4}>
                          <div 
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{ 
                              height: '60px', 
                              background: '#f8f9fa',
                              color: '#6c757d'
                            }}
                          >
                            +{review.images.length - 3}
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default ServiceReviews;
