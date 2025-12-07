import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Search from "../../../components/search/Search";
import Sort from "../../../components/sort/Sort";
import { Button } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import CreateUser from "./Create";
import Detail from "./Detail";
import EditUser from "./Edit";
import Pagination from "../../../components/paginartion/Pagination";
import { useNotification } from "../../../components/nofication/Nofication";
import AccountDeleted from "./AccountDeleted";

function ManagerAccount() {
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [roles, setRoles] = useState([]);
  const [accounts, setAccounts] = useState([]); // ✅ Dùng accounts thay vì users
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAccount: 0,
    limit: 10,
  });
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  const fetchAccounts = async (page = 1) => {
    const res = await fetch(
      `${API_BASE}/admin/accounts?page=${page}&limit=10`,
      { method: "GET", credentials: "include" }
    );
    const data = await res.json();
    setAccounts(data.accounts);
    setPagination({
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      totalAccount: data.total,
      limit: 10,
    });
    setAccountDeleted(data.countAccountDeleted || 0);
  };

  useEffect(() => {
    fetchAccounts(1);
  }, []);

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setShowModalEdit(true);
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/roles`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        console.error("Lỗi fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa người dùng này?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/accounts/deleted/${id}`,
        { method: "DELETE", credentials: "include" }
      );

      if (!res.ok) {
        addNotification("Xoá thất bại", "danger");
        return;
      }

      await res.json();

      setAccounts((prev) => prev.filter((a) => a._id !== id));
      setAccountDeleted((prev) => prev + 1);

      addNotification("Xóa thành công", "success");
    } catch (err) {
      console.error("Lỗi khi xoá:", err);
      addNotification("Có lỗi xảy ra khi xoá", "danger");
    }
  };

  const handleViewDetail = (account) => {
    setSelectedAccount(account);
    setShowModalDetail(true);
  };

  const filteredAccounts = accounts
    .filter((a) => {
      const userName = a.userName?.toLowerCase() || "";
      const fullName = a.fullName?.toLowerCase() || "";
      const email = a.email?.toLowerCase() || "";
      const keyword = search.toLowerCase();

      return (
        userName.includes(keyword) ||
        fullName.includes(keyword) ||
        email.includes(keyword)
      );
    })
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
        `${API_BASE}/admin/accounts/changeStatus/${id}/${newStatus}`,
        { method: "PUT", credentials: "include" }
      );

      if (!res.ok) {
        addNotification("Cập nhật trạng thái thất bại", "danger");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a._id === data.account._id ? data.account : a))
        );
        addNotification("Cập nhật trạng thái thành công", "success");
      } else {
        addNotification(data.message || "Cập nhật trạng thái thất bại", "danger");
      }
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái:", err);
      addNotification("Có lỗi xảy ra khi cập nhật trạng thái", "danger");
    }
  };

  return (
    <div>
      <h1 className="mb-4">Danh sách tài khoản quản trị </h1>

      {/* Search và Sort */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Search search={search} onSearchChange={setSearch} />
        <Sort
          options={[
            { value: "nameAsc", label: "Tên A-Z" },
            { value: "nameDesc", label: "Tên Z-A" },
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
          Xóa {accountDeleted}
        </Button>
      </div>

      {/* Bảng danh sách */}
      <Table striped bordered responsive >
        <thead>
          <tr>
            <th>STT</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Quyền</th>
            <th>Trạng thái</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAccounts.map((a, index) => (
            <tr key={a._id}>
              <td>{index + 1}</td>
              <td>{a.fullName}</td>
              <td>{a.email}</td>
              <td>
                {roles
                  .filter((item) => item._id === a.role_id)
                  .map((item) => item.roleName)}
              </td>
              <td>
                <button
                  onClick={() =>
                    handleStatusClick(
                      a._id,
                      a.status === "active" ? "inactive" : "active"
                    )
                  }
                  className={`btn btn-sm text-white ${
                    a.status === "active" ? "btn-success" : "btn-danger"
                  }`}
                >
                  {a.status === "active" ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="text-center">
                <Button
                  variant="info"
                  size="sm"
                  className="me-2"
                  onClick={() => handleViewDetail(a)}
                >
                  <FaEye className="me-1" /> Chi tiết
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(a)}
                >
                  <FaEdit className="me-1" /> Sửa
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(a._id)}
                >
                  <FaTrash className="me-1" /> Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal thêm account */}
      <CreateUser
        show={showModalCreate}
        handleClose={() => setShowModalCreate(false)}
        setUsers={setAccounts} // ✅ cập nhật accounts
        users={accounts}
        onUserCreated={(newAccount) =>
          setAccounts((prev) => [...prev, newAccount])
        }
      />

      {/* Modal chi tiết account */}
      <Detail
        show={showModalDetail}
        handleClose={() => setShowModalDetail(false)}
        user={selectedAccount}
        roles={roles}
      />

      {/* Modal chỉnh sửa */}
      <EditUser
        show={showModalEdit}
        handleClose={() => setShowModalEdit(false)}
        account={selectedAccount}
        roles={roles}
        onUpdate={(updatedAccount) => {
          setAccounts((prev) =>
            prev.map((a) => (a._id === updatedAccount._id ? updatedAccount : a))
          );
        }}
      />
      <AccountDeleted
        show={showDeleted}
        onHide={() => setShowDeleted(false)}
        onChanged={(restoredAccount) => {
          setAccounts((prev) => [...prev, restoredAccount]);
          setAccountDeleted((prev) => prev - 1);
        }}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchAccounts(page)}
      />
    </div>
  );
}

export default ManagerAccount;
