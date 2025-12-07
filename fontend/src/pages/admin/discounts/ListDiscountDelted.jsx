import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner, Badge } from "react-bootstrap";

function ListDiscountDeleted({ show, handleClose }) {
  const [deletedDiscounts, setDeletedDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeletedDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/admin/discounts/listDiscountDeleted",{ credentials: "include", });
      if (!res.ok) throw new Error("Lỗi khi lấy danh sách discount đã xóa");
      const data = await res.json();
      setDeletedDiscounts(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchDeletedDiscounts();
  }, [show]);

  const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", { hour12: false });
};

  // Xóa vĩnh viễn
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn discount này?")) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/discounts/permanentDelete/${id}`, {
        method: "DELETE",
         credentials: "include", 
      });
      if (!res.ok) throw new Error("Xóa vĩnh viễn thất bại");
      fetchDeletedDiscounts();
    } catch (error) {
      console.error(error);
      alert("Xóa vĩnh viễn thất bại");
    }
  };

  // Khôi phục
  const handleRestore = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/discounts/restore/${id}`, {
        method: "PATCH",
         credentials: "include", 
      });
      if (!res.ok) throw new Error("Khôi phục thất bại");
      fetchDeletedDiscounts();
    } catch (error) {
      console.error(error);
      alert("Khôi phục thất bại");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Danh sách Discount đã xóa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center my-3">
            <Spinner animation="border" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : deletedDiscounts.length === 0 ? (
          <p className="text-center">Chưa có discount nào bị xóa</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên phiếu</th>
                <th>Mã</th>
                <th>Mô tả</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Ngày xóa</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {deletedDiscounts.map((d, index) => (
                <tr key={d._id}>
                  <td>{index + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.code || "-"}</td>
                  <td>{d.description || "-"}</td>
                  <td>
                    <Badge bg={d.type === "percent" ? "info" : "warning"}>
                      {d.type === "percent" ? "Phần trăm" : "Số tiền"}
                    </Badge>
                  </td>
                  <td>{d.type === "percent" ? `${d.value}%` : `${d.value} VND`}</td>
                  <td>
                    <Badge bg="secondary">Đã xóa</Badge>
                  </td>
                 <td>{formatDateTime(d.deletedAt)}</td>

                  <td>
                    <Button
                      size="sm"
                      variant="success"
                      className="me-2"
                      onClick={() => handleRestore(d._id)}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(d._id)}
                    >
                      Xóa vĩnh viễn
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ListDiscountDeleted;
