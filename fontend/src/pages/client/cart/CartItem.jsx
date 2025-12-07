import React, { useMemo, useState } from "react";
import { Row, Col, Image, Button, Badge } from "react-bootstrap";
import { BsPlus, BsDash, BsTrash } from "react-icons/bs";
import { Link } from "react-router-dom";

const CartItem = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onToggleSelect,
  availableToAdd = 0,
  totalQuantity = 0,
  soldCount = 0,
}) => {
  const product = item?.product || {};
  const originalPrice = Number(item?.price_original || product?.price || 0);
  const discountedPrice = Number(item?.price_after_discount || 0);
  const hasDiscountApplied = (item?.applied_discount || discountedPrice > 0) && discountedPrice !== originalPrice;
  const unitPrice = hasDiscountApplied ? discountedPrice : originalPrice;
  const total = unitPrice * (item?.quantity || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const API_BASE = `http://${window.location.hostname}:8080`;
  const isDecreaseDisabled = (item?.quantity || 0) <= 1;
  const imageSrc = useMemo(() => {
    if (product.thumbnail) {
      return `${API_BASE}/uploads/products/${product.slug ? "accessory" : "foods"}/${product.thumbnail}`;
    }
    return `${API_BASE}/${product.image || ""}`;
  }, [product.thumbnail, product.slug, product.image]);

  const canIncrease = Number(availableToAdd) > 0;
  const formatQuantity = (value) =>
    Number(value || 0).toLocaleString("vi-VN");

  return (
    <Row className="gx-4 gy-3 py-4 align-items-center">
      <Col xs={12} md={5}>
        <div className="d-flex align-items-center gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={item?.selected !== false}
              onChange={() => onToggleSelect?.()}
              aria-label="Chọn sản phẩm"
              style={{
                width: '1.2rem',
                height: '1.2rem',
                borderColor: '#f2760a',
                accentColor: '#f2760a'
              }}
            />
          </div>
          <Link
            to={
              item.type === "accessories"
                ? `/accessories/${product.slug || item.product_id}`
                : `/foods/${product._id || item.product_id}`
            }
            style={{ textDecoration: 'none' }}
          >
            <div 
              className="ci-thumb" 
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 12, 
                overflow: "hidden",
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {!imageLoaded && (
                <div 
                  className="ci-skeleton" 
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
              )}
              <Image
                src={imageSrc}
                alt={product.name || "product"}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover", 
                  display: imageLoaded ? "block" : "none" 
                }}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackTried === "final") return;
                  if (product?.thumbnail && img.dataset.fallbackTried !== "alt-folder") {
                    const isAccessory = img.src.includes("/accessory/");
                    img.src = `${API_BASE}/uploads/products/${isAccessory ? "foods" : "accessory"}/${product.thumbnail}`;
                    img.dataset.fallbackTried = "alt-folder";
                    return;
                  }
                  img.src = `${API_BASE}/${product?.image || ""}`;
                  img.dataset.fallbackTried = "final";
                }}
              />
            </div>
          </Link>
          <div className="ms-1 flex-grow-1 d-flex align-items-center">
            <h6 className="mb-2 fw-bold" style={{ color: '#1f2937' }}>
              <Link
                to={
                  product.slug
                    ? `/accessories/${product.slug}`
                    : `/foods/${product._id || item.product_id}`
                }
                className="text-decoration-none"
                style={{ 
                  color: '#1f2937',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#f2760a'}
                onMouseLeave={(e) => e.target.style.color = '#1f2937'}
                title={`Xem chi tiết ${product.name || "sản phẩm"}`}
              >
                {product.name || "Sản phẩm"}
              </Link>
            </h6>
          </div>
        </div>
      </Col>
      <Col xs={6} md={2} className="ci-col-price text-center d-flex flex-column align-items-center">
        <div className="text-muted small d-md-none mb-1">Đơn giá</div>
        {hasDiscountApplied ? (
          <div>
            {originalPrice > 0 && (
              <div className="text-muted text-decoration-line-through small mb-1">
                {originalPrice.toLocaleString("vi-VN")}₫
              </div>
            )}
            <div className="fw-bold text-danger fs-6">
              {discountedPrice.toLocaleString("vi-VN")}₫
            </div>
            <Badge 
              bg="success" 
              className="small mt-1"
              style={{ borderRadius: '8px' }}
            >
              Giảm giá
            </Badge>
          </div>
        ) : (
          <div className="fw-bold fs-6" style={{ color: '#1f2937' }}>
            {originalPrice.toLocaleString("vi-VN")}₫
          </div>
        )}
        <div className="text-muted small mt-2">
          <div>
            Tồn kho:{" "}
            <strong>{formatQuantity(totalQuantity)}</strong>
          </div>
          <div>
            Đã bán:{" "}
            <strong>{formatQuantity(soldCount)}</strong>
          </div>
        </div>
      </Col>
      
      <Col xs={12} md={2} className="ci-col-qty d-flex justify-content-center">
        <div className="d-inline-flex align-items-center gap-2">
          <Button
            variant="light"
            className="border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: 40, 
              height: 40,
              background: isDecreaseDisabled 
                ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                : 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
              color: isDecreaseDisabled ? '#9ca3af' : 'white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => !isDecreaseDisabled && onDecrease?.()}
            disabled={isDecreaseDisabled}
            aria-label="Giảm số lượng"
            onMouseEnter={(e) => {
              if (!isDecreaseDisabled) {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 4px 8px rgba(242, 118, 10, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDecreaseDisabled) {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <BsDash size={18} />
          </Button>
          
          <div 
            className="px-3 py-2 border-0 rounded-3 fw-bold"
            style={{ 
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              color: '#1f2937',
              minWidth: '50px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {item?.quantity || 0}
          </div>
          
          <Button
            variant="light"
            className="border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: 40, 
              height: 40,
              background: canIncrease 
                ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
              color: canIncrease ? 'white' : '#e5e7eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              cursor: canIncrease ? 'pointer' : 'not-allowed',
              opacity: canIncrease ? 1 : 0.6,
              pointerEvents: canIncrease ? 'auto' : 'auto'
            }}
            onClick={() => onIncrease?.()}
            aria-label="Tăng số lượng"
            onMouseEnter={(e) => {
              if (canIncrease) {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 4px 8px rgba(14, 165, 233, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
          >
            <BsPlus size={18} />
          </Button>
        </div>
      </Col>
      <Col xs={6} md={2} className="ci-col-amount d-flex justify-content-end align-items-center">
        <div 
          className="fw-bold fs-5"
          style={{ 
            color: '#1f2937',
            background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          <span className="ci-amount">{total.toLocaleString("vi-VN")}₫</span>
        </div>
      </Col>
      
      <Col xs={6} md={1} className="d-flex justify-content-end align-items-center">
        <Button
          variant="light"
          className="border-0 rounded-circle d-inline-flex align-items-center justify-content-center"
          style={{ 
            width: 36, 
            height: 36,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onClick={() => onRemove?.(item.product_id, item.type)}
          aria-label="Xóa sản phẩm"
          title="Xóa sản phẩm"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          <BsTrash size={16} />
        </Button>
      </Col>
    </Row>
  );
};

export default CartItem;
