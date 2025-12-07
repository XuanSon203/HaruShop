import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Badge,
  Toast,
  ToastContainer,
  Modal,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Pagination from "../../../../components/paginartion/Pagination";
import Search from "../../../../components/search/Search";
import Sort from "../../../../components/sort/Sort";
import DeletedAccessoriesModal from "./DeletedAccessoriesModal";
import CreateAccessory from "./Create";
import DetailAccessory from "./Detail";
import EditAccessory from "./Edit";
import { FaTrash, FaInfoCircle, FaEdit, FaTag } from "react-icons/fa";
import { useNotification } from "../../../../components/nofication/Nofication";
import TrackingBadge from "../../../../components/tracking/TrackingBadge";
function ManagerAccessories() {
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");
  const [showModalCreate, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterType, setFilterType] = useState("Tất cả"); // Lọc theo Nổi bật/Mới
  const [category, setCategories] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
const { addNotification } = useNotification();
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
const API_BASE = `http://${window.location.hostname}:8080`;
  const [showEdit, setShowEdit] = useState(false);

  // Deleted modal
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  // Voucher modal states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalService: 0,
    limit: 5,
  });

  // Bulk actions for active list
  const [bulkAction, setBulkAction] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Toast notifications
  const [toast, setToast] = useState({
    show: false,
    message: "",
    bg: "success",
  });
  const notify = (message, bg = "success") =>
    setToast({ show: true, message, bg });

  const loadAccessories = (page = 1) => {
    fetch(
      `${API_BASE}/admin/products/accessory?page=${page}&limit=${pagination.limit}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.accessories || []);
          setPagination(res.pagination);
          setShowDeleted(res.countAccessoryDeleted);
        } else {
          console.error("API lỗi:", res.message);
        }
      })
      .catch((err) => console.error("Lỗi khi load dữ liệu:", err));
  };

  useEffect(() => {
    loadAccessories();
  }, []);

  const openDeletedModal = () => setShowDeletedModal(true);
  const closeDeletedModal = () => setShowDeletedModal(false);
 const columnStyles = {
    checkbox: { minWidth: "36px", width: "auto" },
    index: { minWidth: "40px", width: "auto", textAlign: "center" },
    image: { minWidth: "56px", width: "auto", textAlign: "center" },
    name: { minWidth: "140px", width: "auto", maxWidth: "200px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
    category: { minWidth: "100px", width: "auto", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    price: { minWidth: "100px", width: "auto", whiteSpace: "nowrap", textAlign: "right" },
    quantity: { minWidth: "76px", width: "auto", whiteSpace: "nowrap", textAlign: "center" },
    sold: { minWidth: "68px", width: "auto", whiteSpace: "nowrap", textAlign: "center" },
    shipping: { minWidth: "120px", width: "auto" },
    voucher: { minWidth: "96px", width: "auto", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    status: { minWidth: "84px", width: "auto", textAlign: "center" },
    actions: { minWidth: "140px", width: "auto", textAlign: "center" },
  };

  // Filter + search
  const filteredData = data.filter(
    (item) => {
      // Filter theo tên
      const matchSearch = (item.name || "").toLowerCase().includes((search || "").toLowerCase());
      
      // Filter theo trạng thái
      const matchStatus = filterStatus === "Tất cả" || item.status === filterStatus;
      
      // Filter theo loại (Nổi bật/Mới)
      let matchType = true;
      if (filterType === "Nổi bật") {
        matchType = item.is_featured === true || item.is_featured === "true" || item.is_featured === 1;
      } else if (filterType === "Mới") {
        matchType = item.isNew === true || item.isNew === "true" || item.isNew === 1;
      }
      
      return matchSearch && matchStatus && matchType;
    }
  );

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case "nameAsc":
        return (a.name || "").localeCompare(b.name || "");
      case "nameDesc":
        return (b.name || "").localeCompare(a.name || "");
      case "priceAsc":
        return Number(a.price || 0) - Number(b.price || 0);
      case "priceDesc":
        return Number(b.price || 0) - Number(a.price || 0);
      default:
        return 0;
    }
  });


  // Load category
  useEffect(() => {
    fetch(`${API_BASE}/admin/category`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCategories(data.categories);
        } else {
          console.error("Lỗi lấy danh mục:", data.message);
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }, []);

  const toggleSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === sortedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(sortedData.map((item) => item._id));
    }
  };

  const applyBulkAction = async () => {
    if (selectedRows.length === 0 || !bulkAction) return;
    try {
      if (bulkAction === "delete") {
        await Promise.all(
          selectedRows.map((id) =>
            fetch(
              `${API_BASE}/admin/products/accessory/deleted/${id}`,
              {
                method: "DELETE",
                credentials: "include",
              }
            )
          )
        );
        addNotification(`Đã xóa ${selectedRows.length} phụ kiện`);
      }
      if (bulkAction === "set_active" || bulkAction === "set_inactive") {
        const newStatus = bulkAction === "set_active" ? "active" : "inactive";
        await Promise.all(
          selectedRows.map((id) =>
            fetch(
              `${API_BASE}/admin/products/accessory/changeStatus/${id}/${newStatus}`,
              { method: "PUT", credentials: "include" }
            )
          )
        );
        addNotification(`Đã cập nhật trạng thái cho ${selectedRows.length} phụ kiện`);
      }
      setSelectedRows([]);
      setBulkAction("");
      loadAccessories(pagination.currentPage);
    } catch (err) {
      console.error("Lỗi áp dụng hàng loạt:", err);
      addNotification("Áp dụng hàng loạt thất bại", "danger");
    }
  };

  const handleDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEdit(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa phụ kiện này không?")) {
      try {
        const res = await fetch(
          `${API_BASE}/admin/products/accessory/deleted/${id}`,
          { method: "DELETE", credentials: "include" }
        );
        if (res.ok) {
          loadAccessories();
          addNotification("Đã xóa phụ kiện", "success");
        } else {
          addNotification("Xóa phụ kiện thất bại", "danger");
        }
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        addNotification("Lỗi khi xóa phụ kiện", "danger");
      }
    }
  };

  const handleStatusClick = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/accessory/changeStatus/${id}/${newStatus}`,
        { method: "PUT", credentials: "include" }
      );
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      const updated = await res.json();
      setData((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      addNotification(
        newStatus === "active"
          ? "Đã chuyển sang Hoạt động"
          : "Đã chuyển sang Ngưng hoạt động",
        "success"
      );
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái:", err);
      addNotification("Đổi trạng thái thất bại", "danger");
    }
  };

  const handleEditClosed = () => {
    setShowEdit(false);
    loadAccessories();
  };

  // Voucher management functions
  const handleVoucher = async (product) => {
    setSelectedProduct(product);
    setSelectedVoucher('');
    setShowVoucherModal(true);
    
    // Fetch available vouchers
    try {
      const res = await fetch(`${API_BASE}/admin/products/accessory/vouchers`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.vouchers) {
        setAvailableVouchers(data.vouchers);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setAvailableVouchers([]);
    }
  };

  const handleCloseVoucherModal = () => {
    setShowVoucherModal(false);
    setSelectedProduct(null);
    setSelectedVoucher('');
    setAvailableVouchers([]);
  };

  const handleAssignVoucher = async () => {
    if (!selectedVoucher || !selectedProduct) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/products/accessory/${selectedProduct._id}/voucher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ voucherId: selectedVoucher })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        addNotification('Đã áp dụng voucher cho sản phẩm', 'success');
        loadAccessories();
        handleCloseVoucherModal();
      } else {
        addNotification(data.message || 'Áp dụng voucher thất bại', 'danger');
      }
    } catch (error) {
      console.error('Error assigning voucher:', error);
      addNotification('Lỗi khi áp dụng voucher', 'danger');
    }
  };

  const handleRemoveVoucher = async () => {
    if (!selectedProduct) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/products/accessory/${selectedProduct._id}/voucher`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        addNotification('Đã gỡ voucher khỏi sản phẩm', 'success');
        loadAccessories();
        handleCloseVoucherModal();
      } else {
        addNotification(data.message || 'Gỡ voucher thất bại', 'danger');
      }
    } catch (error) {
      console.error('Error removing voucher:', error);
      addNotification('Lỗi khi gỡ voucher', 'danger');
    }
  };

  return (
    <div>
      <h1>Danh sách phụ kiện</h1>

      <Row className="mb-2">
        <Col md={3} sm={6} xs={12}>
          <Card bg="success" text="white" className="mb-2">
            <Card.Body>
              <Card.Title>Đang hoạt động</Card.Title>
              <Card.Text>
                {data.filter((d) => d.status === "active").length} sản phẩm
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <Card bg="secondary" text="white" className="mb-2">
            <Card.Body>
              <Card.Title>Ngưng hoạt động</Card.Title>
              <Card.Text>
                {data.filter((d) => d.status === "inactive").length} sản phẩm
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-around align-items-center px-4 mb-3 flex-wrap gap-2">
        <Search search={search} onSearchChange={setSearch} />
        <div style={{ minWidth: "150px" }}>
          <Form.Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Nổi bật">Nổi bật</option>
            <option value="Mới">Mới</option>
          </Form.Select>
        </div>
        <Sort
          options={[
            { value: "nameAsc", label: "Tên A-Z" },
            { value: "nameDesc", label: "Tên Z-A" },
            { value: "priceAsc", label: "Giá tăng dần" },
            { value: "priceDesc", label: "Giá giảm dần" },
          ]}
          onSortChange={setSortBy}
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Thêm phụ kiện
        </Button>
        <Button variant="danger" onClick={openDeletedModal}>
          <FaTrash style={{ marginRight: "6px" }} />
          Đã xóa {showDeleted}
        </Button>
      </div>

      {selectedRows.length > 0 && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <Form.Select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            style={{ maxWidth: "220px" }}
          >
            <option value="">-- Chọn hành động --</option>
            <option value="delete">Xóa (chuyển vào đã xóa)</option>
            <option value="set_active">Đặt trạng thái: Hoạt động</option>
            <option value="set_inactive">
              Đặt trạng thái: Ngưng hoạt động
            </option>
          </Form.Select>
          <Button variant="secondary" onClick={applyBulkAction}>
            Áp dụng cho {selectedRows.length} mục
          </Button>
        </div>
      )}

      <Table responsive bordered hover style={{ tableLayout: 'auto', width: '100%' }}>
        <thead>
          <tr>
            <th>
              <Form.Check
                type="checkbox"
                onChange={toggleSelectAll}
                checked={
                  selectedRows.length > 0 &&
                  selectedRows.length === sortedData.length
                }
              />
            </th>
            <th>#</th>
            <th>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Nổi bật</th>
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Đã bán</th>
            <th>Đơn vị VC</th>
            <th>Voucher</th>
            <th>Theo dõi</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={item._id}>
              <td>
                <Form.Check
                  type="checkbox"
                  checked={selectedRows.includes(item._id)}
                  onChange={() => toggleSelect(item._id)}
                />
              </td>
              <td>
                {(pagination.currentPage - 1) * pagination.limit + index + 1}
              </td>
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
              <td>
                {(() => {
                  // Kiểm tra is_featured
                  const isFeatured =
                    item.is_featured === true ||
                    item.is_featured === "true" ||
                    item.is_featured === 1 ||
                    item.is_featured === "1";
                  return isFeatured ? (
                    <Badge bg="warning" text="dark">
                      Nổi bật
                    </Badge>
                  ) : (
                    <span>-</span>
                  );
                })()}
              </td>
              <td>
                {item.category_id?.name ||
                  category.find(
                    (cat) => cat._id === (item.category_id?._id || item.category_id)
                  )?.name || "-"}
              </td>
              <td>{Number(item.price || 0).toLocaleString()} ₫</td>
              <td>{item.quantity}</td>
              <td>
                {typeof item.sold_count === "number" ? item.sold_count : 0}
              </td>
              <td>
                {item.shipping_id?.name || '-'}
              </td>
              <td>
                {item.discount_id ? (
                  <Badge bg="success" text="white">
                    {item.discount_id.code}
                  </Badge>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                <TrackingBadge 
                  createdBy={item.createdBy}
                  updatedBy={item.updatedBy}
                  size="sm"
                />
              </td>
              <td>
                <button
                  onClick={() =>
                    handleStatusClick(
                      item._id,
                      item.status === "active" ? "inactive" : "active"
                    )
                  }
                  className={`btn btn-sm text-white ${
                    item.status === "active" ? "btn-success" : "btn-danger"
                  }`}
                >
                  {item.status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
                </button>
              </td>
              <td style={columnStyles.actions} className="p-1">
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <Button
                    variant="info"
                    size="sm"
                    className="py-0 px-2"
                    title="Chi tiết"
                    onClick={() => handleDetail(item)}
                  >
                    <FaInfoCircle />
                    Chi tiết
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    className="py-0 px-2"
                    title="Sửa"
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit /> Sửa
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    className="py-0 px-2"
                    title="Voucher"
                    onClick={() => handleVoucher(item)}
                  >
                    <FaTag />
                    Voucher
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="py-0 px-2"
                    title="Xóa"
                    onClick={() => handleDelete(item._id)}
                  >
                    <FaTrash />
                    Xóa
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={11} className="text-center">
                Không có dữ liệu phù hợp
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => loadAccessories(page)}
      />

      <DeletedAccessoriesModal
        show={showDeletedModal}
        onHide={closeDeletedModal}
        onChanged={loadAccessories}
      />

      <CreateAccessory
        show={showModalCreate}
        handleClose={() => {
          setShowCreateModal(false);
          loadAccessories();
        }}
      />

      <DetailAccessory
        show={showDetail}
        handleClose={() => setShowDetail(false)}
        item={selectedItem}
      />

      <EditAccessory
        show={showEdit}
        handleClose={handleEditClosed}
        initialData={selectedItem}
      />

      {/* Voucher Modal */}
      <Modal show={showVoucherModal} onHide={handleCloseVoucherModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quản lý Voucher - {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6>Thông tin sản phẩm:</h6>
            <p><strong>Tên:</strong> {selectedProduct?.name}</p>
            <p><strong>Danh mục:</strong> {category.find((cat) => cat._id === selectedProduct?.category_id)?.name || '-'}</p>
            <p><strong>Giá:</strong> {selectedProduct?.price?.toLocaleString('vi-VN')} ₫</p>
            <p><strong>Voucher hiện tại:</strong> {selectedProduct?.discount_id ? selectedProduct.discount_id.code : 'Chưa có'}</p>
          </div>

          <div className="mb-3">
            <label className="form-label">Chọn voucher:</label>
            <Form.Select 
              value={selectedVoucher} 
              onChange={(e) => setSelectedVoucher(e.target.value)}
            >
              <option value="">-- Chọn voucher --</option>
              {availableVouchers.map((voucher) => (
                <option key={voucher._id} value={voucher._id}>
                  {voucher.code} - {voucher.name} ({voucher.value}{voucher.type === 'percent' ? '%' : '₫'})
                </option>
              ))}
            </Form.Select>
          </div>

          {availableVouchers.length === 0 && (
            <p className="text-muted mb-3">Không có voucher nào khả dụng.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseVoucherModal}>
            Đóng
          </Button>
          {selectedProduct?.discount_id && (
            <Button variant="danger" onClick={handleRemoveVoucher}>
              Gỡ voucher
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={handleAssignVoucher}
            disabled={!selectedVoucher}
          >
            Áp dụng voucher
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ManagerAccessories;

