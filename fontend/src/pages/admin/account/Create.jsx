import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";

function CreateAccount({ show, handleClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    userName: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    roleId: "",
  });

  const { addNotification } = useNotification();
  const [roles, setRoles] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
const API_BASE = `http://${window.location.hostname}:8080`;
  // Load roles khi mở modal
  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/roles`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setRoles(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0 && !formData.roleId) {
            setFormData((prev) => ({ ...prev, roleId: data[0]._id }));
          }
        })
        .catch((err) => console.error("Lỗi khi fetch roles:", err));
    }
  }, [show]);

  // Load permissions của role đang chọn để hiển thị cho admin
  useEffect(() => {
    const id = formData.roleId;
    if (!id) {
      setRolePerms([]);
      return;
    }
    fetch(`${API_BASE}/admin/roles/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((role) => {
        const perms = Array.isArray(role?.permissions)
          ? role.permissions
          : Array.isArray(role?.permisstions)
          ? role.permisstions
          : [];
        setRolePerms(perms);
      })
      .catch(() => setRolePerms([]));
  }, [formData.roleId]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const resetForm = () => {
    setFormData({
      userName: "",
      fullName: "",
      email: "",
      password: "",
      phone: "",
      roleId: roles.length > 0 ? roles[0]._id : "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ Validate
    if (!formData.userName.trim()) {
      addNotification("Tên đăng nhập  không được để trống", "warning");
      return;
    } else if (formData.userName.trim().length < 3) {
      addNotification("Tên đăng nhập phải có ít nhất 3 ký tự", "warning");
      return;
    }
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
      const res = await fetch(`${API_BASE}/admin/accounts/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: formData.userName,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role_id: formData.roleId,
        }),
      });

      const data = await res.json();
      if (res.status === 400 && typeof data?.message === "string") {
        addNotification(data.message, "warning");
        return;
      }

      if (res.ok && data.success) {
        addNotification("Tạo người dùng thành công", "success");
        if (onUserCreated) {
          onUserCreated(data.account);
        }
      } else {
        addNotification(data.message || "Tạo người dùng thất bại", "danger");
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
        <Modal.Title>Thêm tài khảo quản trị </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên đăng nhập</Form.Label>
            <Form.Control
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập "
            />
          </Form.Group>
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

          <Form.Group className="mb-3">
            <Form.Label>Quyền</Form.Label>
            <Form.Select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
            >
              <option value="">-- Chọn quyền --</option>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.roleName}
                  </option>
                ))
              ) : (
                <option disabled>Đang tải...</option>
              )}
            </Form.Select>
          </Form.Group>

          {rolePerms.length > 0 && (
            <div className="mb-3">
              <div className="text-muted mb-1">
                Quyền áp dụng (theo Role đã chọn):
              </div>
              <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                {rolePerms.map((p) => (
                  <span key={p} className="badge bg-light text-dark border">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button variant="primary" type="submit">
            Lưu
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreateAccount;
