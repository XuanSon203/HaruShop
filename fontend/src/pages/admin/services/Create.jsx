import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function CreateService({ show, handleClose }) {
  const [formData, setFormData] = useState({
    serviceName: "",
    description: "",
    price: "",
    image: null,
  });
const { addNotification } = useNotification();
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
const API_BASE = `http://${window.location.hostname}:8080`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Validate type
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setErrors((prev) => ({ ...prev, image: "Chỉ chấp nhận file JPG/PNG" }));
        return;
      }
      // ✅ Validate size < 2MB
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Kích thước ảnh phải nhỏ hơn 2MB",
        }));
        return;
      }

      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      description: "",
      price: "",
      image: null,
    });
    setPreview(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // ✅ Validate text fields
    if (!formData.serviceName.trim())
     addNotification( "Tên dịch vụ không được để trống","warning");
    if (!formData.description.trim())
    addNotification("Mô tả không được để trống","warning");
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0)
     addNotification("Giá phải là số lớn hơn 0","warning");
    if (!formData.image) addNotification("Vui lòng chọn ảnh dịch vụ","warning");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append("serviceName", formData.serviceName);
      dataToSend.append("description", formData.description);
      dataToSend.append("price", formData.price);
      if (formData.image) dataToSend.append("image", formData.image);

      const res = await fetch(`${API_BASE}/admin/services/add`, {
        method: "POST",
        credentials: "include",
        body: dataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        // ✅ Nếu BE trả về lỗi trùng tên
        if (data.message && data.message.includes("Tên dịch vụ")) {
          setErrors((prev) => ({ ...prev, serviceName: data.message }));
          return;
        }
        throw new Error(data.message || "Có lỗi khi tạo service");
      }

      addNotification("Tạo dịch vụ thành công!","success");
      resetForm();
      handleClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Có lỗi xảy ra");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm dịch vụ</Modal.Title>
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
              placeholder="Nhập tên dịch vụ"
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
              placeholder="Nhập mô tả dịch vụ"
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Giá */}
          <Form.Group className="mb-3">
            <Form.Label>Giá</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Nhập giá dịch vụ"
              isInvalid={!!errors.price}
            />
            <Form.Control.Feedback type="invalid">
              {errors.price}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Upload ảnh */}
          <Form.Group className="mb-3">
            <Form.Label>Hình ảnh</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              isInvalid={!!errors.image}
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
            <Form.Control.Feedback type="invalid">
              {errors.image}
            </Form.Control.Feedback>
          </Form.Group>

          <Button variant="primary" type="submit">
            Lưu
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreateService;
