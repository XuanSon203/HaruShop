import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { Button } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import CreateRole from "./Create";
import EditRole from "./Edit";

function ManagerRoles() {
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
const API_BASE = `http://${window.location.hostname}:8080`
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/roles`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setRoles(data || []);
      } else {
        console.error("Lỗi fetch roles:", data.message);
      }
    } catch (err) {
      console.error("Lỗi khi fetch roles:", err);
    }
  };

  const handleOpenCreate = () => setShowModalCreate(true);
  const handleCloseCreate = () => setShowModalCreate(false);

  const handleEdit = (role) => {
    setSelectedRole(role);
    setShowModalEdit(true);
  };

  const handleCloseEdit = () => {
    setShowModalEdit(false);
    setSelectedRole(null);
  };

  const handleUpdateRole = (updatedRole) => {
    setRoles((prev) =>
      prev.map((r) => (r._id === updatedRole._id ? updatedRole : r))
    );
  };

  const handleToggleStatus = async (role) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/roles/changeStatus/${role._id}`,
        { 
          method: "PUT",
          credentials: "include"
        }
      );
      if (res.ok) {
        const updatedRole = await res.json();
        setRoles((prev) =>
          prev.map((r) => (r._id === updatedRole._id ? updatedRole : r))
        );
      } else {
        console.error("Lỗi toggle status:", res.statusText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm("Bạn có chắc muốn xóa role này không?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/admin/roles/delete/${role._id}`,
        { 
          method: "DELETE",
          credentials: "include"
        }
      );
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r._id !== role._id));
      } else {
        console.error("Lỗi delete role:", res.statusText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (role) => {
    alert(`Chi tiết role: ${role.roleName}\nMô tả: ${role.descriptionRole}`);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Vai trò</h1>
        <Button variant="warning" onClick={handleOpenCreate} style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14' }}>
          <i className="fas fa-plus me-1"></i>
          Thêm mới
        </Button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'visible' }}>
        <Table striped bordered hover style={{ width: '100%', tableLayout: 'auto', marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 'auto', minWidth: '50px', textAlign: 'center' }}>STT</th>
              <th style={{ width: 'auto', minWidth: '120px' }}>Tên Role</th>
              <th className="wrap" style={{ width: 'auto', minWidth: '150px' }}>Mô tả</th>
              <th style={{ width: 'auto', minWidth: '100px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ width: 'auto', minWidth: '200px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
        <tbody>
          {roles.length > 0 ? (
            roles.map((item, index) => (
              <tr key={item._id}>
                <td style={{ textAlign: 'center', width: 'auto' }}>{index + 1}</td>
                <td style={{ width: 'auto' }}>{item.roleName}</td>
                <td className="wrap" style={{ width: 'auto' }}>{item.descriptionRole || '-'}</td>
                <td style={{ textAlign: 'center', width: 'auto' }}>
                  <Button
                    variant={item.status === "active" ? "success" : "danger"}
                    size="sm"
                    onClick={() => handleToggleStatus(item)}
                    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                  >
                    {item.status === "active" ? "Active" : "Inactive"}
                  </Button>
                </td>

                <td style={{ textAlign: 'center', width: 'auto' }}>
                  <div className="d-flex gap-1 justify-content-center flex-wrap">
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleView(item)}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <FaEye /> Xem
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <FaEdit /> Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <FaTrash /> Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
        </Table>
      </div>

      <CreateRole
        show={showModalCreate}
        handleClose={handleCloseCreate}
        onUpdate={fetchRoles}
      />
      <EditRole
        show={showModalEdit}
        handleClose={handleCloseEdit}
        role={selectedRole}
        onUpdate={handleUpdateRole}
      />
    </div>
  );
}

export default ManagerRoles;
