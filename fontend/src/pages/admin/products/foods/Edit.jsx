import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image, Row, Col } from "react-bootstrap";
import { useNotification } from "../../../../components/nofication/Nofication";
function EditFood({ show, handleClose, initialData, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: 0,
    category_id: "",
    description: "",
    weight: "",
    unit: "",
    manufacture_date: "",
    expiry_date: "",
    ingredients: "",
    status: "active",
    is_featured: false,
    is_New: false,
    thumbnail: "",
    thumbnailFile: null,
    oldImages: [],
    newImages: [],
  });

  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [previewOldImages, setPreviewOldImages] = useState([]);
  const [previewNewImages, setPreviewNewImages] = useState([]);
  const [listCategories, setListCategories] = useState([]);
  const [listShippings, setListShippings] = useState([]);
const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
const normalizeId = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val._id === "string") return val._id;
    if (val.$oid) return val.$oid;
    if (val._id && val._id.$oid) return val._id.$oid;
  }
  try {
    return String(val);
  } catch {
    return "";
  }
};


  useEffect(() => {
    if (show && initialData) {
      const formatDate = (d) =>
        d ? new Date(d).toISOString().slice(0, 10) : "";

      // Normalize category_id và shipping_id trước
      const normalizedCategoryId = normalizeId(initialData.category_id) || "";
      const normalizedShippingId = normalizeId(initialData.shipping_id) || "";

      setFormData((prev) => ({
        ...prev,
        name: initialData.name || "",
        price: initialData.price || "",
        quantity: initialData.quantity || 0,
        description: initialData.description || "",
        weight: initialData.weight || "",
        unit: initialData.unit || "",
        manufacture_date: formatDate(initialData.manufacture_date),
        expiry_date: formatDate(initialData.expiry_date),
        ingredients: initialData.ingredients || "",
        rating: initialData.rating || 0,
        status: initialData.status || "active",
        shipping_id: normalizedShippingId,
        category_id: normalizedCategoryId, // Đảm bảo normalize đúng
        is_New: initialData.isNew || initialData.is_New || false,
        is_featured: initialData.is_featured || false,
        thumbnailFile: null,
        newImages: [],
        oldImages: initialData.images || [],
      }));

      // Ảnh đại diện
      setPreviewThumbnail(
        initialData.thumbnail
          ? `${API_BASE}/uploads/products/foods/${initialData.thumbnail}`
          : null
      );

      // Ảnh phụ cũ
      setPreviewOldImages(
        initialData.images?.map(
          (img) => `${API_BASE}/uploads/products/foods/${img}`
        ) || []
      );
      setPreviewNewImages([]);
    }
  }, [show, initialData]);

  //  Load danh mục & giảm giá
  useEffect(() => {
    fetch(`${API_BASE}/admin/category`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setListCategories(data.categories.filter((c) => c.status === "active"));
        }
      })
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
    // shipping providers
    fetch(`${API_BASE}/admin/shipping`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setListShippings(data.items);
        }
      })
      .catch(() => {});
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Nếu chọn is_featured hoặc is_New, tự động bỏ chọn cái kia
    if (type === "checkbox" && (name === "is_featured" || name === "is_New")) {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Bỏ chọn cái kia nếu đang chọn cái này
        is_featured: name === "is_featured" ? checked : (checked ? false : prev.is_featured),
        is_New: name === "is_New" ? checked : (checked ? false : prev.is_New),
      }));
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // ✅ Thay thumbnail
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnailFile: file });
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  // ✅ Thêm ảnh phụ mới
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      newImages: [...formData.newImages, ...files],
    });
    setPreviewNewImages([
      ...previewNewImages,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  // ✅ Xoá ảnh phụ cũ
  const handleRemoveOldImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      oldImages: prev.oldImages.filter((_, i) => i !== index),
    }));
    setPreviewOldImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Xoá ảnh phụ mới
  const handleRemoveNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
    setPreviewNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Kiểm tra trùng tên
      if (formData.name && formData.name !== initialData?.name) {
        try {
          const checkRes = await fetch(
            `${API_BASE}/admin/products/food/check-name?name=${encodeURIComponent(
              formData.name.trim()
            )}`
          );
          if (checkRes.ok) {
            const check = await checkRes.json();
            if (check?.exists) {
            addNotification("Sản phẩm đã tồn tại!","warning");
              return;
            }
          }
        } catch {
          // Bỏ qua nếu API không có
        }
      }

      Object.keys(formData).forEach((key) => {
        if (!["thumbnailFile", "newImages", "oldImages"].includes(key)) {
          // Normalize category_id và shipping_id nếu là object
          if (key === 'category_id' || key === 'shipping_id') {
            const value = formData[key];
            formDataToSend.append(key, typeof value === 'object' ? (value?._id || '') : (value || ''));
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Danh sách ảnh phụ còn giữ
      formData.oldImages.forEach((img) =>
        formDataToSend.append("oldImages", img)
      );

      if (formData.thumbnailFile) {
        formDataToSend.append("thumbnail", formData.thumbnailFile);
      }

      formData.newImages.forEach((file) => {
        formDataToSend.append("images", file);
      });
      const res = await fetch(
        `${API_BASE}/admin/products/food/edit/${initialData._id}`,
        {
          method: "PUT",
          body: formDataToSend,
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
      addNotification(data?.message || "Cập nhật món ăn thành công!","success");
        handleClose();
      } else {
        addNotification(data?.message || "Có lỗi khi cập nhật món ăn!","danger");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      addNotification("Lỗi kết nối server!","danger");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa món ăn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Hàng 1: Tên, Giá, Đơn vị vận chuyển */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tên món ăn</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Giá</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Đơn vị vận chuyển</Form.Label>
                <Form.Select
                  name="shipping_id"
                  value={formData.shipping_id || ""}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {listShippings.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {typeof s.price === 'number' ? `- ${s.price.toLocaleString('vi-VN')} ₫` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Hàng 2: Số lượng, Trọng lượng, Đơn vị */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số lượng</Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Trọng lượng</Form.Label>
                <Form.Control
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Đơn vị</Form.Label>
                <Form.Control
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Mô tả */}
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Thành phần + Ngày sản xuất + HSD */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ngày sản xuất</Form.Label>
                <Form.Control
                  type="date"
                  name="manufacture_date"
                  value={formData.manufacture_date}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Hạn sử dụng</Form.Label>
                <Form.Control
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Thành phần</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Trạng thái + Danh mục */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng kinh doanh</option>
                  <option value="out_of_stock">Hết hàng</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {listCategories
                    .filter((c) => !c.parentId)
                    .map((parent) => (
                      <React.Fragment key={parent._id}>
                        <option value={parent._id}>{parent.name}</option>
                        {listCategories
                          .filter((child) => child.parentId === parent._id)
                          .map((child) => (
                            <option key={child._id} value={child._id}>
                              {"— " + child.name}
                            </option>
                          ))}
                      </React.Fragment>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          

          <Row>
            <Col md={6}>
              {/* Nổi bật */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Sản phẩm nổi bật"
                  name="is_featured"
                  checked={!!formData.is_featured}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {/* Sản phẩm mới */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Sản phẩm mới"
                  name="is_New"
                  checked={!!formData.is_New}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Ảnh đại diện */}
          <Form.Group className="mb-3">
            <Form.Label>Ảnh đại diện</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {previewThumbnail && (
              <Image
                src={previewThumbnail}
                alt="Thumbnail"
                fluid
                className="mt-2 rounded border"
                style={{ maxHeight: "150px" }}
              />
            )}
          </Form.Group>

          {/* Ảnh phụ cũ */}
          <Form.Group className="mb-3">
            <Form.Label>Ảnh phụ (cũ)</Form.Label>
            <div className="d-flex flex-wrap mt-2">
              {previewOldImages.map((img, index) => (
                <div key={index} className="position-relative me-2 mb-2">
                  <Image
                    src={img}
                    alt="old"
                    thumbnail
                    style={{ width: "100px" }}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0"
                    onClick={() => handleRemoveOldImage(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </Form.Group>

          {/* Ảnh phụ mới */}
          <Form.Group className="mb-3">
            <Form.Label>Ảnh phụ (mới)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImagesChange}
            />
            <div className="d-flex flex-wrap mt-2">
              {previewNewImages.map((img, index) => (
                <div key={index} className="position-relative me-2 mb-2">
                  <Image
                    src={img}
                    alt="new"
                    thumbnail
                    style={{ width: "100px" }}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0"
                    onClick={() => handleRemoveNewImage(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Lưu thay đổi
        </Button>
      </Modal.Footer>
      

    </Modal>
  );
}

export default EditFood;

