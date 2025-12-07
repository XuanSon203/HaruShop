import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function EditService({ show, handleClose, service, onSuccess }) {
  const [formData, setFormData] = useState({
    id: "",
    serviceName: "",
    description: "",
    price: "",
    image: null, // ✅ thêm field image
  });
const { addNotification } = useNotification();
  const [preview, setPreview] = useState(null); // ✅ preview ảnh
  const [errors, setErrors] = useState({});
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    if (service) {
      setFormData({
        id: service._id || "",
        serviceName: service.serviceName || "",
        description: service.description || "",
        price: service.price || "",
        image: null,
      });

      // Nếu service đã có ảnh → hiển thị preview ảnh cũ
      setPreview(
        service.image ? `${API_BASE}${service.image}` : null
      );
    }
  }, [service]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Xử lý chọn ảnh mới
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file)); // preview ảnh mới
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!formData.serviceName.trim())
     addNotification("Tên dịch vụ không được để trống","warning");
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0)
    addNotification("Giá không hợp lệ ","warning");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append("serviceName", formData.serviceName);
      dataToSend.append("description", formData.description);
      dataToSend.append("price", formData.price);

      if (formData.image) {
        dataToSend.append("image", formData.image);
      }

      const res = await fetch(
        `${API_BASE}/admin/services/update/${formData.id}`,
        {
          method: "PUT",
          body: dataToSend,
           credentials: "include"
        }
      );

      if (!res.ok) {
        const err = await res.json();
       addNotification("Cập nhật thất bại","danger");
      }

      addNotification("Cập nhật thành công!","success");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
     addNotification("Có lỗi xảy ra !","danger");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Sửa dịch vụ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Tên dịch vụ */}
          <Form.Group className="mb-3">
            <Form.Label>Tên dịch vụ</Form.Label>
            <Form.Control
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              isInvalid={!!errors.serviceName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.serviceName}
            </Form.Control.Feedback>
          </Form.Group>

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

          {/* Giá */}
          <Form.Group className="mb-3">
            <Form.Label>Giá</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              isInvalid={!!errors.price}
            />
            <Form.Control.Feedback type="invalid">
              {errors.price}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Hình ảnh */}
          <Form.Group className="mb-3">
            <Form.Label>Hình ảnh</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </Form.Group>

          <Button type="submit" variant="primary">
            Lưu thay đổi
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditService;
