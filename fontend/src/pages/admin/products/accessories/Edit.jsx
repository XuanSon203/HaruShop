import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Image } from "react-bootstrap";
import { useNotification } from "../../../../components/nofication/Nofication";
function EditAccessory({ show, handleClose, initialData, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    category_id: "",
    shipping_id: "",
    status: "active",
    is_featured: false,
    isNew: false,
    material: "",
    size: "",
    color: "",
    brand: "",
    warranty: "",
    description: "",
  });
  const API_BASE = `http://${window.location.hostname}:8080`;
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shippings, setShippings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
const { addNotification } = useNotification();
  useEffect(() => {
    if (show && initialData) {
      // Kiểm tra is_featured và isNew từ dữ liệu gốc
      // Kiểm tra nhiều cách để đảm bảo lấy đúng giá trị
      const isFeatured = initialData.is_featured === true || 
                        initialData.is_featured === 'true' || 
                        initialData.is_featured === 1 ||
                        initialData.is_featured === '1' ||
                        false;
      const isNew = initialData.isNew === true || 
                    initialData.isNew === 'true' || 
                    initialData.isNew === 1 ||
                    initialData.isNew === '1' ||
                    false;
      setForm({
        name: initialData.name || "",
        price: initialData.price || "",
        quantity: initialData.quantity || "",
        category_id: (initialData.category_id && (initialData.category_id._id || initialData.category_id)) || "",
        shipping_id: (initialData.shipping_id && (initialData.shipping_id._id || initialData.shipping_id)) || "",
        status: initialData.status || "active",
        is_featured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        material: initialData.material || "",
        size: initialData.size || "",
        color: initialData.color || "",
        brand: initialData.brand || "",
        warranty: initialData.warranty || "",
        description: initialData.description || "",
      });
      setThumbnail(null);
      setImages([]);
    }
  }, [show, initialData]);

  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/category`, {
        method: "GET",
        credentials: "include",
      })
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!initialData?._id) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'category_id' || k === 'shipping_id') {
          fd.append(k, typeof v === 'object' ? (v?._id || '') : v);
        } else if (k === 'is_featured' || k === 'isNew') {
          // Đảm bảo giá trị boolean được gửi đúng dưới dạng string
          fd.append(k, v === true || v === 'true' || v === 1 || v === '1' ? 'true' : 'false');
        } else {
          fd.append(k, v);
        }
      });
      if (thumbnail) fd.append("thumbnail", thumbnail);
      images.forEach((img) => fd.append("images", img));

      const res = await fetch(
        `${API_BASE}/admin/products/accessory/edit/${initialData._id}`,
        {
          method: "PUT",
          credentials: "include",
          body: fd,
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        addNotification("Cập nhật phụ kiện thất bại","danger");
     addNotification("Cập nhật phụ kiện thành công","success");
      handleClose && handleClose();
    } catch (err) {
      console.error(err);
      onError && onError(err.message || "Lỗi cập nhật phụ kiện");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Sửa phụ kiện</Modal.Title>
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
                  required
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
              <Row>
                <Col>
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
              <Row>
                <Col>
                  <Form.Group className="mb-2">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
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
              <Form.Group className="mb-2">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Ảnh đại diện</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
                {!thumbnail && initialData?.thumbnail && (
                  <Image
                    src={`${API_BASE}/uploads/products/accessory/${initialData.thumbnail}`}
                    thumbnail
                    className="mt-2"
                  />
                )}
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
                  {(images.length === 0
                    ? initialData?.images || []
                    : images
                  ).map((img, idx) => (
                    <Image
                      key={idx}
                      src={
                        images.length === 0
                          ? `${API_BASE}/uploads/products/accessory/${img}`
                          : URL.createObjectURL(img)
                      }
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
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EditAccessory;

