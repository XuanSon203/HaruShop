import React, { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

function Detail({ show, handleClose, user, roles }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    status: "",
    roleName: "",
    createdAt: "",
    createdBy: "",
    updatedBy: "",
    deletedBy: "",
  });

  useEffect(() => {
    if (user) {
      // Tìm role name từ danh sách roles truyền xuống
      const role = roles.find((r) => r._id === user.role_id);

      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        status: user.deleted === false ? "Hoạt động" : "Đã khóa",
        roleName: role ? role.roleName : "Không rõ",
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleString("vi-VN")
          : "",
        createdBy: user.createdBy?.user?.fullName || "Không rõ",
        updatedBy: user.updatedBy?.length > 0 
          ? `${user.updatedBy.length} lần cập nhật` 
          : "Chưa cập nhật",
        deletedBy: user.deletedBy?.user?.fullName || "Chưa xóa",
      });
    } else {
      // reset nếu không có user
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        status: "",
        roleName: "",
        createdAt: "",
        createdBy: "",
        updatedBy: "",
        deletedBy: "",
      });
    }
  }, [user, roles]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết người dùng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control value={formData.fullName} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control value={formData.email} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control value={formData.phone} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Control value={formData.status} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quyền</Form.Label>
            <Form.Control value={formData.roleName} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ngày tạo</Form.Label>
            <Form.Control value={formData.createdAt} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Người tạo</Form.Label>
            <Form.Control value={formData.createdBy} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số lần cập nhật</Form.Label>
            <Form.Control value={formData.updatedBy} readOnly />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Người xóa</Form.Label>
            <Form.Control value={formData.deletedBy} readOnly />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Detail;
