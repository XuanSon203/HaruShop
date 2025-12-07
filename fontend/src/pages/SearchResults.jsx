import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = `http://${window.location.hostname}:8080`;
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Search function
  const performSearch = async (query, type = 'all') => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        type: type,
        limit: 50
      });

      const res = await fetch(`${API_BASE}/search?${params}`, {
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        let results = data.results || [];
        
        // Sort results
        if (sortBy === 'price-low') {
          results.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
          results.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'rating') {
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        
        setSearchResults(results);
      } else {
        setError(data.message || 'Có lỗi xảy ra khi tìm kiếm');
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('Không thể kết nối đến server');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${filterType}`);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${newFilter}`);
    }
  };

  // Perform search when component mounts or query changes
  useEffect(() => {
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    
    if (query) {
      setSearchQuery(query);
      setFilterType(type);
      performSearch(query, type);
    }
  }, [searchParams]);

  // Get type icon and label
  const getTypeInfo = (type) => {
    switch (type) {
      case 'food':
        return { icon: '🍽️', label: 'Đồ ăn', color: '#10b981' };
      case 'accessory':
        return { icon: '🎾', label: 'Phụ kiện', color: '#f59e0b' };
      case 'service':
        return { icon: '🛠️', label: 'Dịch vụ', color: '#8b5cf6' };
      default:
        return { icon: '📦', label: 'Sản phẩm', color: '#6b7280' };
    }
  };

  // Group results by type
  const groupedResults = searchResults.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <Container className="py-4">
      {/* Search Header */}
      <div className="mb-4">
        <h2 className="mb-3">
          {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tìm kiếm sản phẩm'}
        </h2>
        
        {/* Search Form */}
        <Form onSubmit={handleSearchSubmit} className="mb-3">
          <Row>
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm đồ ăn, phụ kiện, dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control-lg"
                />
                <Button type="submit" variant="primary" size="lg">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="form-select-lg"
              >
                <option value="all">Tất cả</option>
                <option value="food">Đồ ăn</option>
                <option value="accessory">Phụ kiện</option>
                <option value="service">Dịch vụ</option>
              </Form.Select>
            </Col>
          </Row>
        </Form>

        {/* Sort Options */}
        {searchResults.length > 0 && (
          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="text-muted">Sắp xếp theo:</span>
            <Form.Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="relevance">Độ liên quan</option>
              <option value="price-low">Giá thấp đến cao</option>
              <option value="price-high">Giá cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </Form.Select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Đang tìm kiếm...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* No Results */}
      {!isLoading && !error && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-5">
          <h4 className="text-muted">Không tìm thấy kết quả</h4>
          <p className="text-muted">Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && !error && searchResults.length > 0 && (
        <div>
          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-muted">
              Tìm thấy {searchResults.length} kết quả cho "{searchQuery}"
            </p>
          </div>

          {/* Grouped Results */}
          {Object.entries(groupedResults).map(([type, items]) => {
            const typeInfo = getTypeInfo(type);
            return (
              <div key={type} className="mb-5">
                <h4 className="mb-3 d-flex align-items-center gap-2">
                  <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                  {typeInfo.label}
                  <Badge bg="secondary">{items.length}</Badge>
                </h4>
                
                <Row>
                  {items.map((item, index) => (
                    <Col key={`${item.type}-${item._id}-${index}`} md={6} lg={4} className="mb-4">
                      <Card 
                        className="h-100 shadow-sm"
                        style={{ 
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                        onClick={() => {
                          // Handle different URL patterns
                          if (item.type === 'food') {
                            navigate(`/foods/${item._id}`);
                          } else if (item.type === 'accessory') {
                            navigate(`/accessories/${item.slug || item._id}`);
                          } else if (item.type === 'service') {
                            navigate(`/services/${item.slug || item._id}`);
                          } else {
                            navigate(item.url);
                          }
                        }}
                      >
                        <div className="position-relative">
                          {item.thumbnail ? (
                            <Card.Img
                              variant="top"
                              src={
                                item.type === 'service' 
                                  ? (item.thumbnail.startsWith('http')
                                      ? item.thumbnail
                                      : (item.thumbnail.startsWith('/')
                                          ? `${API_BASE}${item.thumbnail}`
                                          : `${API_BASE}/uploads/services/${item.thumbnail}`))
                                  : item.type === 'food'
                                    ? `${API_BASE}/uploads/products/foods/${item.thumbnail}`
                                    : item.type === 'accessory'
                                      ? `${API_BASE}/uploads/products/accessory/${item.thumbnail}`
                                      : item.thumbnail
                              }
                              style={{ height: '200px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                height: '200px',
                                backgroundColor: '#f8f9fa',
                                fontSize: '3rem'
                              }}
                            >
                              {typeInfo.icon}
                            </div>
                          )}
                          <Badge
                            className="position-absolute top-0 end-0 m-2"
                            style={{ backgroundColor: typeInfo.color }}
                          >
                            {typeInfo.label}
                          </Badge>
                        </div>
                        
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="h6 mb-2" style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.name}
                          </Card.Title>
                          
                          <div className="mt-auto">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="h5 text-success mb-0">
                                {item.price?.toLocaleString('vi-VN')}₫
                              </span>
                              {item.rating > 0 && (
                                <div className="d-flex align-items-center gap-1">
                                  <span className="text-warning">⭐</span>
                                  <span className="small">{item.rating}</span>
                                </div>
                              )}
                            </div>
                            
                            {item.sold_count > 0 && (
                              <small className="text-muted">
                                Đã bán: {item.sold_count}
                              </small>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

export default SearchResults;
