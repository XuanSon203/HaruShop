import React, { useState } from "react";
import { Card, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { FaSearch, FaTimes } from "react-icons/fa";

function ProductFilter({ onFilterChange, onClearFilters }) {
  const [filters, setFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "newest" // newest, price_asc, price_desc, sold_count
  });

  const handleInputChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "newest"
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = 
    filters.search || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.sortBy !== "newest";

  return (
    <>
      <Card className="mb-4 product-filter-no-hover">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Bộ lọc sản phẩm
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end">
            {/* Tìm kiếm theo tên */}
            <Col md={4} className="mb-3">
              <Form.Label>Tìm kiếm theo tên</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên sản phẩm..."
                  value={filters.search}
                  onChange={(e) => handleInputChange("search", e.target.value)}
                  className="no-hover-effect"
                />
              </InputGroup>
            </Col>

            {/* Sắp xếp */}
            <Col md={3} className="mb-3">
              <Form.Label>Sắp xếp theo</Form.Label>
              <Form.Select
                value={filters.sortBy}
                onChange={(e) => handleInputChange("sortBy", e.target.value)}
                className="no-hover-effect"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
                <option value="sold_count">Bán chạy nhất</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
              </Form.Select>
            </Col>

            {/* Lọc theo giá */}
            <Col md={2} className="mb-3">
              <Form.Label>Giá từ (₫)</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleInputChange("minPrice", e.target.value)}
                min="0"
                className="no-hover-effect"
              />
            </Col>

            <Col md={2} className="mb-3">
              <Form.Label>Đến (₫)</Form.Label>
              <Form.Control
                type="number"
                placeholder="1000000"
                value={filters.maxPrice}
                onChange={(e) => handleInputChange("maxPrice", e.target.value)}
                min="0"
                className="no-hover-effect"
              />
            </Col>

            {/* Nút xóa bộ lọc */}
            <Col md={1} className="mb-3">
              {hasActiveFilters && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-100 no-hover-effect-btn"
                  title="Xóa bộ lọc"
                >
                  <FaTimes />
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <style>{`
        .product-filter-no-hover:hover {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }
        .product-filter-no-hover .no-hover-effect:hover,
        .product-filter-no-hover .no-hover-effect:focus {
          border-color: #ced4da !important;
          box-shadow: none !important;
          outline: none !important;
          transition: none !important;
        }
        .product-filter-no-hover .no-hover-effect-btn:hover,
        .product-filter-no-hover .no-hover-effect-btn:focus,
        .product-filter-no-hover .no-hover-effect-btn:active {
          transform: none !important;
          background-color: #6c757d !important;
          border-color: #6c757d !important;
          color: #fff !important;
          box-shadow: none !important;
          transition: none !important;
        }
        .product-filter-no-hover .input-group-text:hover {
          background-color: #e9ecef !important;
          border-color: #ced4da !important;
        }
      `}</style>
    </>
  );
}

export default ProductFilter;
