import { useEffect, useState } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { FaEdit, FaEye, FaToggleOff, FaToggleOn, FaTrash } from "react-icons/fa";
import Filter from "../../../components/Filter/Filter";
import Search from "../../../components/search/Search";
import Sort from "../../../components/sort/Sort";
import TrackingBadge from "../../../components/tracking/TrackingBadge";
import Create from "./Create";
import ViewCategoryModal from "./Detail";
import EditCategoryModal from "./Edit";
import ListCategoryDeleted from "./ListCategoryDeleted";
import { useNotification } from "../../../components/nofication/Nofication";
function ManagerCategory() {
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countCategoryDeleted, setCategoryDeleted] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [sortOrders, setSortOrders] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
const { addNotification } = useNotification();
  // Fetch danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/admin/category", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        setCategoryDeleted(data.countCategoryDeleted || 0);

        // Init sortOrders
        const initialSortOrders = data.categories.reduce((acc, cat) => {
          acc[cat._id] = cat.sortOrder || 0;
          return acc;
        }, {});
        setSortOrders(initialSortOrders);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Flatten categories đệ quy
  const getFlattenedCategories = (cats) => {
    const result = [];
    const addChildren = (parent, level = 0) => {
      result.push({ ...parent, level });
      const children = cats.filter((c) => c.parentId === parent._id);
      children.forEach((child) => addChildren(child, level + 1));
    };
    const parents = cats.filter((c) => !c.parentId);
    parents.forEach((parent) => addChildren(parent));
    return result;
  };

  // Filter & sort
  const filteredCategories = categories
    .filter((cat) => cat.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
      if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
      if (sortBy === "statusActive") return a.status === "active" ? -1 : 1;
      if (sortBy === "statusInactive") return a.status === "inactive" ? -1 : 1;
      return 0;
    });

  const displayedCategories = getFlattenedCategories(filteredCategories);

  // Checkbox chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(displayedCategories.map((cat) => cat._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // CRUD & toggle status
  const handleView = (cat) => {
    setSelected(cat);
    setShowView(true);
  };

  const handleEdit = (cat) => {
    setSelected(cat);
    setShowEdit(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/category/deleted/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error(err);
      addNotification("Xóa thất bại","danger");
    }
  };

  const handleDeleteMultiple = async (ids) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} danh mục này?`))
      return;
    try {
      for (const id of ids) {
        await fetch(`http://localhost:8080/admin/category/deleted/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      fetchCategories();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/category/changeStatus/${id}/${status}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error("Lỗi đổi trạng thái:", err);
      addNotification("Đổi trạng thái thất bại","danger");
    }
  };

  const handleChangeSortOrder = (id, value) => {
    setSortOrders((prev) => ({ ...prev, [id]: value }));
    fetch(`http://localhost:8080/admin/category/sortOrder/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ sortOrder: value }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  };

  const handleFilter = ({ action, ids }) => {
    if (!ids || ids.length === 0) return;
    switch (action) {
      case "active":
      case "inactive":
        ids.forEach((id) => handleToggleStatus(id, action));
        break;
      case "delete":
        handleDeleteMultiple(ids);
        break;
      default:
        break;
    }
  };

  const handleCreateSuccess = () => {
    setShowModalCreate(false);
    fetchCategories();
  };

  return (
    <div>
      <h1 className="text-center mb-4">Quản lý danh mục </h1>

      <div className="d-flex justify-content-around align-items-center px-4 mb-3">
        <Filter onFilter={handleFilter} selectedIds={selectedIds} />
        <Search search={searchQuery} onSearchChange={setSearchQuery} />
        <Sort
          options={[
            { value: "nameAsc", label: "Tên A-Z" },
            { value: "nameDesc", label: "Tên Z-A" },
            { value: "statusActive", label: "Hoạt động trước" },
            { value: "statusInactive", label: "Ngưng hoạt động trước" },
          ]}
          onSortChange={setSortBy}
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="primary" onClick={() => setShowModalCreate(true)}>
          + Thêm danh mục
        </Button>

        <Button
          variant="danger"
          onClick={() => setShowDeletedModal(true)}
          disabled={!countCategoryDeleted || countCategoryDeleted === 0}
        >
          <FaTrash style={{ marginRight: 6 }} />
          Đã xóa ({countCategoryDeleted})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover style={{ tableLayout: 'auto', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 'auto', minWidth: '40px', textAlign: 'center' }}>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === displayedCategories.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ width: 'auto', minWidth: '50px', textAlign: 'center' }}>#</th>
              <th style={{ width: 'auto', minWidth: '150px' }}>Tên danh mục</th>
              <th style={{ width: 'auto', minWidth: '120px' }}>Danh mục cha</th>
              <th style={{ width: 'auto', minWidth: '80px', textAlign: 'center' }}>Thứ tự</th>
              <th style={{ width: 'auto', minWidth: '80px', textAlign: 'center' }}>Ảnh</th>
              <th style={{ width: 'auto', minWidth: '100px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ width: 'auto', minWidth: '150px' }}>Thông tin tracking</th>
              <th style={{ width: 'auto', minWidth: '180px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedCategories.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center">
                  Không có danh mục
                </td>
              </tr>
            )}

            {displayedCategories.map((cat, index) => (
              <tr key={cat._id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.includes(cat._id)}
                    onChange={() => handleSelect(cat._id)}
                  />
                </td>
                <td>{index + 1}</td>
                <td style={{ paddingLeft: `${cat.level * 20}px` }}>
                  {cat.name}
                </td>
                <td>
                  {cat.parentId
                    ? categories.find((c) => c._id === cat.parentId)?.name || "Không tìm thấy"
                    : "Không"}
                </td>
                <td>
                  <input
                    type="number"
                    value={sortOrders[cat._id]}
                    onChange={(e) => handleChangeSortOrder(cat._id, e.target.value)}
                    style={{ width: "60px" }}
                  />
                </td>
                <td>
                  {cat.image ? (
                    <img
                      src={`http://localhost:8080${cat.image}`}
                      alt={cat.name}
                      style={{ width: 50, height: 50, objectFit: "cover" }}
                      onError={(e) =>
                        (e.currentTarget.src = "https://via.placeholder.com/50x50?text=No+Img")
                      }
                      loading="lazy"
                    />
                  ) : (
                    "Không có ảnh"
                  )}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant={cat.status === "active" ? "success" : "danger"}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus = cat.status === "active" ? "inactive" : "active";
                      handleToggleStatus(cat._id, newStatus);
                    }}
                  >
                    {cat.status === "active" ? <FaToggleOn /> : <FaToggleOff />}
                    <span className="ms-1">
                      {cat.status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
                    </span>
                  </Button>
                </td>
                <td>
                  <TrackingBadge 
                    createdBy={cat.createdBy}
                    updatedBy={cat.updatedBy}
                    deletedBy={cat.deletedBy}
                    showDeleted={false}
                  />
                </td>
                <td>
                  <Button variant="info" size="sm" className="me-2" onClick={() => handleView(cat)}>
                    <FaEye className="me-1" />
                    Chi tiết
                  </Button>
                  <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(cat)}>
                    <FaEdit className="me-1"/>

                    Sửa
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(cat._id)}>
                    <FaTrash   className="me-1"/>
                    Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Create
        show={showModalCreate}
        handleClose={() => setShowModalCreate(false)}
        categories={categories}
        onSuccess={handleCreateSuccess}
      />
      <ViewCategoryModal
        show={showView}
        onHide={() => setShowView(false)}
        category={selected}
      />
      <EditCategoryModal
        show={showEdit}
        onHide={() => setShowEdit(false)}
        category={selected}
        categories={categories}
        onUpdated={() => {
          setShowEdit(false);
          fetchCategories();
        }}
      />
      <ListCategoryDeleted
        show={showDeletedModal}
        handleClose={() => setShowDeletedModal(false)}
        onActionSuccess={fetchCategories}
      />
    </div>
  );
}

export default ManagerCategory;
