import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { BsCartPlus } from "react-icons/bs";
import { useNotification } from "../../../../components/nofication/Nofication";
import RatingStars from "../../../../components/common/RatingStars";
import ProductFilter from "../../../../components/Filter/ProductFilter";

function FoodItem() {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "newest",
  });
  const location = useLocation();
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const page = parseInt(searchParams.get("page") || "1", 10);
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");

  useEffect(() => {
    const listFood = async () => {
      try {
        setLoading(true);
        setError("");
        let url = `${API_BASE}/foods?page=${page}`;
        if (categoryId) {
          url += `&categoryId=${categoryId}`;
        }
        const res = await fetch(url, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Tải sản phẩm thất bại");
        setFoods(Array.isArray(data?.foods) ? data.foods : []);
      } catch (e) {
        setError(e.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };
    listFood();
  }, [page, categoryId]);

  // Filter và sort foods
  useEffect(() => {
    let filtered = [...foods];

    // Không lọc bỏ sản phẩm hết hàng, chỉ disable nút thêm vào giỏ
    // Để đảm bảo hiển thị đủ số lượng sản phẩm

    // Filter theo tên
    if (filters.search) {
      filtered = filtered.filter((food) =>
        food.name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter theo giá (sử dụng giá sau voucher nếu có, nếu không thì dùng giá gốc)
    if (filters.minPrice) {
      filtered = filtered.filter((food) => {
        const finalPrice = getFinalPrice(food);
        return finalPrice >= Number(filters.minPrice);
      });
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((food) => {
        const finalPrice = getFinalPrice(food);
        return finalPrice <= Number(filters.maxPrice);
      });
    }

    // Sort - Ưu tiên sản phẩm nổi bật và mới trước
    filtered.sort((a, b) => {
      // Kiểm tra sản phẩm mới (hỗ trợ cả isNew và is_New)
      const aIsNew = a.isNew || a.is_New || false;
      const bIsNew = b.isNew || b.is_New || false;
      
      // Ưu tiên sản phẩm nổi bật (is_featured) và mới (isNew/is_New)
      const aPriority = (a.is_featured ? 2 : 0) + (aIsNew ? 1 : 0);
      const bPriority = (b.is_featured ? 2 : 0) + (bIsNew ? 1 : 0);
      
      // Nếu có sự khác biệt về độ ưu tiên, sắp xếp theo độ ưu tiên
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Nếu cùng độ ưu tiên, sắp xếp theo filter được chọn
      switch (filters.sortBy) {
        case "price_asc":
          return getFinalPrice(a) - getFinalPrice(b);
        case "price_desc":
          return getFinalPrice(b) - getFinalPrice(a);
        case "sold_count":
          return b.sold_count - a.sold_count;
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredFoods(filtered);
    // Reset display count khi filteredFoods thay đổi
    // Bắt đầu với 10 sản phẩm (2 hàng, mỗi hàng 5 sản phẩm) hoặc ít hơn nếu không đủ
    setDisplayCount(Math.min(10, filtered.length));
  }, [foods, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "newest",
    });
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => {
      // Thêm 5 sản phẩm mới mỗi lần click "Xem thêm"
      // Đảm bảo không vượt quá tổng số sản phẩm có sẵn
      return Math.min(prev + 5, filteredFoods.length);
    });
  };

  const handleCollapse = () => {
    setDisplayCount(10);
  };

  // Lấy danh sách sản phẩm để hiển thị
  // Hiển thị chính xác số lượng theo displayCount, không tự động fill
  let displayedFoods = filteredFoods.slice(0, displayCount);
  
  // Tính hasMore dựa trên displayCount
  const hasMore = filteredFoods.length > displayCount;
  // Chỉ hiển thị nút "Thu gọn" khi đã click "Xem thêm" (displayCount > 10)
  const canCollapse = displayCount > 10;

  const getFoodStockInfo = (product) => {
    const stock = Number(product?.quantity ?? 0);
    const sold = Number(product?.sold ?? product?.sold_count ?? 0);
    const remainingStock = Math.max(0, stock - sold);
    return {
      stock,
      sold,
      remainingStock,
      isOutOfStock: remainingStock <= 0,
    };
  };

  // Tính giá sau khi áp dụng voucher (nếu có)
  const getFinalPrice = (product) => {
    const basePrice = Number(product?.price || 0);
    
    // Kiểm tra và tính giảm giá
    if (product.discount_id && product.discount_id.value && product.discount_id.status === "active") {
      const discountValue = product.discount_id.value;
      const discountType = product.discount_id.type;
      
      if (discountType === "percent") {
        return basePrice * (1 - discountValue / 100);
      } else if (discountType === "amount") {
        return Math.max(0, basePrice - discountValue);
      }
    }
    
    // Nếu không có voucher, trả về giá gốc
    return basePrice;
  };

  const handleAddToCart = async (item) => {
    try {
      const { remainingStock } = getFoodStockInfo(item);
      if (remainingStock <= 0) {
        addNotification("Sản phẩm đã hết hàng", "warning");
        return;
      }

      // Tính giá cuối cùng (có giảm giá nếu có)
      const basePrice = Number(item.price || 0);
      let finalPrice = basePrice;
      let discountPercent = 0;
      
      // Kiểm tra và tính giảm giá
      if (item.discount_id && item.discount_id.value && item.discount_id.status === "active") {
        const discountValue = item.discount_id.value;
        const discountType = item.discount_id.type;
        
        if (discountType === "percent") {
          finalPrice = basePrice * (1 - discountValue / 100);
          discountPercent = discountValue;
        } else if (discountType === "amount") {
          finalPrice = Math.max(0, basePrice - discountValue);
          discountPercent = (discountValue / basePrice) * 100;
        }
      }

      const response = await fetch(`${API_BASE}/cart/addCart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: item._id,
          quantity: 1,
          category_id: item.category_id,
          applied_discount: item.discount_id && item.discount_id.value && item.discount_id.status === "active" ? true : false,
          discount_percent: discountPercent,
          price_after_discount: finalPrice,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        addNotification(
          "Lỗi: " + (data.message || "Không thể thêm sản phẩm vào giỏ hàng"),
          "danger"
        );
        return;
      }

      addNotification("Đã thêm sản phẩm vào giỏ hàng thành công!", "success");

      // Trigger cart update event for Header
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      addNotification("Có lỗi xảy ra, vui lòng thử lại sau!", "danger");
    }
  };
  return (
    <div>
      <style>{`
        @media (min-width: 992px) {
          .products-row {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 1.5rem;
          }
          .product-col-lg {
            flex: 0 0 calc(20% - 1.2rem);
            min-width: calc(20% - 1.2rem);
            max-width: calc(20% - 1.2rem);
          }
        }
      `}</style>
      {/* Bộ lọc sản phẩm */}
      <ProductFilter
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {loading && <div>Đang tải sản phẩm...</div>}
      {error && <div className="text-danger">{error}</div>}

      {/* Hiển thị số lượng kết quả */}
      {!loading && !error && (
        <div className="mb-3">
          <small className="text-muted">
            Hiển thị {displayedFoods.length} trong tổng số {filteredFoods.length} sản
            phẩm {filteredFoods.length !== foods.length && `(từ ${foods.length} sản phẩm)`}
          </small>
        </div>
      )}

      <Row className="g-4 products-row">
        {displayedFoods.map((item, index) => {
          const stockInfo = getFoodStockInfo(item);
          const isOutOfStock = stockInfo.isOutOfStock;
          return (
          <Col 
            key={item._id} 
            xs={12} 
            sm={6} 
            md={4}
            className="product-col-lg"
          >
            <Card
              className="h-100 border-0 animate-fade-in"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                borderRadius: "20px",
                border: "1px solid #e5e7eb",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                animationDelay: `${index * 0.1}s`,
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                e.currentTarget.style.borderColor = "#f2760a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div style={{ position: "relative", overflow: "hidden", width: "100%", aspectRatio: "4 / 3" }}>
                <Card.Img
                  variant="top"
                  src={`${API_BASE}/uploads/products/foods/${item.thumbnail}`}
                  alt={item.name || "Food"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%)",
                    transition: "all 0.3s ease",
                  }}
                />
                {/* Badge nổi bật */}
                {item?.is_featured && (
                  <Badge
                    className="position-absolute"
                    style={{
                      top: 12,
                      left: 12,
                      background:
                        "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                      border: "2px solid white",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "50px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 5,
                    }}
                  >
                    ⭐ Nổi bật
                  </Badge>
                )}
                {/* Badge mới */}
                {(item?.isNew || item?.is_New) && (
                  <Badge
                    className="position-absolute"
                    style={{
                      top: item?.is_featured ? 60 : 12,
                      left: 12,
                      background:
                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      border: "2px solid white",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "50px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 5,
                    }}
                  >
                    ✨ Mới
                  </Badge>
                )}
                {/* Badge giảm giá - góc phải */}
                {item.discount_id && item.discount_id.value && item.discount_id.status === "active" && (
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
                      const discountValue = item.discount_id.value;
                      const discountType = item.discount_id.type;
                      if (discountType === "percent") {
                        return `-${discountValue}%`;
                      } else if (discountType === "amount") {
                        return `-${discountValue.toLocaleString("vi-VN")}₫`;
                      }
                      return "Giảm giá";
                    })()}
                  </Badge>
                )}
                {isOutOfStock && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(160deg, rgba(15,23,42,0.8), rgba(15,23,42,0.65))",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                      gap: 6,
                      pointerEvents: "none",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>Hết hàng</span>
                    <small style={{ fontWeight: 500, opacity: 0.85 }}>
                      Sẽ quay lại sớm
                    </small>
                  </div>
                )}
              </div>

              <Card.Body className="d-flex flex-column p-3">
                <Card.Title as="h6" className="mb-2">
                  <Link
                    to={`/foods/${item._id}`}
                    className="text-decoration-none fw-bold"
                    style={{
                      color: isOutOfStock ? "#9ca3af" : "#1f2937",
                      fontSize: "1rem",
                      lineHeight: "1.3",
                      transition: "color 0.3s ease",
                      pointerEvents: isOutOfStock ? "none" : "auto",
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) e.target.style.color = "#f2760a";
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) e.target.style.color = "#1f2937";
                    }}
                  >
                    {item.name || "Sản phẩm"}
                  </Link>
                </Card.Title>
                {/* Rating */}
                <div className="mb-2">
                  <RatingStars
                    rating={item?.rating || 0}
                    reviewCount={item?.reviewCount || 0}
                    className="mb-0"
                  />
                </div>

                {/* Giá và số lượt bán - cùng một dòng */}
                {typeof item?.price === "number" && (
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      {/* Hiển thị giá gốc và giá sau giảm giá */}
                      {item.discount_id && item.discount_id.value && item.discount_id.status === "active" ? (
                        <div>
                          {/* Giá gốc (gạch ngang) */}
                          <div 
                            className="text-muted text-decoration-line-through small mb-0"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {item.price.toLocaleString("vi-VN")}₫
                          </div>
                          {/* Giá sau giảm giá */}
                          <div
                            className="fw-bold"
                            style={{
                              color: "#1f2937",
                              fontSize: "1.1rem",
                              background:
                                "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          >
                            {(() => {
                              const discountValue = item.discount_id.value;
                              const discountType = item.discount_id.type;
                              let finalPrice = item.price;
                              
                              if (discountType === "percent") {
                                finalPrice = item.price * (1 - discountValue / 100);
                              } else if (discountType === "amount") {
                                finalPrice = Math.max(0, item.price - discountValue);
                              }
                              
                              return finalPrice.toLocaleString("vi-VN") + "₫";
                            })()}
                          </div>
                        </div>
                      ) : (
                        /* Giá thường (không có giảm giá) */
                        <div
                          className="fw-bold"
                          style={{
                            color: "#1f2937",
                            fontSize: "1.1rem",
                            background:
                              "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {item.price.toLocaleString("vi-VN")}₫
                        </div>
                      )}
                    </div>
                    {/* Số lượt bán */}
                    {item?.sold_count > 0 && (
                      <div className="text-muted small text-end">
                        <div style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                          Đã bán
                        </div>
                        <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                          {item.sold_count.toLocaleString("vi-VN")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Nút thêm vào giỏ hàng */}
                <div className="mt-auto">
                  {isOutOfStock && (
                    <div className="text-danger small mb-2">
                      Sản phẩm đã hết hàng
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-100 fw-semibold py-2"
                    onClick={() => handleAddToCart(item)}
                    disabled={isOutOfStock}
                    style={{
                      background:
                        isOutOfStock
                          ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                          : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow:
                        isOutOfStock
                          ? "none"
                          : "0 4px 14px 0 rgba(14, 165, 233, 0.4)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 6px 20px 0 rgba(14, 165, 233, 0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 4px 14px 0 rgba(14, 165, 233, 0.4)";
                      }
                    }}
                  >
                    <BsCartPlus className="me-2" />
                    {isOutOfStock ? "Đã hết hàng" : "Thêm vào giỏ"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )})}
        {!filteredFoods.length && !loading && !error && (
          <div
            className="text-center py-5"
            style={{
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: "20px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🍽️</div>
            <h4 className="text-muted mb-3">
              {foods.length > 0
                ? "Không tìm thấy sản phẩm phù hợp"
                : "Chưa có sản phẩm"}
            </h4>
            <p className="text-muted">
              {foods.length > 0
                ? "Hãy thử điều chỉnh bộ lọc để tìm sản phẩm khác"
                : "Sản phẩm sẽ được cập nhật sớm nhất"}
            </p>
          </div>
        )}
      </Row>

      {/* Nút Xem thêm và Thu gọn */}
      {((hasMore || canCollapse) && !loading && !error) && (
        <div className="text-center mt-4 d-flex gap-3 justify-content-center flex-wrap">
          {canCollapse && (
            <Button
              variant="outline-secondary"
              onClick={handleCollapse}
              className="px-4 py-2"
              style={{
                background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontWeight: "600",
                boxShadow: "0 4px 14px 0 rgba(107, 114, 128, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px 0 rgba(107, 114, 128, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 14px 0 rgba(107, 114, 128, 0.4)";
              }}
            >
              Thu gọn
            </Button>
          )}
          {hasMore && (
            <Button
              variant="outline-primary"
              onClick={handleLoadMore}
              className="px-5 py-2"
              style={{
                background: "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontWeight: "600",
                boxShadow: "0 4px 14px 0 rgba(242, 118, 10, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px 0 rgba(242, 118, 10, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 14px 0 rgba(242, 118, 10, 0.4)";
              }}
            >
              Xem thêm ({filteredFoods.length - displayCount} sản phẩm)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FoodItem;
