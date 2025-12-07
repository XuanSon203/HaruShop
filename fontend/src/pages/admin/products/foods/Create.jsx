import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image, Row, Col } from "react-bootstrap";
import { useNotification } from "../../../../components/nofication/Nofication";
function CreateFood({ show, handleClose, initialData, onSuccess, onError }) {
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
    rating: 0,
    status: "active",
    is_featured: false,
    is_New: false,
    sold_count: 0,
    thumbnail: "",
    thumbnailFile: null,
    oldImages: [],
    newImages: [],
  });
  const API_BASE = `http://${window.location.hostname}:8080`;
  const { addNotification } = useNotification();
  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const isEdit = Boolean(initialData);
  const [listCategories, setListCategories] = useState([]);
  const [listShippings, setListShippings] = useState([]);

  useEffect(() => {
    if (isEdit) {
      setFormData({
        ...formData,
        ...initialData,
        thumbnailFile: null,
        newImages: [],
      });
      setPreviewThumbnail(initialData.thumbnail || null);
      setPreviewImages(initialData.oldImages || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);
  useEffect(() => {
    fetch(`${API_BASE}/admin/category`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setListCategories(
            data.categories.filter((c) => c.status === "active")
          );
        }
      })
      .catch((err) => console.error("Lỗi khi lấy danh mục:", err));
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
  const handleChange = (e) => {
    const { name, value, multiple, selectedOptions } = e.target;

    if (multiple) {
      const values = Array.from(selectedOptions, (option) => option.value);
      setFormData({ ...formData, [name]: values });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnailFile: file });
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      newImages: [...formData.newImages, ...files],
    });
    setPreviewImages([
      ...previewImages,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemovePreviewImage = (index) => {
    const updatedImages = previewImages.filter((_, i) => i !== index);
    const updatedFiles = formData.newImages.filter((_, i) => i !== index);
    setPreviewImages(updatedImages);
    setFormData({ ...formData, newImages: updatedFiles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- 1. Validate dữ liệu trước ---
    if (!formData.name.trim()) {
      addNotification("Vui lòng nhập tên món ăn!", "warning");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      addNotification("Giá phải lớn hơn 0!", "warning");
      return;
    }

    if (Number(formData.quantity) < 0) {
      addNotification("Số lượng không được nhỏ hơn 0!", "warning");
      return;
    }

    if (formData.manufacture_date && formData.expiry_date) {
      const mfg = new Date(formData.manufacture_date);
      const exp = new Date(formData.expiry_date);
      if (mfg >= exp) {
        addNotification("Ngày hết hạn phải lớn hơn ngày sản xuất!", "warning");
        return;
      }
    }

    if (
      formData.thumbnailFile &&
      !formData.thumbnailFile.type.startsWith("image/")
    ) {
      addNotification("Ảnh đại diện không hợp lệ!", "warning");
      return;
    }

    for (const img of formData.newImages) {
      if (!img.type.startsWith("image/")) {
        addNotification("Một trong các ảnh phụ không hợp lệ!");
        return;
      }
    }

    // --- 2. Gửi dữ liệu ---

    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (
        key !== "thumbnailFile" &&
        key !== "newImages" &&
        key !== "oldImages"
      ) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (formData.thumbnailFile) {
      formDataToSend.append("thumbnail", formData.thumbnailFile);
    }

    formData.newImages.forEach((file) => {
      formDataToSend.append("images", file);
    });
    const res = await fetch(`${API_BASE}/admin/products/food/add`, {
      method: "POST",
      body: formDataToSend,
      credentials: "include",
    });

    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (res.ok && (data?.success ?? true)) {
      addNotification(data?.message || "Thêm món ăn thành công!");

      setFormData({
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
        rating: 0,
        status: "active",
        is_featured: false,
        is_New: false,
        sold_count: 0,
        thumbnail: "",
        thumbnailFile: null,
        oldImages: [],
        newImages: [],
      });
      setPreviewThumbnail(null);
      setPreviewImages([]);

      handleClose();
    } else {
      addNotification(" Lỗi khi thêm món ăn:", data?.message || res.statusText);
      addNotification(data?.message || "Có lỗi xảy ra khi thêm món ăn!");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">
          {isEdit ? "Chỉnh sửa món ăn" : "Thêm món ăn"}
        </Modal.Title>
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

          {/* Trạng thái + Ảnh */}
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
                  {listCategories.length > 0 &&
                    listCategories
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      is_featured: checked,
                      // Tự động bỏ chọn is_New nếu chọn is_featured
                      is_New: checked ? false : formData.is_New
                    });
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Sẩn phẩm mới "
                  name="is_New"
                  checked={!!formData.is_New}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      is_New: checked,
                      // Tự động bỏ chọn is_featured nếu chọn is_New
                      is_featured: checked ? false : formData.is_featured
                    });
                  }}
                />
              </Form.Group>
            </Col>
          </Row>

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
                alt="Preview"
                fluid
                className="mt-2 rounded border"
                style={{ maxHeight: "150px" }}
              />
            )}
          </Form.Group>
          {/* Ảnh phụ */}
          <Form.Group className="mb-3">
            <Form.Label>Ảnh phụ</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImagesChange}
            />
            <div className="d-flex flex-wrap mt-2">
              {previewImages.map((img, index) => (
                <div key={index} className="position-relative me-2 mb-2">
                  <Image
                    src={img}
                    alt="preview"
                    thumbnail
                    style={{ width: "100px" }}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0"
                    onClick={() => handleRemovePreviewImage(index)}
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
          {isEdit ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CreateFood;

