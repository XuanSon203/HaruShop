import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Image,
  Badge,
  Form,
  Alert,
  Table,
  Button,
} from "react-bootstrap";
import {
  BsCartPlus,
  BsChevronLeft,
  BsChevronRight,
  BsCashCoin,
} from "react-icons/bs";
import BackToPage from "../../../../components/button/BackToPage";
import { useNotification } from "../../../../components/nofication/Nofication";
function FoodDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(-1); // -1 = thumbnail
  const [loading, setLoading] = useState(false);
  const [food, setFood] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const { addNotification } = useNotification();
  const [submittingReview, setSubmittingReview] = useState(false);
  const API_BASE = `http://${window.location.hostname}:8080`;

  useEffect(() => {
    const fetchFood = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/foods/${id}`);
        const data = await res.json();
        if (!res.ok) addNotification("Tải sản phẩm thất bại","danger");

      

        setFood({
          images: [],
          price: 0,
          originalPrice: 0,
          inStock: true,
          rating: 0,
          is_featured: false,
          ...data.food,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  if (loading) {
    return (
      <Container className="my-5">
        <div>Đang tải sản phẩm...</div>
      </Container>
    );
  }

  if (!food) {
    return (
      <Container className="my-5">
        <Alert variant="danger">Không tìm thấy sản phẩm!</Alert>
      </Container>
    );
  }

  const basePrice = Number(food.price || 0);

  const formatInt = (val) => {
    const n = Number(val || 0);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0";
  };

  const formatCurrency = (val) =>
    `${Number(val || 0).toLocaleString("vi-VN")}₫`;

  const getDiscountInfo = (product) => {
    const productPrice = Number(product?.price || 0);
    const discount = product?.discount_id;
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
  const discountInfo = getDiscountInfo(food);

  const handleAddToCart = async (item, qty) => {
    // Debug: Log food object to see what data is available
    const { finalPrice, discountPercent, hasDiscount } = getDiscountInfo(item);

    // Kiểm tra số lượng trước khi thêm vào giỏ
    const soldNow = Number(((item?.sold ?? item?.sold_count) || 0));
    const remaining = Math.max(0, Number(item?.quantity || 0) - soldNow);
    if (qty > remaining) {
      addNotification(`Số lượng vượt quá tồn kho (${remaining})`, "danger");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/cart/addCart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // gửi cookie lên server
        body: JSON.stringify({
          product_id: item._id,
          category_id: food.category_id, // Use food.category_id instead of item.category_id
          quantity: qty,
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
      // Gửi sao lên endpoint đánh giá; yêu cầu đã đăng nhập và đã mua
      const res = await fetch(`${API_BASE}/orders/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: id,
          category_id: (food?.category_id?._id || food?.category_id),
          stars: selectedRating,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi đánh giá");
      }
      // Cập nhật ngay UI theo server trả về (rating trung bình và tổng lượt)
      setFood((prev) => ({
        ...prev,
        rating: data.rating,
        reviewCount: data.reviewCount,
      }));
      // Optional: refetch sản phẩm để đồng bộ tuyệt đối
      try {
        const ref = await fetch(`${API_BASE}/foods/${id}`);
        if (ref.ok) {
          const json = await ref.json();
          setFood((prev) => ({ ...prev, ...json.food }));
        }
      } catch {}

      // Reset form tối thiểu
      e.target.reset();
      setSelectedRating(0);
      addNotification("Cảm ơn bạn đã đánh giá!", "success");
    } catch (err) {
      // Nếu server không cho (chưa mua), vẫn có thể hiển thị phép tính tạm thời cho UX nếu muốn
      addNotification(err.message || "Gửi đánh giá thất bại", "danger");
    } finally {
      setSubmittingReview(false);
    }
  };
