import React, { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

function EditRole({ show, handleClose, onUpdate, roles, role }) {
  const [formData, setFormData] = useState({
    role_id: "",
    roleName: "",
    descriptionRole: "",
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  // Load dữ liệu khi modal mở hoặc role thay đổi
  useEffect(() => {
    if (show && role) {
      setFormData({
        role_id: role._id || "",
        roleName: role.roleName || "",
        descriptionRole: role.descriptionRole || "",
      });
    }
  }, [role, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${API_BASE}/admin/roles/edit/${formData.role_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            roleName: formData.roleName,
            descriptionRole: formData.descriptionRole,
          }),
        }
      );

      if (res.ok) {
        const updatedRole = await res.json();
        onUpdate(updatedRole); // trả role đã update lên parent
        handleClose();
      } else {
        alert("Cập nhật thất bại!");
      }
    } catch (err) {
      console.error("Lỗi update:", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      role_id: "",
      roleName: "",
      descriptionRole: "",
    });
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa quyền</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên quyền</Form.Label>
            <Form.Control
              type="text"
              name="roleName"
              value={formData.roleName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả quyền</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descriptionRole"
              value={formData.descriptionRole}
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

export default EditRole;
