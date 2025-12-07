import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { BsStar, BsStarFill, BsImage, BsX } from "react-icons/bs";

function RatingModal({
  show,
  onHide,
  orderId,
  existingRating,
  onRatingSubmit,
}) {
  const [score, setScore] = useState(existingRating?.score || 0);
  const [comment, setComment] = useState(existingRating?.comment || "");
  const [images, setImages] = useState(existingRating?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (score === 0) {
      setError("Vui lòng chọn điểm đánh giá");
      return;
    }

    if (score < 1 || score > 5) {
      setError("Điểm đánh giá phải từ 1 đến 5 sao");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `http://localhost:8080/orderservices/rating/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            score,
            comment,
            images,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        throw new Error(
          "Server trả về dữ liệu không hợp lệ. Vui lòng thử lại."
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra khi đánh giá");
      }

      if (data.rating) {
        onRatingSubmit(data.rating);
        onHide();
      } else {
        throw new Error("Không nhận được dữ liệu đánh giá từ server");
      }
    } catch (err) {
      console.error("Rating submit error:", err);
      setError(err.message || "Có lỗi xảy ra khi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length + images.length > 5) {
      setError("Chỉ có thể tải lên tối đa 5 hình ảnh");
      return;
    }

    setError(""); // Clear previous errors

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit before compression
        setError("Kích thước file không được vượt quá 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Chỉ được phép tải lên file hình ảnh");
        return;
      }

      try {
        // Compress image before adding to state
        const compressedImage = await compressImage(file, 800, 0.7);
        setImages((prev) => [...prev, compressedImage]);
      } catch (err) {
        console.error("Image compression error:", err);
        setError("Có lỗi khi xử lý hình ảnh: " + err.message);
        return;
      }
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        className="btn btn-link p-0 me-1"
        onClick={() => setScore(i + 1)}
        style={{ border: "none", background: "none" }}
      >
        {i < score ? (
          <BsStarFill size={32} className="text-warning" />
        ) : (
          <BsStar size={32} className="text-muted" />
        )}
      </button>
    ));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <BsStar className="me-2 text-warning" />
          {existingRating ? "Cập nhật đánh giá" : "Đánh giá dịch vụ"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="text-center mb-4">
            <h6 className="mb-3">Bạn hài lòng với dịch vụ này như thế nào?</h6>
            <div className="d-flex justify-content-center">{renderStars()}</div>
            {score > 0 && (
              <p className="mt-2 text-muted">
                {score === 1 && "Rất không hài lòng"}
                {score === 2 && "Không hài lòng"}
                {score === 3 && "Bình thường"}
                {score === 4 && "Hài lòng"}
                {score === 5 && "Rất hài lòng"}
              </p>
            )}
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Nhận xét của bạn (tùy chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {comment.length}/500 ký tự
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Hình ảnh (tùy chọn)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={images.length >= 5}
            />
            <Form.Text className="text-muted">
              Tối đa 5 hình ảnh, mỗi hình không quá 10MB (sẽ được nén tự động)
            </Form.Text>
          </Form.Group>

          {images.length > 0 && (
            <div className="mb-3">
              <h6>Hình ảnh đã chọn:</h6>
              <Row className="g-2">
                {images.map((image, index) => (
                  <Col key={index} xs={6} md={4}>
                    <div className="position-relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="img-fluid rounded"
                        style={{
                          height: "100px",
                          objectFit: "cover",
                          width: "100%",
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1 p-1"
                        onClick={() => removeImage(index)}
                        style={{ borderRadius: "50%" }}
                      >
                        <BsX size={12} />
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || score === 0}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Đang xử lý...
            </>
          ) : existingRating ? (
            "Cập nhật đánh giá"
          ) : (
            "Gửi đánh giá"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RatingModal;
