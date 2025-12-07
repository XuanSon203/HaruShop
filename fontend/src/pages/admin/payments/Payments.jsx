import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Modal,
  Image,
} from "react-bootstrap";

function PaymentsAdmin() {
  // Manage PAYMENT METHODS (DB-driven options customers will choose)
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: false,
  });
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // no legacy dependent resets
  useEffect(() => {}, []);

  useEffect(() => {
    const t = error && setTimeout(() => setError(""), 2500);
    return () => t && clearTimeout(t);
  }, [error]);
  useEffect(() => {
    const t = success && setTimeout(() => setSuccess(""), 2000);
    return () => t && clearTimeout(t);
  }, [success]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/admin/payments`, {
        credentials: "include",
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Không thể tải phương thức");
      const rows = data.payments || [];
      setMethods(rows);
      // no cleanup with new schema
    } catch (e) {
      setError(e.message || "Lỗi tải phương thức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    // Kiểm tra dữ liệu trước khi gửi
    if (!form.name.trim()) {
      return setError("Tên phương thức không được để trống");
    }
    if (!form.description.trim()) {
      return setError("Mô tả không được để trống");
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("status", form.status ? "true" : "false");
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // ✅ Log FormData chính xác
      for (let pair of formData.entries()) {
      }

      const res = await fetch("http://localhost:8080/admin/payments/add", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Tạo phương thức thất bại");
      }

      setSuccess("Đã thêm phương thức thanh toán!");
      setForm({ name: "", description: "", status: false });
      setSelectedFile(null);

      load(); // reload bảng dữ liệu
    } catch (e) {
      setError(e.message || "Lỗi tạo mới phương thức");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setForm({
      name: method.name || "",
      description: method.description || "",
      status: !!method.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description || "");
      formData.append("status", form.status ? "true" : "false");
      if (selectedFile) formData.append("image", selectedFile);

      const res = await fetch(
        `http://localhost:8080/admin/payments/edit/${editingMethod._id}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật phương thức thất bại");

      setSuccess("Đã cập nhật phương thức thanh toán");
      setShowEditModal(false);
      setSelectedFile(null);
      load();
    } catch (e) {
      setError(e.message || "Cập nhật phương thức thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa bản ghi này?")) return;
    try {
      const res = await fetch(
        `http://localhost:8080/admin/payments/delete/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa phương thức thất bại");
      setSuccess("Đã xóa phương thức");
      load();
    } catch (e) {
      setError(e.message || "Xóa phương thức thất bại");
    }
  };

  return (
    <Container className="py-3">
      <Card className="p-3 mb-3">
        <h4 className="mb-3">Quản lý phương thức thanh toán</h4>
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess("")} dismissible>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleAdd} className="mb-3">
          <Row className="g-2">
            {/* Loại phương thức đã bỏ */}
            <Col md={6}>
              <Form.Control
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tên hiển thị"
              />
            </Col>
            <Col md={4}>
              <Form.Control
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả"
              />
            </Col>
            <Col md={2} className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="status"
                label="Kích hoạt"
                checked={!!form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
              />
            </Col>
            {/* Nút bật/tắt đã bỏ */}
            <Col md={2} className="mt-2 mt-md-0">
              <Button
                type="submit"
                disabled={saving || !String(form.name || "").trim()}
                className="w-100"
              >
                {saving ? <Spinner size="sm" animation="border" /> : "Thêm"}
              </Button>
            </Col>
          </Row>
          {/* Upload ảnh phương thức */}
          <Row className="g-2 mt-2">
            <Col md={6}>
              <Form.Label>Hình ảnh (tùy chọn)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              {selectedFile && (
                <small className="text-success">
                  Đã chọn: {selectedFile.name}
                </small>
              )}
            </Col>
          </Row>
        </Form>

        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Hình</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {methods.map((it) => (
                <tr key={it._id}>
                  <td>{it.name}</td>
                  <td
                    className="text-truncate"
                    style={{ maxWidth: 280 }}
                    title={it.description}
                  >
                    {it.description || "-"}
                  </td>
                  <td>
                    {it.image ? (
                      <Image
                       src={`http://localhost:8080/uploads/paymetns/${it.image}`}
                        alt={it.name}
                        thumbnail
                        style={{ width: 56, height: 56, objectFit: "cover" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {it.status ? (
                      <Badge bg="success">Bật</Badge>
                    ) : (
                      <Badge bg="secondary">Tắt</Badge>
                    )}
                  </td>
                  <td>{new Date(it.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      onClick={() => handleEdit(it)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(it._id)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && methods.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Chưa có bản ghi
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          {loading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner size="sm" animation="border" />
              <span>Đang tải...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa phương thức thanh toán</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            <Row className="g-2">
              <Col md={6}>
                <Form.Label>Tên hiển thị</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Col>
            </Row>

            <Row className="g-2 mt-2">
              <Col md={6}>
                <Form.Label>Hình ảnh</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                {editingMethod?.image && !selectedFile && (
                  <div className="mt-2">
                    <Image
                       src={`http://localhost:8080/uploads/paymetns/${editingMethod.image}`}
                      thumbnail
                      style={{ width: 72, height: 72, objectFit: "cover" }}
                    />
                  </div>
                )}
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="status-edit"
                  label="Kích hoạt"
                  checked={!!form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.checked })
                  }
                />
              </Col>
            </Row>

            <Row className="g-2 mt-3">
              <Col md={12}>
                {/* Status switch moved above; keep row for spacing if needed */}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Cập nhật"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default PaymentsAdmin;
