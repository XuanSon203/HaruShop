import React, { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function EditUser({ show, handleClose, user, onUpdate}) {
  const [formData, setFormData] = useState({
    user_id: "",
    fullName: "",
    email: "",
    phone: "",
  });
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  // Fill lại dữ liệu mỗi khi mở modal
  useEffect(() => {
    if (show && user) {
      setFormData({
        user_id: user._id,
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/edit/${user._id}`,
        {
          method: "PUT", credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
        addNotification("Cập nhật thông tin người dùng thành công :)","success");
        handleClose();
      } else {
        addNotification("Cập nhật thất bại!","danger");
      }
    } catch (err) {
      console.error("Lỗi update:", err);
    }
  };

  // Reset form khi hủy
  const handleCancel = () => {
    setFormData({
      user_id: "",
      fullName: "",
      email: "",
      phone: "",
    });
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa người dùng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Form.Group>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancel}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditUser;
