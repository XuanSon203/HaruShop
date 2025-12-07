import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import { useNotification } from "../../../../components/nofication/Nofication";
function DeletedAccessoriesModal({ show, onHide, onChanged, onNotify }) {
  const [deletedItems, setDeletedItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const API_BASE = `http://${window.location.hostname}:8080`;
const { addNotification } = useNotification();
  const loadDeleted = () => {
    fetch(`${API_BASE}/admin/products/accessory/deleted`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setDeletedItems(res.accessories || []);
        }
      })
      .catch((err) => console.error("Lỗi khi load phụ kiện đã xóa:", err));
  };

  useEffect(() => {
    if (show) {
      loadDeleted();
      setSelectedRows([]);
      setBulkAction("");
    }
  }, [show]);

  const handleRestore = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/accessory/restore/${id}`,
        { method: "PUT", credentials: "include" }
      );
      if (res.ok) {
        loadDeleted();
        onChanged && onChanged();
        addNotification("Khôi phục thành công", "success");
      }
    } catch (err) {
      addNotification("Lỗi khôi phục:", err);
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn mục này?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/accessory/force/${id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        loadDeleted();
        onChanged && onChanged();
        addNotification("Đã xóa vĩnh viễn", "success");
      }
    } catch (err) {
      addNotification("Lỗi xóa vĩnh viễn:");
    }
  };

  const toggleSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === deletedItems.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(deletedItems.map((i) => i._id));
    }
  };

  const applyBulkAction = async () => {
    if (selectedRows.length === 0 || !bulkAction) return;
    try {
      if (bulkAction === "restore") {
        await Promise.all(
          selectedRows.map((id) =>
            fetch(
              `${API_BASE}/admin/products/accessory/restore/${id}`,
              {
                method: "PUT",
                credentials: "include",
              }
            )
          )
        );
      }
      if (bulkAction === "force_delete") {
        if (!window.confirm("Xóa vĩnh viễn các mục đã chọn?")) return;
        await Promise.all(
          selectedRows.map((id) =>
            fetch(
              `${API_BASE}/admin/products/accessory/force/${id}`,
              {
                method: "DELETE",
                credentials: "include",
              }
            )
          )
        );
      }
      setSelectedRows([]);
      setBulkAction("");
      loadDeleted();
      onChanged && onChanged();
    } catch (err) {
      console.error("Lỗi áp dụng hàng loạt:", err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Phụ kiện đã xóa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedRows.length > 0 && (
          <div className="d-flex align-items-center gap-2 mb-3">
            <select
              className="form-select"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={{ maxWidth: "220px" }}
            >
              <option value="">-- Chọn hành động --</option>
              <option value="restore">Khôi phục</option>
              <option value="force_delete">Xóa vĩnh viễn</option>
            </select>
            <Button variant="secondary" onClick={applyBulkAction}>
              Áp dụng cho {selectedRows.length} mục
            </Button>
          </div>
        )}
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={
                    selectedRows.length > 0 &&
                    selectedRows.length === deletedItems.length
                  }
                />
              </th>
              <th>#</th>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Giá</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {deletedItems.map((item, index) => (
              <tr key={item._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(item._id)}
                    onChange={() => toggleSelect(item._id)}
                  />
                </td>
                <td>{index + 1}</td>
                <td>
                  {item.thumbnail && (
                    <img
                      src={`${API_BASE}/uploads/products/accessory/${item.thumbnail}`}
                      alt={item.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </td>
                <td>{item.name}</td>
                <td>{Number(item.price || 0).toLocaleString()} ₫</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleRestore(item._id)}
                  >
                    Khôi phục
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleForceDelete(item._id)}
                  >
                    Xóa vĩnh viễn
                  </Button>
                </td>
              </tr>
            ))}
            {deletedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">
                  Không có phụ kiện đã xóa
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DeletedAccessoriesModal;
