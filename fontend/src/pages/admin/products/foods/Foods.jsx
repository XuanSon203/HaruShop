import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Toast,
  ToastContainer,
  Modal,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { FaTrash, FaInfoCircle, FaEdit, FaTag } from "react-icons/fa";
import { useNotification } from "../../../../components/nofication/Nofication";
import Pagination from "../../../../components/paginartion/Pagination";
import Search from "../../../../components/search/Search";
import Sort from "../../../../components/sort/Sort";
import CreateFood from "./Create";
import DeletedFoodsModal from "./DeletedFoodsModal";
import DetailFood from "./Detail";
import EditFood from "./Edit";
function ManagerFoods() {
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");
  const [showModalCreate, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterType, setFilterType] = useState("Tất cả"); // Lọc theo Nổi bật/Mới
  const [category, setCategories] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const [showEdit, setShowEdit] = useState(false);

  // Deleted modal
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  // Voucher modal states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const { addNotification } = useNotification();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalService: 0,
    limit: 5,
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  // Bulk actions for active list
  const [bulkAction, setBulkAction] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Load danh sách món ăn
  const loadFoods = async (page = 1) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/food?page=${page}&limit=${
          pagination.limit
        }${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        {
          method: "GET",
          credentials: "include", // Add credentials
        }
      );
      if (!res.ok) throw new Error(`Failed to fetch foods: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setData(data.foods || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalService: 0,
            limit: 5,
          }
        );
        setShowDeleted(data.countFoodDeleted || 0);
      } else {
        console.error("API error:", data.message);
        addNotification("Không thể tải danh sách món ăn", "danger");
      }
    } catch (err) {
      console.error("Error loading foods:", err);
      addNotification("Lỗi khi tải danh sách món ăn", "danger");
      setData([]);
    }
  };
  useEffect(() => {
    loadFoods();
  }, []);
  const openDeletedModal = () => setShowDeletedModal(true);
  const closeDeletedModal = () => setShowDeletedModal(false);

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
        matchType = item.isNew === true || item.isNew === "true" || item.isNew === 1 || 
                    item.is_New === true || item.is_New === "true" || item.is_New === 1;
      }
      
      return matchSearch && matchStatus && matchType;
    }
  );

  // Sort (giống services)
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

  // Chọn checkbox
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
            fetch(`${API_BASE}/admin/products/food/deleted/${id}`, {
              method: "DELETE",
              credentials: "include",
            })
          )
        );
        addNotification(`Đã xóa ${selectedRows.length} sản phẩm`, "success");
      }
      if (bulkAction === "set_active" || bulkAction === "set_inactive") {
        const newStatus = bulkAction === "set_active" ? "active" : "inactive";
        await Promise.all(
          selectedRows.map((id) =>
            fetch(
              `${API_BASE}/admin/products/food/changeStatus/${id}/${newStatus}`,
              { method: "PUT", credentials: "include" }
            )
          )
        );
        addNotification(
          `Đã cập nhật trạng thái cho ${selectedRows.length} sản phẩm`,
          "success"
        );
      }
      setSelectedRows([]);
      setBulkAction("");
      loadFoods(pagination.currentPage);
    } catch (err) {
      console.error("Lỗi áp dụng hàng loạt:", err);
      addNotification("Áp dụng hàng loạt thất bại", "danger");
    }
  };

  // Chi tiết
  const handleDetail = (food) => {
    setSelectedFood(food);
    setShowDetail(true);
  };

  // Sửa
  const handleEdit = (food) => {
    setSelectedFood(food);
    setShowEdit(true);
  };

  // Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
      try {
        const res = await fetch(
          `${API_BASE}/admin/products/food/deleted/${id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (res.ok) {
          loadFoods();
          addNotification("Đã xóa sản phẩm", "success");
        } else {
          addNotification("Xóa sản phẩm thất bại", "danger");
        }
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        addNotification("Lỗi khi xóa sản phẩm", "danger");
      }
    }
  };

  // Đổi trạng thái
  const handleStatusClick = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/food/changeStatus/${id}/${newStatus}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");

      const updatedService = await res.json();

      setData((prev) =>
        prev.map((u) => (u._id === updatedService._id ? updatedService : u))
      );
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

  // Voucher management functions
  const handleVoucher = async (product) => {
    setSelectedProduct(product);
    setSelectedVoucher("");
    setShowVoucherModal(true);

    // Fetch available vouchers
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/food/vouchers`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success && data.vouchers) {
        setAvailableVouchers(data.vouchers);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setAvailableVouchers([]);
    }
  };

  const handleCloseVoucherModal = () => {
    setShowVoucherModal(false);
    setSelectedProduct(null);
    setSelectedVoucher("");
    setAvailableVouchers([]);
  };

  const handleAssignVoucher = async () => {
    if (!selectedVoucher || !selectedProduct) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/products/food/${selectedProduct._id}/voucher`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ voucherId: selectedVoucher }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        addNotification("Đã áp dụng voucher cho sản phẩm", "success");
        loadFoods();
        handleCloseVoucherModal();
      } else {
        addNotification(data.message || "Áp dụng voucher thất bại", "danger");
      }
    } catch (error) {
      console.error("Error assigning voucher:", error);
      addNotification("Lỗi khi áp dụng voucher", "danger");
    }
  };

  const handleRemoveVoucher = async () => {
    if (!selectedProduct) return;
const API_BASE = `http://${window.location.hostname}:8080`;
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/food/${selectedProduct._id}/voucher`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        addNotification("Đã gỡ voucher khỏi sản phẩm", "success");
        loadFoods();
        handleCloseVoucherModal();
      } else {
        addNotification(data.message || "Gỡ voucher thất bại", "danger");
      }
    } catch (error) {
      console.error("Error removing voucher:", error);
      addNotification("Lỗi khi gỡ voucher", "danger");
    }
  };

  // Helper: Resolve category name robustly from various possible shapes
  const getCategoryName = (item) => {
    if (!item) return "-";
    // Direct embedded category object
    if (item.category && item.category.name) return item.category.name;
    // category_id may be populated object
    if (item.category_id && typeof item.category_id === "object") {
      if (item.category_id.name) return item.category_id.name;
      const id = item.category_id._id || item.category_id.id;
      const found = category.find((cat) => cat._id === id || cat.id === id);
      return found?.name || "-";
    }
    // category_id may be a string id
    const id = item.category_id;
    const found = category.find((cat) => cat._id === id || cat.id === id);
    return found?.name || "-";
  };

  // Column styles với min-width để tự động fit nội dung
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

  return (
    <div>
      <h1>Danh sách đồ ăn</h1>

      {/* Thống kê */}
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

      {/* Filter - Search - Sort */}
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
          + Thêm món ăn
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

      {/* Bảng */}
      <Table responsive bordered hover className="table-sm align-middle" style={{ tableLayout: "auto", width: "100%" }}>
        <thead>
          <tr>
            <th style={columnStyles.checkbox}>
              <Form.Check
                type="checkbox"
                onChange={toggleSelectAll}
                checked={
                  selectedRows.length > 0 &&
                  selectedRows.length === sortedData.length
                }
              />
            </th>
            <th style={columnStyles.index}>#</th>
            <th style={columnStyles.image}>Ảnh</th>
            <th style={columnStyles.name}>Tên sản phẩm</th>
            <th style={{ minWidth: "100px", width: "auto", textAlign: "center" }}>Nổi bật</th>
            <th style={{ minWidth: "80px", width: "auto", textAlign: "center" }}>Mới</th>
            <th style={columnStyles.category}>Danh mục</th>
            <th style={columnStyles.price}>Giá</th>
            <th style={columnStyles.quantity}>Số lượng</th>
            <th style={columnStyles.sold}>Đã bán</th>
            <th style={columnStyles.shipping}>Vận chuyển</th>
            <th style={columnStyles.voucher}>Voucher</th>
            <th style={columnStyles.status}>Trạng thái</th>
            <th style={columnStyles.actions}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={item._id}>
              <td style={columnStyles.checkbox} className="p-1">
                <Form.Check
                  type="checkbox"
                  checked={selectedRows.includes(item._id)}
                  onChange={() => toggleSelect(item._id)}
                />
              </td>
              <td style={columnStyles.index} className="p-1">
                {(pagination.currentPage - 1) * pagination.limit + index + 1}
              </td>
              <td style={columnStyles.image} className="p-1">
                {item.thumbnail && (
                  <img
                    src={`${API_BASE}/uploads/products/foods/${item.thumbnail}`}
                    alt={item.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                    }}
                  />
                )}
              </td>

              <td style={{...columnStyles.name}} className="p-1" title={item.name}>{item.name}</td>
              <td className="p-1 text-center">
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
                    <span className="text-muted">-</span>
                  );
                })()}
              </td>
              <td className="p-1 text-center">
                {(() => {
                  // Kiểm tra isNew hoặc is_New
                  const isNew =
                    item.isNew === true ||
                    item.isNew === "true" ||
                    item.isNew === 1 ||
                    item.isNew === "1" ||
                    item.is_New === true ||
                    item.is_New === "true" ||
                    item.is_New === 1 ||
                    item.is_New === "1";
                  return isNew ? (
                    <Badge bg="success" text="white">
                      Mới
                    </Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  );
                })()}
              </td>
              <td style={columnStyles.category} className="p-1">
                {getCategoryName(item)}
              </td>

              <td style={columnStyles.price} className="p-1">{item.price.toLocaleString()} ₫</td>
              <td style={columnStyles.quantity} className="p-1">{item.quantity}</td>
              <td style={columnStyles.sold} className="p-1">
                {typeof item.sold_count === "number" ? item.sold_count : 0}
              </td>
              <td style={columnStyles.shipping} className="p-1">
                <div style={{lineHeight: 1.1}}>
                  <div>{item.shipping_id?.name || "-"}</div>
                  <small className="text-muted">
                    {typeof item.shipping_id?.price === "number"
                      ? `${item.shipping_id.price.toLocaleString("vi-VN")} ₫`
                      : "-"}
                  </small>
                </div>
              </td>
              <td style={columnStyles.voucher} className="p-1">
                {item.discount_id ? (
                  <Badge bg="success" text="white">
                    {item.discount_id.code}
                  </Badge>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td style={columnStyles.status} className="p-1 text-center">
                <button
                  onClick={() =>
                    handleStatusClick(
                      item._id,
                      item.status === "active" ? "inactive" : "active"
                    )
                  }
                  className={`btn btn-sm py-0 px-2 text-white ${
                    item.status === "active" ? "btn-success" : "btn-danger"
                  }`}
                >
                  {item.status === "active" ? "Active" : "Inactive"}
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
              <td colSpan={12} className="text-center">
                Không có dữ liệu phù hợp
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal tạo */}
      <CreateFood
        show={showModalCreate}
        handleClose={() => {
          setShowCreateModal(false);
          loadFoods();
        }}
        onSuccess={(msg) => addNotification(msg, "success")}
        onError={(msg) => addNotification(msg, "danger")}
      />

      {/* Modal chi tiết */}
      <DetailFood
        show={showDetail}
        handleClose={() => setShowDetail(false)}
        food={selectedFood}
      />

      {/* Modal sửa */}
      <EditFood
        show={showEdit}
        handleClose={() => {
          setShowEdit(false);
          loadFoods();
        }}
        initialData={selectedFood}
        onSuccess={(msg) => addNotification(msg, "success")}
        onError={(msg) => addNotification(msg, "danger")}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => loadFoods(page)}
      />

      <DeletedFoodsModal
        show={showDeletedModal}
        onHide={closeDeletedModal}
        onChanged={loadFoods}
      />

      {/* Voucher Modal */}
      <Modal show={showVoucherModal} onHide={handleCloseVoucherModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quản lý Voucher - {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6>Thông tin sản phẩm:</h6>
            <p>
              <strong>Tên:</strong> {selectedProduct?.name}
            </p>
            <p>
              <strong>Danh mục:</strong>{" "}
              {category.find((cat) => cat._id === selectedProduct?.category_id)
                ?.name || "-"}
            </p>
            <p>
              <strong>Giá:</strong>{" "}
              {selectedProduct?.price?.toLocaleString("vi-VN")} ₫
            </p>
            <p>
              <strong>Voucher hiện tại:</strong>{" "}
              {selectedProduct?.discount_id
                ? selectedProduct.discount_id.code
                : "Chưa có"}
            </p>
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
                  {voucher.code} - {voucher.name} ({voucher.value}
                  {voucher.type === "percent" ? "%" : "₫"})
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

export default ManagerFoods;
