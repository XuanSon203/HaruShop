import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

function CreateRole({ show, handleClose }) {
  const [formData, setFormData] = useState({
    roleName: "",
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // Validate roleName
    if (!formData.roleName.trim()) {
      newErrors.roleName = "Tên quyền không được để trống";
    } else if (formData.roleName.length < 3) {
      newErrors.roleName = "Tên quyền phải có ít nhất 3 ký tự";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/roles/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Có lỗi khi tạo role");

      const data = await res.json();

      setFormData({ roleName: "" });
      setErrors({});
      alert("Tạo role thành công ");
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Tạo role thất bại ");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm Role</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên quyền</Form.Label>
            <Form.Control
              name="roleName"
              value={formData.roleName}
              onChange={handleChange}
              placeholder="Nhập tên quyền"
              isInvalid={!!errors.roleName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.roleName}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả quyền </Form.Label>
            <Form.Control
              name="descriptionRole"
              value={formData.descriptionRole}
              onChange={handleChange}
              placeholder="Nhập tên quyền"
              isInvalid={!!errors.descriptionRole}
            />
            <Form.Control.Feedback type="invalid">
              {errors.descriptionRole}
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

export default CreateRole;
