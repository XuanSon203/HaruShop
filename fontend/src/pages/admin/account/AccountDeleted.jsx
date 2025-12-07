import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";

function AccountDeleted({ show, onHide, onChanged }) {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/accounts/accountDeleted`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setAccounts(data.accounts || []);
        })
        .catch((err) => {
          console.error("Lỗi fetch:", err);
          addNotification(
            "Không thể tải danh sách tài khoản đã xóa!",
            "danger"
          );
        });
    }
  }, [show]);

  const handleAction = async (account, actionType) => {
    try {
      let url = "";
      let method = "PUT";

      if (actionType === "restore") {
        url = `${API_BASE}/admin/accounts/reset/${account._id}`;
      } else if (actionType === "delete") {
        url = `${API_BASE}/admin/accounts/force-delete/${account._id}`;
        method = "DELETE";
      }

      const res = await fetch(url, { method, credentials: "include" });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        addNotification(data.message || "Thao tác thất bại", "danger");
        return;
      }

      // Cập nhật danh sách
      setAccounts((prev) => prev.filter((a) => a._id !== account._id));

      if (actionType === "restore") {
        addNotification("Khôi phục thành công", "success");
        if (onChanged) onChanged(data.account || account);
      } else {
        addNotification("Xoá vĩnh viễn thành công", "success");
      }
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAccounts = accounts.filter((a) => {
    const name = a?.fullName?.toLowerCase() || "";
    const email = a?.email?.toLowerCase() || "";
    const userName = a?.userName?.toLowerCase() || "";
    return (
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase())
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
            placeholder="Tìm kiếm theo tên, email hoặc username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên đăng nhập</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Thời gian xoá</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">
                  Không có tài khoản phù hợp
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account, index) => (
                <tr key={account._id}>
                  <td>{index + 1}</td>
                  <td>{account.userName}</td>
                  <td>{account.fullName}</td>
                  <td>{account.email}</td>
                  <td>{formatDate(account.deletedAt)}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleAction(account, "restore")}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(account, "delete")}
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

export default AccountDeleted;
