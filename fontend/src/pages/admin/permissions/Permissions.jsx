import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap";

const MODULE_PERMISSIONS = {
  users: ["read", "create", "update", "delete"],
  roles: ["read", "create", "update", "delete"],
  products: ["read", "create", "update", "delete"],
  categories: ["read", "create", "update", "delete"],
  services: ["read", "create", "update", "delete"],
  orders: ["read", "update"],
  discounts: ["read", "create", "update", "delete"],
  orderservices: ["read", "update"],
  payments: ["read", "create", "update", "delete"],
  accounts: ["read", "create", "update", "delete"],
};

const MODULE_LABELS_VI = {
  users: "Người dùng",
  roles: "Vai trò",
  products: "Sản phẩm",
  categories: "Danh mục",
  services: "Dịch vụ",
  orders: "Đơn hàng",
  discounts: "Mã giảm giá",
  orderservices: "Đơn hàng dịch vụ",
  payments: "Phương thức thanh toán",
  accounts: "Tài khoản quản trị",
};

const ACTION_LABELS_VI = {
  read: "Xem",
  create: "Tạo",
  update: "Sửa",
  delete: "Xóa",
};

function PermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({ roleName: "", descriptionRole: "" });

  useEffect(() => {
    const t = error && setTimeout(() => setError(""), 2500);
    return () => t && clearTimeout(t);
  }, [error]);

  useEffect(() => {
    const t = success && setTimeout(() => setSuccess(""), 2000);
    return () => t && clearTimeout(t);
  }, [success]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/admin/roles", {
        credentials: "include",
        method: "GET",
      });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedRoleId(data[0]._id || data[0].id || "");
      }
    } catch (e) {
      setError("Không thể tải danh sách role");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.roleName?.trim()) {
      setError("Vui lòng nhập tên role");
      return;
    }
    try {
      setAddingRole(true);
      const res = await fetch("http://localhost:8080/admin/roles/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roleName: newRole.roleName.trim(), descriptionRole: newRole.descriptionRole || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Tạo role thất bại");
      setSuccess("Đã tạo role mới");
      setNewRole({ roleName: "", descriptionRole: "" });
      await loadRoles();
      setSelectedRoleId(data?._id || data?.id || "");
    } catch (err) {
      setError(err.message || "Tạo role thất bại");
    } finally {
      setAddingRole(false);
    }
  };

  const loadRoleDetail = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/admin/roles/${id}`, {
        credentials: "include",
        method: "GET",
      });
      const role = await res.json();
      const perms = Array.isArray(role?.permissions) ? role.permissions : [];
      setSelectedPermissions(new Set(perms));
    } catch (e) {
      setError("Không thể tải chi tiết role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      loadRoleDetail(selectedRoleId);
    } else {
      setSelectedPermissions(new Set());
    }
  }, [selectedRoleId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setError("Vui lòng chọn role");
      return;
    }
    const permissions = Array.from(selectedPermissions);
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:8080/admin/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Cập nhật thất bại");
      setSuccess("Cập nhật permissions thành công");
    } catch (e) {
      setError(e.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };


  const togglePermission = (perm) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const moduleKeys = Object.keys(MODULE_PERMISSIONS);
  const isModuleAllSelected = (moduleKey) => {
    const actions = MODULE_PERMISSIONS[moduleKey];
    return actions.every((a) => selectedPermissions.has(`${moduleKey}.${a}`));
  };
  const toggleModuleAll = (moduleKey) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const actions = MODULE_PERMISSIONS[moduleKey];
      const allSelected = actions.every((a) => next.has(`${moduleKey}.${a}`));
      actions.forEach((a) => {
        const perm = `${moduleKey}.${a}`;
        if (allSelected) next.delete(perm);
        else next.add(perm);
      });
      return next;
    });
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="p-4 shadow-sm border-0">
            <h4 className="mb-3">Phân quyền theo Role</h4>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>
            )}
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>
            )}

            {/* Thêm role mới */}
            <Form className="mb-3" onSubmit={handleAddRole}>
              <div className="d-flex gap-2 flex-wrap align-items-end">
                <div style={{ minWidth: 240 }}>
                  <Form.Label className="mb-1">Tên role mới</Form.Label>
                  <Form.Control
                    placeholder="VD: Quản trị viên"
                    value={newRole.roleName}
                    onChange={(e) => setNewRole((s) => ({ ...s, roleName: e.target.value }))}
                  />
                </div>
                <div className="flex-grow-1" style={{ minWidth: 280 }}>
                  <Form.Label className="mb-1">Mô tả</Form.Label>
                  <Form.Control
                    placeholder="Mô tả ngắn cho role"
                    value={newRole.descriptionRole}
                    onChange={(e) => setNewRole((s) => ({ ...s, descriptionRole: e.target.value }))}
                  />
                </div>
                <div>
                  <Button type="submit" disabled={addingRole}>{addingRole ? "Đang thêm..." : "Thêm role"}</Button>
                </div>
              </div>
            </Form>

            {/* Chỉnh sửa quyền của role */}
            <Form onSubmit={handleSave}>
              <Form.Group className="mb-3">
                <Form.Label>Chọn Role</Form.Label>
                <Form.Select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  disabled={loading}
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roleName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Chọn quyền theo chức năng</Form.Label>
                <div className="d-grid" style={{ rowGap: "14px" }}>
                  {moduleKeys.map((moduleKey) => (
                    <Card key={moduleKey} className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong className="text-capitalize">{MODULE_LABELS_VI[moduleKey] || moduleKey}</strong>
                        <Form.Check
                          type="switch"
                          id={`module-${moduleKey}`}
                          label={"Bật tất cả"}
                          checked={isModuleAllSelected(moduleKey)}
                          onChange={() => toggleModuleAll(moduleKey)}
                        />
                      </div>
                      <div className="d-flex flex-wrap" style={{ gap: "12px" }}>
                        {MODULE_PERMISSIONS[moduleKey].map((action) => {
                          const perm = `${moduleKey}.${action}`;
                          const viLabel = `Quyền ${ACTION_LABELS_VI[action] || action} ${MODULE_LABELS_VI[moduleKey]?.toLowerCase() || moduleKey}`;
                          return (
                            <Form.Check
                              key={perm}
                              type="switch"
                              id={`perm-${perm}`}
                              label={viLabel}
                              checked={selectedPermissions.has(perm)}
                              onChange={() => togglePermission(perm)}
                            />
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" /> Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default PermissionsPage;


