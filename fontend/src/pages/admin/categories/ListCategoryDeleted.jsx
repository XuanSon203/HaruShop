import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner } from "react-bootstrap";

function ListCategoryDeleted({ show, handleClose, onActionSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (show) {
      fetchDeletedCategories();
    }
  }, [show]);

  const fetchDeletedCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/admin/category/listCategoryDeleted", { credentials: "include" });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (Array.isArray(data?.categories) ? data.categories : []));
    } catch (error) {
      console.error("Error fetching deleted categories:", error);
    }
    setLoading(false);
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/category/reset/${id}`, {
        method: "PATCH",
        credentials: "include"
      });
      if (res.ok) {
        fetchDeletedCategories(); // refresh modal list
        if (onActionSuccess) onActionSuccess(); // cập nhật danh sách chính
      }
    } catch (error) {
      console.error("Error restoring category:", error);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn không?")) {
      try {
        const res = await fetch(`http://localhost:8080/admin/category/delete/${id}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (res.ok) {
          fetchDeletedCategories();
          if (onActionSuccess) onActionSuccess();
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Danh sách Category đã xóa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : categories.length === 0 ? (
          <p>Không có Category nào đã xóa.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên Category</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                <tr key={cat._id}>
                  <td>{index + 1}</td>
                  <td>{cat.name}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleRestore(cat._id)}
                    >
                      Khôi phục
                    </Button>{" "}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handlePermanentDelete(cat._id)}
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

export default ListCategoryDeleted;
