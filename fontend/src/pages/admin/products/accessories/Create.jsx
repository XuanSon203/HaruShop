import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Image } from "react-bootstrap";
import { useNotification } from "../../../../components/nofication/Nofication";

function CreateAccessory({ show, handleClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    category_id: "",
    shipping_id: "",
    status: "active",
    is_featured: false,
    isNew: false,
    sortOrder: "0",
    material: "",
    size: "",
    color: "",
    brand: "",
    warranty: "",
    description: "",
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  const { addNotification } = useNotification();
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shippings, setShippings] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/category`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setCategories(d.categories || []));
      fetch(`${API_BASE}/admin/shipping`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setShippings(d.items || []))
        .catch(() => {});
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Nếu chọn is_featured, tự động bỏ chọn isNew và ngược lại
    if (type === "checkbox" && (name === "is_featured" || name === "isNew")) {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
        // Bỏ chọn cái kia nếu đang chọn cái này
        is_featured: name === "is_featured" ? checked : (checked ? false : prev.is_featured),
        isNew: name === "isNew" ? checked : (checked ? false : prev.isNew),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    // Kiểm tra tên, giá, số lượng
    if (!form.name.trim()) {
      addNotification("Tên không được để trống", "warning");
      return false;
    }
    if (!form.price || Number(form.price) <= 0) {
      addNotification("Giá phải lớn hơn 0", "warning");
      return false;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      addNotification("Số lượng phải lớn hơn 0", "warning");
      return false;
    }

    // Danh mục bắt buộc
    if (!form.category_id) {
      addNotification("Vui lòng chọn danh mục cho phụ kiện này!", "warning");
      return false;
    }

    // Discount tùy chọn → không bắt buộc

    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification("Vui lòng kiểm tra lại dữ liệu nhập", "danger");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'is_featured' || k === 'isNew') {
          // Đảm bảo giá trị boolean được gửi đúng dưới dạng string
          fd.append(k, v === true || v === 'true' || v === 1 || v === '1' ? 'true' : 'false');
        } else {
          fd.append(k, v);
        }
      });
      if (thumbnail) fd.append("thumbnail", thumbnail);
      images.forEach((img) => fd.append("images", img));

      const res = await fetch(
        `${API_BASE}/admin/products/accessory/add`,
        {
          method: "POST",
          body: fd,
          credentials: "include",
        }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        addNotification(json.message || "Tạo phụ kiện thất bại", "danger");
        return;
      }

      addNotification(json.message || "Tạo phụ kiện thành công", "success");

      // Reset form và ảnh sau khi submit thành công
      setForm({
        name: "",
        price: "",
        quantity: "",
        category_id: "",
        shipping_id: "",
        status: "active",
        is_featured: false,
        isNew: false,
        sortOrder: "0",
        material: "",
        size: "",
        color: "",
        brand: "",
        warranty: "",
        description: "",
      });
      setThumbnail(null);
      setImages([]);

      handleClose && handleClose();
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      addNotification(err.message || "Lỗi tạo phụ kiện", "danger");
      onError && onError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm phụ kiện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group className="mb-2">
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label>Giá</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label>Thứ tự sắp xếp</Form.Label>
                    <Form.Control
                      type="number"
                      name="sortOrder"
                      value={form.sortOrder}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id="is_featured"
                      label="Nổi bật"
                      name="is_featured"
                      checked={form.is_featured}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id="isNew"
                      label="Sản phẩm mới"
                      name="isNew"
                      checked={form.isNew}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Chất liệu</Form.Label>
                    <Form.Control
                      name="material"
                      value={form.material}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Kích thước</Form.Label>
                    <Form.Control
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Màu sắc</Form.Label>
                    <Form.Control
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Thương hiệu</Form.Label>
                    <Form.Control
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-2">
                <Form.Label>Bảo hành</Form.Label>
                <Form.Control
                  name="warranty"
                  value={form.warranty}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả chi tiết phụ kiện..."
                />
              </Form.Group>
              {/* Danh mục + Đơn vị vận chuyển */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Đơn vị vận chuyển</Form.Label>
                    <Form.Select
                      name="shipping_id"
                      value={form.shipping_id || ""}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {shippings.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} {typeof s.price === 'number' ? `- ${s.price.toLocaleString('vi-VN')} ₫` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Ảnh đại diện</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
                {thumbnail && (
                  <Image
                    src={URL.createObjectURL(thumbnail)}
                    thumbnail
                    className="mt-2"
                  />
                )}
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Ảnh phụ</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files || []))}
                />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={URL.createObjectURL(img)}
                      thumbnail
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Đóng
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default CreateAccessory;

