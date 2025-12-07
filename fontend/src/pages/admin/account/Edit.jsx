import React, { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";

function EditAccount({ show, handleClose, account, onUpdate, roles }) {
  const [formData, setFormData] = useState({
    userName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role_id: "",
  });

  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  // Fill lại dữ liệu khi mở modal
  useEffect(() => {
    if (show && account) {
      setFormData({
        userName: account.userName || "",
        fullName: account.fullName || "",
        email: account.email || "",
        phone: account.phone || "",
        password: "", // không fill password cũ để bảo mật
        role_id: account.role_id || "",
      });
    }
  }, [account, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    try {
      const res = await fetch(
        `${API_BASE}/admin/accounts/update/${account._id}`, 
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        onUpdate && onUpdate(data.account);
        addNotification(
          "Cập nhật thông tin người dùng thành công",
          "success"
        );
        handleClose();
      } else {
        addNotification(data.message || "Cập nhật thất bại!", "danger");
      }
    } catch (err) {
      console.error("Lỗi update:", err);
      addNotification("Không thể kết nối đến server!", "danger");
    }
  };

  const handleCancel = () => {
    setFormData({
      userName: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role_id: "",
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
            <Form.Label>Tên đăng nhập</Form.Label>
            <Form.Control
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </Form.Group>

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
            <Form.Label>Mật khẩu </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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

          <Form.Group className="mb-3">
            <Form.Label>Quyền</Form.Label>
            <Form.Select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn quyền --</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roleName}
                </option>
              ))}
            </Form.Select>
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

export default EditAccount;
