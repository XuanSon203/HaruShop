import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Search from "../../../components/search/Search";
import Sort from "../../../components/sort/Sort";
import { Button } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import CreateUser from "./Create";
import Detail from "./Detail";
import EditUser from "./Edit";
import { Card } from "react-bootstrap";

import ListUserDeleted from "./ListUserDelted";
import Pagination from "../../../components/paginartion/Pagination";
import { useNotification } from "../../../components/nofication/Nofication";
function ManagerUser() {
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [userDeleted, setUserDeleted] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });
  const API_BASE = `http://${window.location.hostname}:8080`;
  const { addNotification } = useNotification();
  const fetchUsers = async (page = 1) => {
    const res = await fetch(
      `${API_BASE}/admin/users?page=${page}&limit=10`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    const data = await res.json();
    setUsers(data.users);
    setPagination(data.pagination);
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);
  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModalEdit(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setUsers(data.users);
        setUserDeleted(data.countUserDeleted);
      } catch (err) {
        console.error("Lỗi fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa người dùng này?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/users/deleted/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        addNotification("Xoá thất bại", "danger");
        return;
      }

      const deletedUser = await res.json();

      setUsers((prev) => prev.filter((u) => u._id !== id));

      setUserDeleted((prev) => prev + 1);

      addNotification("Xóa thành công", "success");
    } catch (err) {
      console.error("Lỗi khi xoá:", err);
      addNotification("Có lỗi xảy ra khi xoá", "danger");
    }
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setShowModalDetail(true);
  };
  const filteredUsers = users
    .filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "nameAsc") return a.fullName.localeCompare(b.fullName);
      if (sortBy === "nameDesc") return b.fullName.localeCompare(a.fullName);
      if (sortBy === "statusActive") return a.status === "active" ? -1 : 1;
      if (sortBy === "statusInactive") return a.status === "inactive" ? -1 : 1;
      return 0;
    });

  const handleStatusClick = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/changeStatus/${id}/${newStatus}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!res.ok) addNotification("Cập nhật trạng thái thất bại");

      const updatedUser = await res.json();

      // Cập nhật 1 user trong state
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
      addNotification("Cật nhập trạng thái thành công ");
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái:", err);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Danh sách người dùng</h1>

      {/* Search và Sort */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Search search={search} onSearchChange={setSearch} />
        <Sort
          options={[
            { value: "asc", label: "Tên A-Z" },
            { value: "desc", label: "Tên Z-A" },
            { value: "statusActive", label: "Trạng thái Active trước" },
            { value: "statusInactive", label: "Trạng thái Inactive trước" },
          ]}
          onSortChange={(type) => setSortBy(type)}
        />
      </div>

      {/* Nút thêm & xóa */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="primary" onClick={() => setShowModalCreate(true)}>
          +
        </Button>

        <Button variant="danger" onClick={() => setShowDeleted(true)}>
          <FaTrash style={{ marginRight: "6px" }} />
          Xóa {userDeleted}
        </Button>
      </div>

      <Card.Body className="p-0">
        <div style={{ overflowX: "auto" }}>
          <Table
            striped
            bordered
            hover
            className="align-middle"
            style={{
              tableLayout: "auto",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            <thead className="text-center">
              <tr>
                <th style={{ minWidth: "60px" }}>STT</th>
                <th style={{ minWidth: "100px" }}>Full Name</th>
                <th style={{ minWidth: "100px" }}>Email</th>
                <th style={{ minWidth: "120px" }}>Trạng thái</th>
                <th style={{ minWidth: "150px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => (
                <tr key={u._id}>
                  <td className="text-center">{index + 1}</td>

                  <td style={{ wordBreak: "break-word" }}>{u.fullName}</td>

                  <td style={{ wordBreak: "break-word" }}>{u.email}</td>

                  <td className="text-center">
                    <button
                      onClick={() =>
                        handleStatusClick(
                          u._id,
                          u.status === "active" ? "inactive" : "active"
                        )
                      }
                      className={`btn btn-sm text-white px-3 ${
                        u.status === "active" ? "btn-success" : "btn-danger"
                      }`}
                    >
                      {u.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="text-center">
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => handleViewDetail(u)}
                    >
                      <FaEye className="me-1" /> Chi tiết
                    </Button>

                    <Button
                      variant="warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(u)}
                    >
                      <FaEdit className="me-1" /> Sửa
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(u._id)}
                    >
                      <FaTrash className="me-1" /> Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      {/* Modal thêm user */}
      <CreateUser
        show={showModalCreate}
        handleClose={() => setShowModalCreate(false)}
        setUsers={setUsers}
        users={users}
        onUserCreated={(newUser) => setUsers((prev) => [...prev, newUser])}
      />

      {/* Modal chi tiết user */}
      <Detail
        show={showModalDetail}
        handleClose={() => setShowModalDetail(false)}
        user={selectedUser}
      />

      {/* Modal chỉnh sửa */}
      <EditUser
        show={showModalEdit}
        handleClose={() => setShowModalEdit(false)}
        user={selectedUser}
        onUpdate={(updatedUser) => {
          setUsers((prev) =>
            prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
          );
        }}
      />
      <ListUserDeleted
        show={showDeleted}
        onHide={() => setShowDeleted(false)}
        onChanged={(restoredUser) => {
          // ✅ Thêm lại user đã khôi phục vào danh sách users
          setUsers((prev) => [...prev, restoredUser]);
          // ✅ Giảm số lượng user đã xoá
          setUserDeleted((prev) => prev - 1);
        }}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchUsers(page)}
      />
    </div>
  );
}

export default ManagerUser;
