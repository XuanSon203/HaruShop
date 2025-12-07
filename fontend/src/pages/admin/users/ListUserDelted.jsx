import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";

function ListUserDeleted({ show, onHide, onChanged }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/users/userDeleted`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setUsers(data.users || []);
        })
        .catch((err) => {
          console.error("Lỗi fetch:", err);
          addNotification("Không thể tải danh sách người dùng đã xóa!", "danger");
        });
    }
  }, [show]);

const handleAction = async (user, actionType) => {
  try {
    let url = "";
    let method = "PUT";

    if (actionType === "restore") {
      url = `${API_BASE}/admin/users/reset/${user._id}`;
    } else if (actionType === "delete") {
      url = `${API_BASE}/admin/users/force-delete/${user._id}`;
      method = "DELETE";
    }

    const res = await fetch(url, { method, credentials: "include" });
    if (!res.ok) {
      addNotification("Thao tác thất bại", "danger");
      return;
    }

    
    setUsers((prev) => prev.filter((u) => u._id !== user._id));

    if (actionType === "restore") {
      addNotification("Khôi phục thành công", "success");
      // 👉 Gọi hàm refresh user ở ManagerUser (truyền prop onChanged)
      if (onChanged) onChanged(user);
    } else {
      addNotification("Xoá vĩnh viễn thành công", "success");
    }
  } catch (err) {
    console.error("Lỗi:", err);
  }
};

  const filteredUsers = users.filter((u) => {
    const name = u?.fullName?.toLowerCase() || "";
    const email = u?.email?.toLowerCase() || "";
    return (
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Danh sách tài khoản đã xoá</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="mb-3">
          <Form.Control
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center">
                  Không có tài khoản phù hợp
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleAction(user, "restore")}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(user, "delete")}
                    >
                      Xoá vĩnh viễn
                    </Button>
                  </td>
                </tr>
              ))
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

export default ListUserDeleted;
