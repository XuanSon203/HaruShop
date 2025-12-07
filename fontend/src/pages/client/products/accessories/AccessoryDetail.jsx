import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Alert,
  Carousel,
} from "react-bootstrap";
import {
  BsStarFill,
  BsStarHalf,
  BsCartPlus,
  BsHeart,
  BsShare,
} from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import BackToPage from "../../../../components/button/BackToPage";
import { useNotification } from "../../../../components/nofication/Nofication";
function AccessoryDetail() {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ name: "", content: "" });
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addNotification } = useNotification();
  const API_BASE = `http://${window.location.hostname}:8080`;
  // Gom thumbnail + images để hiển thị đầy đủ bộ ảnh
  const galleryImages = (product?.thumbnail ? [product.thumbnail] : [])
    .concat(product?.images || [])
    .filter(Boolean);
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        if (!slug) {
          console.error("Slug is undefined");
          return;
        }
        const res = await fetch(`${API_BASE}/accessories/${slug}`);
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.message || "Tải chi tiết phụ kiện thất bại");
        setProduct(data.data);
        setSelectedImage(0);
      } catch (e) {
        // eslint-disable-next-line no-console
        addNotification("Không tìm thấy phụ kiện");
      }
    };
    if (slug) fetchDetail();
  }, [slug]);

  const reviews = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      rating: 5,
      date: "2024-01-15",
      comment: "Chất lượng rất tốt, thú cưng nhà mình rất thích!",
    },
    {
      id: 2,
      user: "Trần Thị B",
      rating: 4,
      date: "2024-01-10",
      comment: "Sản phẩm đẹp và bền, đáng mua.",
    },
    {
      id: 3,
      user: "Lê Văn C",
      rating: 5,
      date: "2024-01-05",
      comment: "Giao hàng nhanh, sản phẩm chất lượng cao!",
    },
  ];

  const renderRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++)
      stars.push(<BsStarFill key={`full-${i}`} className="text-warning" />);
    if (hasHalf) stars.push(<BsStarHalf key="half" className="text-warning" />);
    return stars;
  };

  const formatCurrency = (val) =>
    `${Number(val || 0).toLocaleString("vi-VN")}₫`;

  const getDiscountInfo = (productData) => {
    const productPrice = Number(productData?.price || 0);
    const discount = productData?.discount_id;
    let finalPrice = productPrice;
    let discountPercent = 0;
    let discountAmount = 0;
    let discountLabel = "";
    let hasDiscount = false;

    if (
      discount &&
      discount.status === "active" &&
      Number(discount.value || 0) > 0
    ) {
      const discountValue = Number(discount.value);
      if (discount.type === "percent") {
        discountPercent = discountValue;
        discountAmount = (productPrice * discountValue) / 100;
        finalPrice = Math.max(0, productPrice - discountAmount);
        discountLabel = `-${discountValue}%`;
      } else if (discount.type === "amount") {
        discountAmount = discountValue;
        finalPrice = Math.max(0, productPrice - discountValue);
        discountPercent =
          productPrice > 0
            ? Math.round((discountValue / productPrice) * 100)
            : 0;
        discountLabel = `-${discountValue.toLocaleString("vi-VN")}₫`;
      }
      hasDiscount = finalPrice !== productPrice;
    }

    return {
      basePrice: productPrice,
      finalPrice,
      discountPercent,
      discountAmount,
      discountLabel,
      hasDiscount,
      discountCode: discount?.code || "",
      discountName: discount?.name || "",
      discountType: discount?.type || "",
    };
  };

  const handleAddToCart = async (item, qty) => {
    // Kiểm tra số lượng trước khi thêm vào giỏ
    if (qty > (item?.quantity || 0)) {
      addNotification(
        `Số lượng vượt quá tồn kho (${item?.quantity || 0})`,
        "danger"
      );
      return;
    }

    try {
      const { finalPrice, discountPercent, hasDiscount } =
        getDiscountInfo(item);

      const response = await fetch(`${API_BASE}/cart/addCart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // gửi cookie lên server
        body: JSON.stringify({
          product_id: item._id,
          quantity: qty,
          category_id: item.category_id,
          applied_discount: hasDiscount,
          discount_id: hasDiscount
            ? item?.discount_id?._id || item?.discount_id
            : null,
          discount_percent: discountPercent,
          price_after_discount: Number(finalPrice || 0),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        addNotification("Không thể thêm sản phẩm vào giỏ hàng!", "danger");
        return;
      }
      addNotification("Đã thêm sản phẩm vào giỏ hàng!", "success");

      // Trigger cart update event for Header
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      addNotification(" Có lỗi xảy ra, vui lòng thử lại sau !");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedRating) {
      addNotification("Vui lòng chọn số sao (1-5)", "warning");
      return;
    }
    try {
      setSubmittingReview(true);
      // Gửi đánh giá lên endpoint
      const res = await fetch(`${API_BASE}/orders/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: product?._id,
          category_id: product?.category_id?._id || product?.category_id,
          rating: selectedRating,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi đánh giá");
      }
      // Cập nhật rating và reviewCount
      setProduct((prev) => ({
        ...prev,
        rating: data.rating,
        reviewCount: data.reviewCount,
      }));
      addNotification("Cảm ơn bạn đã đánh giá!", "success");
      setSelectedRating(0);
      e.target.reset();
    } catch (err) {
      addNotification(err.message || "Không thể gửi đánh giá", "danger");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <Container className="my-5">
        <BackToPage label="Trở về" variant="outline-dark" className="mt-4" />
        <div className="text-center py-5 text-muted">
          Đang tải chi tiết phụ kiện...
        </div>
      </Container>
    );
  }

  const discountInfo = getDiscountInfo(product);

  return (
    <Container className="my-5">
      {showAlert && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setShowAlert(false)}
        >
          Đã thêm phụ kiện vào giỏ hàng!
        </Alert>
      )}
      <BackToPage label="Trở về" variant="outline-dark" className="mt-4" />
      <Row>
        {/* Hình ảnh sản phẩm */}
        <Col lg={6}>
          <div className="mb-3">
            <Carousel
              activeIndex={selectedImage}
              onSelect={(i) => setSelectedImage(i)}
            >
              {(galleryImages.length ? galleryImages : [product?.image])
                .filter(Boolean)
                .map((img, index) => (
                  <Carousel.Item key={index}>
                    <img
                      className="d-block w-100 rounded"
                      src={
                        img?.startsWith("http")
                          ? img
                          : `${API_BASE}/uploads/products/accessory/${img}`
                      }
                      alt={`${product?.name || "Image"} ${index + 1}`}
                      style={{ width: "100%", height: "auto", objectFit: "contain" }}
                    />
                  </Carousel.Item>
                ))}
            </Carousel>
          </div>
          {galleryImages.length > 1 && (
            <div
              className="d-flex gap-2 mt-2 overflow-x-auto"
              style={{ maxWidth: "100%" }}
            >
              {galleryImages.map((img, index) => (
                <img
                  key={index}
                  src={
                    img?.startsWith("http")
                      ? img
                      : `${API_BASE}/uploads/products/accessory/${img}`
                  }
                  alt={`${product?.name || "Image"} ${index + 1}`}
                  className={`rounded cursor-pointer flex-shrink-0 ${
                    selectedImage === index ? "border border-primary" : "border"
                  }`}
                  style={{ width: 80, height: 80, objectFit: "cover" }}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </Col>

        {/* Thông tin sản phẩm */}
        <Col lg={6}>
          <div className="mb-3">
            {product?.isNew && (
              <Badge bg="success" className="me-2">
                Mới
              </Badge>
            )}
            {product?.isHot && (
              <Badge bg="danger" className="me-2">
                Hot
              </Badge>
            )}
            <Badge bg="secondary">
              {product?.categoryName || product?.category || "Phụ kiện"}
            </Badge>
          </div>

          <h2 className="mb-3">{product?.name || ""}</h2>

          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              {renderRating(product?.rating || 0)}
              <span className="text-muted">
                ({product?.reviewCount || 0} đánh giá)
              </span>
            </div>
          </div>

          <div className="mb-3">
            {discountInfo.hasDiscount ? (
              <>
                <div
                  className="text-muted text-decoration-line-through small mb-1"
                  style={{ fontSize: "0.95rem" }}
                >
                  {formatCurrency(discountInfo.basePrice)}
                </div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="text-danger display-6 fw-bold mb-0">
                    {formatCurrency(discountInfo.finalPrice)}
                  </span>
                  {discountInfo.discountLabel && (
                    <Badge
                      bg="danger"
                      className="px-3 py-2 fw-semibold"
                      style={{ borderRadius: "40px" }}
                    >
                      {discountInfo.discountLabel}
                    </Badge>
                  )}
                </div>
                <div className="text-success small fw-semibold mt-1">
                  Tiết kiệm: {formatCurrency(discountInfo.discountAmount)}
                </div>
                {(discountInfo.discountCode || discountInfo.discountName) && (
                  <div className="mt-3 p-3 rounded border bg-light">
                    <div className="text-muted text-uppercase small mb-1">
                      Mã giảm giá
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {discountInfo.discountCode && (
                        <span
                          className="fw-bold"
                          style={{
                            letterSpacing: "0.08em",
                            color: "#0ea5e9",
                          }}
                        >
                          {discountInfo.discountCode}
                        </span>
                      )}
                      {discountInfo.discountName && (
                        <Badge bg="warning" text="dark">
                          {discountInfo.discountName}
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted d-block mt-2">
                      Áp dụng tự động khi thêm vào giỏ hàng.
                    </small>
                  </div>
                )}
              </>
            ) : (
              <div className="d-flex align-items-center flex-wrap gap-2">
                <span className="text-danger h4 fw-bold mb-0">
                  {formatCurrency(discountInfo.finalPrice)}
                </span>
              </div>
            )}
          </div>
          {/* Số lượng + Tồn kho + Đã bán */}
          <div className="mb-4">
            <Form.Label>Số lượng</Form.Label>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center border rounded">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Form.Control
                  type="number"
                  min="1"
                  max={product?.quantity || 0}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxQuantity = product?.quantity || 0;
                    const newQuantity = Math.min(
                      Math.max(1, value),
                      maxQuantity
                    );
                    setQuantity(newQuantity);

                    if (value > maxQuantity) {
                      addNotification(
                        `Số lượng tối đa là ${maxQuantity}`,
                        "warning"
                      );
                    }
                  }}
                  className="border-0 text-center"
                  style={{ width: "60px" }}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    setQuantity((q) => Math.min(q + 1, product?.quantity || 0))
                  }
                  disabled={quantity >= (product?.quantity || 0)}
                >
                  +
                </Button>
              </div>
              <div className="d-flex align-items-center gap-4 text-muted">
                <span>
                  Tồn kho: <strong>{Math.max(0, Number(product?.quantity ?? 0) - Number(product?.sold ?? product?.sold_count ?? 0))}</strong>
                </span>
                <span>
                  Đã bán: <strong>{(product?.sold ?? product?.sold_count ?? 0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="d-grid gap-3 mb-4">
            {/* Hàng 1: Thêm vào giỏ hàng + Mua ngay */}
            <div className="d-flex gap-2 justify-content-center">
              <Button
                variant="outline-primary"
                className="flex-fill"
                onClick={() => handleAddToCart(product, quantity)}
              >
                <BsCartPlus className="me-2" />
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="outline-info"
                className="flex-fill"
                onClick={() => handleAddToCart(product, quantity)}
              >
                <BsCartPlus className="me-2" />
                Mua ngay
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h1>Mô tả về phụ kiện </h1>
            <p className="text-muted">{product?.description || ""}</p>
          </div>
          {/* Thông số kỹ thuật */}
          <Card className="mb-4">
            <Card.Header>Thông số kỹ thuật</Card.Header>
            <Card.Body>
              {Object.entries({
                "Chất liệu": product?.material,
                "Kích thước": product?.size,
                "Màu sắc": product?.color,
                "Thương hiệu": product?.brand,
                "Bảo hành": product?.warranty,
              })
                .filter(([, v]) => Boolean(v))
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="d-flex justify-content-between py-1"
                  >
                    <span className="text-muted">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              {![
                product?.material,
                product?.size,
                product?.color,
                product?.brand,
                product?.warranty,
              ].some(Boolean) && (
                <div className="text-muted">Chưa có thông số kỹ thuật</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Form đánh giá */}
      <Row className="mt-5">
        <Col>
          <h4 className="mb-4">Viết đánh giá của bạn</h4>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmitReview}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên của bạn *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Nhập tên của bạn"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Nhập email của bạn"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Đánh giá của bạn *</Form.Label>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span>1 sao</span>
                    <div className="d-flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            fontSize: "24px",
                            cursor: "pointer",
                            color: star <= (selectedRating || 0) ? "#f59e0b" : "#d1d5db",
                          }}
                          onClick={() => setSelectedRating(star)}
                        >
                          <BsStarFill />
                        </span>
                      ))}
                    </div>
                    <span>5 sao</span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tiêu đề đánh giá</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Ví dụ: Sản phẩm rất tốt!"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nội dung đánh giá *</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="comment"
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <Form.Check
                    type="checkbox"
                    name="verified"
                    label="Tôi xác nhận đánh giá này dựa trên trải nghiệm thực tế của tôi"
                    required
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submittingReview}
                    style={{
                      background: "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                      border: "none",
                    }}
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Phần đánh giá khách hàng */}
      <Row className="mt-5">
        <Col>
          <h4 className="mb-4">Đánh giá từ khách hàng</h4>

          {/* Thống kê đánh giá */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center p-3">
                <Card.Body>
                  <h3
                    className="mb-1"
                    style={{
                      color: "#f2760a",
                      fontSize: "3rem",
                      fontWeight: "bold",
                    }}
                  >
                    {Number(product?.rating || 0).toFixed(1)}
                  </h3>
                  <div className="d-flex justify-content-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{ color: "#f2760a", fontSize: "1.5rem" }}
                      >
                        <BsStarFill />
                      </span>
                    ))}
                  </div>
                  <small className="text-muted">
                    Dựa trên {product?.reviewCount || 0} đánh giá
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="p-3">
                <Card.Body>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    // Tính phần trăm cho mỗi mức sao (mock data - có thể thay bằng dữ liệu thực)
                    const percentage = Math.random() * 100;
                    const count = Math.floor(
                      ((product?.reviewCount || 0) * percentage) / 100
                    );
                    return (
                      <div
                        key={rating}
                        className="d-flex align-items-center mb-2"
                      >
                        <span className="me-2" style={{ minWidth: "30px" }}>
                          {rating}★
                        </span>
                        <div className="flex-grow-1 me-2">
                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${percentage}%`,
                                background:
                                  "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                              }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-muted small" style={{ minWidth: "40px" }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Danh sách đánh giá mẫu */}
          <div className="row">
            {reviews.map((review) => (
              <div key={review.id} className="col-12 mb-3">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">{review.user}</h6>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={
                                  star <= review.rating
                                    ? "text-warning"
                                    : "text-muted"
                                }
                              >
                                <BsStarFill />
                              </span>
                            ))}
                          </div>
                          <small className="text-muted">{review.date}</small>
                        </div>
                      </div>
                    </div>
                    <p className="mb-0">{review.comment}</p>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

          {/* Nút xem thêm đánh giá */}
          {reviews.length > 0 && (
            <div className="text-center mt-4">
              <Button
                variant="outline-primary"
                style={{
                  borderColor: "#f2760a",
                  color: "#f2760a",
                }}
              >
                Xem thêm đánh giá
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default AccessoryDetail;
