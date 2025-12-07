import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { Form, Button, Spinner, Alert, Pagination, Modal } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

function ManagerCustormers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      fullName: customer?.fullName || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    try {
      if (!form.fullName?.trim() || !form.phone?.trim()) {
        alert("Vui lòng nhập Họ tên và SĐT");
        return;
      }
      const res = await fetch(`http://localhost:8080/admin/customers/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Sửa thất bại');
      setShowEdit(false);
      setEditing(null);
      await load(page);
    } catch (e) {
      alert(e.message || 'Lỗi');
    }
  };

  const load = async (p = 1, q = search) => {
    try {
      setLoading(true);
      setError("");
      const url = `http://localhost:8080/admin/customers?page=${p}&limit=10&search=${encodeURIComponent(q)}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải khách hàng");
      setItems(data.customers || []);
      setTotal(data.totalCustomers || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.currentPage || p);
    } catch (e) {
      setError(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => load(i)}>
          {i}
        </Pagination.Item>
      );
    }
    return <Pagination className="mt-3">{items}</Pagination>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0 text-center"> Quản lý địa chỉ giao hàng </h3>
        <div className="d-flex align-items-center gap-2">
          <Form.Control
            placeholder="Tìm theo tên, sđt, địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Button variant="outline-secondary" onClick={() => load(1, search)}>
            Tìm
          </Button>
        </div>
      </div>

      <div className="mb-2 text-muted">Địa chỉ khách hàng : <strong>{total}</strong></div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive style={{ tableLayout: 'auto', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 'auto', minWidth: '50px', textAlign: 'center' }}>STT</th>
              <th style={{ width: 'auto', minWidth: '150px' }}>Họ tên</th>
              <th style={{ width: 'auto', minWidth: '120px' }}>Số điện thoại</th>
              <th className="wrap" style={{ width: 'auto', minWidth: '200px' }}>Địa chỉ</th>
              <th style={{ width: 'auto', minWidth: '120px', textAlign: 'center' }}>Ngày tạo</th>
              <th style={{ width: 'auto', minWidth: '180px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * 10 + idx + 1}</td>
                <td>{c.fullName}</td>
                <td>{c.phone}</td>
                <td>{c.address || "—"}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : "—"}</td>
                <td className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => openEdit(c)}>
                    <FaEdit className="me-1" /> Sửa
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={async () => {
                    if (!window.confirm('Xóa khách hàng này?')) return
                    try {
                      const res = await fetch(`http://localhost:8080/admin/customers/${c._id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                      })
                      const data = await res.json()
                      if (!res.ok || !data.success) throw new Error(data.message || 'Xóa thất bại')
                      load(page)
                    } catch (e) {
                      alert(e.message || 'Lỗi')
                    }
                  }}><FaTrash className="me-1" /> Xóa</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {renderPagination()}

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sửa khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Form.Label>Họ tên</Form.Label>
            <Form.Control value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="mb-3">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Hủy</Button>
          <Button variant="primary" onClick={submitEdit}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ManagerCustormers;