const remainingStock = Math.max(0, Number(food?.quantity || 0) - Number(((food?.sold ?? food?.sold_count) || 0)));
const isOutOfStock = remainingStock <= 0;
  const mainImage =
    selectedImage === -1
      ? `${API_BASE}/uploads/products/foods/${food.thumbnail}`
      : food.images && food.images[selectedImage]
      ? `${API_BASE}/uploads/products/foods/${food.images[selectedImage]}`
      : `${API_BASE}/uploads/products/foods/${food.thumbnail}`;

  return (
    <Container className="my-5">
      <Row className="g-4">
        {/* Cột ảnh */}
        <Col md={6}>
          <div style={{ position: "relative" }}>
            <Image
              src={mainImage}
              alt={food.name}
              fluid
              rounded
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
              onError={(e) => (e.target.src = "/images/no-image.png")}
            />
            {/* Nút điều hướng ảnh */}
            <Button
              variant="light"
              style={{
                position: "absolute",
                top: "50%",
                left: "10px",
                transform: "translateY(-50%)",
                opacity: 0.8,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              onClick={() => {
                if (selectedImage === -1)
                  setSelectedImage(food.images.length - 1);
                else if (selectedImage === 0) setSelectedImage(-1);
                else setSelectedImage(selectedImage - 1);
              }}
            >
              <BsChevronLeft />
            </Button>
            <Button
              variant="light"
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                opacity: 0.8,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              onClick={() => {
                if (selectedImage === -1) setSelectedImage(0);
                else if (selectedImage === food.images.length - 1)
                  setSelectedImage(-1);
                else setSelectedImage(selectedImage + 1);
              }}
            >
              <BsChevronRight />
            </Button>
          </div>

          {/* Thumbnail */}
          <div className="d-flex gap-2 flex-wrap mt-3">
            {/* Thumbnail chính */}
            <Image
              src={`${API_BASE}/uploads/products/foods/${food.thumbnail}`}
              alt="thumbnail"
              thumbnail
              style={{
                cursor: "pointer",
                width: "80px",
                height: "80px",
                objectFit: "cover",
                border:
                  selectedImage === -1
                    ? "3px solid #007bff"
                    : "1px solid #dee2e6",
              }}
              onClick={() => setSelectedImage(-1)}
              onError={(e) => (e.target.src = "/images/no-image.png")}
            />

            {/* Các ảnh phụ */}
            {food.images &&
              food.images.length > 0 &&
              food.images.map((img, index) => (
                <Image
                  key={index}
                  src={`${API_BASE}/uploads/products/foods/${img}`}
                  alt={`thumb-${index}`}
                  thumbnail
                  style={{
                    cursor: "pointer",
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    border:
                      selectedImage === index
                        ? "3px solid #007bff"
                        : "1px solid #dee2e6",
                  }}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => (e.target.src = "/images/no-image.png")}
                />
              ))}
          </div>
        </Col>

        {/* Cột thông tin */}
        <Col md={6}>
          <div className="mb-3">
            {food.isNew && (
              <Badge bg="success" className="me-2">
                Mới
              </Badge>
            )}
            {food.is_featured && (
              <Badge bg="danger" className="me-2">
                Hot
              </Badge>
            )}
          </div>

          <h2 className="mb-3">{food.name}</h2>

          {/* Rating */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="d-flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(Number(food?.rating || 0)) ? "text-warning" : "text-muted"}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-muted">
                {Number(food?.rating || 0).toFixed(1)} • {Number(food?.reviewCount || 0)} lượt đánh giá
              </span>
            </div>
          </div>

          {/* Giá */}
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

          {/* Bỏ nút chọn voucher theo yêu cầu */}

          {/* Số lượng */}
          <div className="mb-4">
            <Form.Label>Số lượng</Form.Label>
            <div className="d-flex align-items-center justify-content-between">
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
                  max={food?.quantity || 0}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxQuantity = food?.quantity || 0;
                    const newQuantity = Math.min(Math.max(1, value), maxQuantity);
                    setQuantity(newQuantity);
                    
                    if (value > maxQuantity) {
                      addNotification(`Số lượng tối đa là ${maxQuantity}`, "warning");
                    }
                  }}
                  className="border-0 text-center"
                  style={{ width: '60px' }}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.min(q + 1, food?.quantity || 0))}
                  disabled={quantity >= (food?.quantity || 0)}
                >
                  +
                </Button>
              </div>
              <div className="ms-3 text-end">
                <div className="text-muted">
                  Số lượng tồn: <strong>{formatInt(Math.max(0, Number(food.quantity || 0) - Number(((food.sold ?? food.sold_count) || 0))))}</strong>
                </div>
                <div className="text-muted">
                  Đã bán: <strong>{formatInt(food.sold ?? food.sold_count)}</strong>
                </div>
              </div>
            </div>
          </div>

     <div className="d-grid gap-3 mb-4">
  <div className="d-flex gap-2 justify-content-center">

    <Button
      variant="outline-primary"
      className="flex-fill"
      disabled={isOutOfStock}
      onClick={() => !isOutOfStock && handleAddToCart(food, quantity)}
    >
      <BsCartPlus className="me-2" />
      {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
    </Button>

    <Button
      variant="outline-info"
      className="flex-fill"
      disabled={isOutOfStock}
      onClick={() => !isOutOfStock && handleAddToCart(food, quantity)}
    >
      <BsCashCoin className="me-2" />
      {isOutOfStock ? "Hết hàng" : "Mua ngay"}
    </Button>

  </div>
</div>
          {/* Mô tả sản phẩm */}
          {food.description && (
            <div className="mt-4">
              <h5>Mô tả sản phẩm</h5>
              <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                {food.description}
              </p>
            </div>
          )}

          {/* Thông số kỹ thuật */}
          <div className="mt-4">
            <h5>Thông số kỹ thuật</h5>
            <Table bordered size="sm">
              <tbody>
                <tr>
                  <td>Trọng lượng</td>
                  <td>
                    {food.weight} {food.unit}
                  </td>
                </tr>
                {food.size && (
                  <tr>
                    <td>Kích thước</td>
                    <td>{food.size}</td>
                  </tr>
                )}
                {food.manufacture_date && (
                  <tr>
                    <td>Ngày sản xuất</td>
                    <td>
                      {new Date(food.manufacture_date).toLocaleDateString()}
                    </td>
                  </tr>
                )}
                {food.expiry_date && (
                  <tr>
                    <td>Hạn sử dụng</td>
                    <td>{new Date(food.expiry_date).toLocaleDateString()}</td>
                  </tr>
                )}
                {food.origin && (
                  <tr>
                    <td>Xuất xứ</td>
                    <td>{food.origin}</td>
                  </tr>
                )}
                {food.brand && (
                  <tr>
                    <td>Thương hiệu</td>
                    <td>{food.brand}</td>
                  </tr>
                )}
                {food.ingredients && (
                  <tr>
                    <td>Thành phần</td>
                    <td>{food.ingredients}</td>
                  </tr>
                )}
                <tr>
                  <td>Đánh giá</td>
                  <td
                    style={{
                      color: food.rating >= 4 ? "green" : "black",
                      fontWeight: food.rating >= 4 ? "bold" : "normal",
                    }}
                  >
                    {food.rating}
                  </td>
                </tr>
                <tr>
                  <td>Sản phẩm nổi bật</td>
                  <td style={{ color: food.is_featured ? "#ffc107" : "black" }}>
                    {food.is_featured ? "Có" : "Không"}
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Form đánh giá */}
      <Row className="mt-5">
        <Col>
          <h4 className="mb-4">Viết đánh giá của bạn</h4>
          <div className="card">
            <div className="card-body">
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
                          className="text-muted"
                          style={{ fontSize: "24px", cursor: "pointer" }}
                          onClick={() => setSelectedRating(star)}
                        >
                          {star <= (selectedRating || 0) ? "★" : "☆"}
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
                  <Button variant="primary" type="submit" disabled={submittingReview}>
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </Col>
      </Row>

      {/* Phần đánh giá khách hàng */}
      <Row className="mt-5">
        <Col>
          <h4 className="mb-4">Đánh giá từ khách hàng</h4>

          {/* Thống kê đánh giá */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="text-center p-3 border rounded">
                <h3 className="text-warning mb-1">4.8</h3>
                <div className="d-flex justify-content-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-warning">
                      ★
                    </span>
                  ))}
                </div>
                <small className="text-muted">Dựa trên 156 đánh giá</small>
              </div>
            </div>
            <div className="col-md-8">
              <div className="p-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="d-flex align-items-center mb-2">
                    <span className="me-2">{rating}★</span>
                    <div className="flex-grow-1 me-2">
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-muted small">
                      {Math.floor(Math.random() * 50)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Danh sách đánh giá */}
          <div className="row">
            {[
              {
                id: 1,
                user: "Nguyễn Văn A",
                rating: 5,
                date: "2024-01-15",
                comment:
                  "Sản phẩm chất lượng rất tốt, thú cưng nhà mình rất thích! Giao hàng nhanh, đóng gói cẩn thận.",
                verified: true,
              },
              {
                id: 2,
                user: "Trần Thị B",
                rating: 4,
                date: "2024-01-10",
                comment:
                  "Sản phẩm đẹp và bền, đáng mua. Chỉ hơi đắt một chút nhưng chất lượng tốt.",
                verified: true,
              },
              {
                id: 3,
                user: "Lê Văn C",
                rating: 5,
                date: "2024-01-05",
                comment:
                  "Giao hàng nhanh, sản phẩm chất lượng cao! Sẽ mua lại lần sau.",
                verified: false,
              },
              {
                id: 4,
                user: "Phạm Thị D",
                rating: 4,
                date: "2024-01-01",
                comment:
                  "Sản phẩm tốt, thú cưng ăn ngon miệng. Đóng gói đẹp, giao hàng đúng hẹn.",
                verified: true,
              },
            ].map((review) => (
              <div key={review.id} className="col-12 mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">
                          {review.user}
                          {review.verified && (
                            <Badge bg="success" className="ms-2" size="sm">
                              Đã mua
                            </Badge>
                          )}
                        </h6>
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
                                ★
                              </span>
                            ))}
                          </div>
                          <small className="text-muted">{review.date}</small>
                        </div>
                      </div>
                    </div>
                    <p className="mb-0">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nút xem thêm đánh giá */}
          <div className="text-center mt-4">
            <Button variant="outline-primary">Xem thêm đánh giá</Button>
          </div>
        </Col>
      </Row>

      {/* Đã bỏ modal chọn voucher */}

      <BackToPage label="Trở về" variant="outline-dark" className="mt-4" />
    </Container>
  );
}

export default FoodDetail;
