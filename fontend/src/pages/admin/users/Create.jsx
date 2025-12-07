import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";

function CreateUser({ show, handleClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const { addNotification } = useNotification();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
const API_BASE = `http://${window.location.hostname}:8080`;
  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate
    if (!formData.fullName.trim()) {
      addNotification("Họ và tên không được để trống", "warning");
      return;
    } else if (formData.fullName.trim().length < 3) {
      addNotification("Họ và tên phải có ít nhất 3 ký tự", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      addNotification("Email không được để trống", "warning");
      return;
    } else if (!emailRegex.test(formData.email)) {
      addNotification("Email không hợp lệ", "warning");
      return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!formData.phone.trim()) {
      addNotification("Số điện thoại không được để trống", "warning");
      return;
    } else if (!phoneRegex.test(formData.phone)) {
      addNotification("Số điện thoại phải là 10 hoặc 11 số", "warning");
      return;
    }

    if (!formData.password.trim()) {
      addNotification("Mật khẩu không được để trống", "warning");
      return;
    } else if (formData.password.length < 6) {
      addNotification("Mật khẩu phải có ít nhất 6 ký tự", "warning");
      return;
    }

    // ✅ Gửi API
    try {
      const res = await fetch(`${API_BASE}/admin/users/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      if (!res.ok) {
        addNotification("Thêm người dùng thất bại. Hãy thử lại sau ", "danger");
        return;
      }

      const newUser = await res.json();

      addNotification("Tạo người dùng thành công ", "success");

      // ✅ Báo cho cha biết có user mới
      if (onUserCreated) {
        onUserCreated(newUser);
      }

      resetForm();
      handleClose();
    } catch (error) {
      console.error(error);
      addNotification("Thêm người dùng thất bại", "danger");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm người dùng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Lưu
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreateUser;
