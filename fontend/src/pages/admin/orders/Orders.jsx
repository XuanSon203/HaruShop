import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Image,
  InputGroup,
  Modal,
  Pagination,
  Spinner,
  Table,
} from "react-bootstrap";

const STATUS_COLORS = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  completed: "success",
  cancelled: "danger",
  returned: "secondary",
};

const STATUS_LABELS = {
  pending: "Đang chờ",
  processing: "Đang xử lý",
  shipped: "Đã giao cho DVVC",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  returned: "Hoàn hàng",
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [selected, setSelected] = useState(null);
  const [returnFilter, setReturnFilter] = useState("all");
  const [shippingProviders, setShippingProviders] = useState([]);
  const [shippingFilter, setShippingFilter] = useState("all");
  const [shippingSummary, setShippingSummary] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
    returned: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const getShippingInfo = () => {
    const method = selected?.shipping_id?.methods?.[0];

    return {
      name: method?.name || "Không xác định",
      price: method?.price || 0,
      estimated: method?.estimated_time || "",
    };
  };

  const { name, price, estimated } = getShippingInfo();
  const loadOrders = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError("");
      let url = `http://localhost:8080/admin/orders?page=${pageNum}&limit=10`;
      if (showDeleted) url += `&deleted=true`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (range !== "all") url += `&range=${range}`;
      if (range === "custom" && from && to) url += `&from=${from}&to=${to}`;
      if (returnFilter !== "all") url += `&isReturned=${returnFilter}`;
      if (shippingFilter !== "all") url += `&shipping_id=${shippingFilter}`;
      if (keyword.trim()) url += `&keyword=${encodeURIComponent(keyword.trim())}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Không thể tải đơn hàng");

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      if (
        Array.isArray(data.shippingProviders) &&
        data.shippingProviders.length > 0
      ) {
        setShippingProviders(data.shippingProviders);
      }
      // Backend returns statusSummary: [{ status, count }]
      const base = {
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
        returned: 0,
      };
      if (Array.isArray(data.statusSummary)) {
        data.statusSummary.forEach((s) => {
          if (s && s.status && typeof s.count === "number") {
            base[s.status] = s.count;
          }
        });
      }
      setStats(base);
      setTotalRevenue(Number(data.totalRevenue || 0));
      setShippingSummary(
        Array.isArray(data.shippingSummary) ? data.shippingSummary : []
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page);
  }, [
    page,
    statusFilter,
    range,
    from,
    to,
    returnFilter,
    shippingFilter,
    showDeleted,
    keyword,
  ]);

  useEffect(() => {
    // load shipping providers for filter
    (async () => {
      try {
        // Try admin list first (includes all providers), then fall back to public list
        let list = [];
        try {
          const adminRes = await fetch(
            "http://localhost:8080/admin/shipping?deleted=false",
            { credentials: "include" }
          );
          const adminData = await adminRes.json();
          if (
            adminRes.ok &&
            adminData &&
            (Array.isArray(adminData.items) || Array.isArray(adminData.list))
          ) {
            list = adminData.items || adminData.list || [];
          }
        } catch (_) {}
        if (!Array.isArray(list) || list.length === 0) {
          try {
            const pubRes = await fetch("http://localhost:8080/shipping");
            const pubData = await pubRes.json();
            const arr =
              pubData.items ||
              pubData.list ||
              pubData.shippings ||
              pubData.data;
            if (pubRes.ok && Array.isArray(arr)) list = arr;
          } catch (_) {}
        }
        setShippingProviders(Array.isArray(list) ? list : []);
      } catch (_) {}
    })();
  }, []);

  // Ensure names appear in shipping summary even if the initial list was empty
  useEffect(() => {
    (async () => {
      try {
        if (!Array.isArray(shippingSummary) || shippingSummary.length === 0)
          return;
        const knownIds = new Set(
          (shippingProviders || []).map((p) => String(p._id))
        );
        const missingIds = shippingSummary
          .map((s) => String(s._id))
          .filter((id) => id && !knownIds.has(id));
        if (missingIds.length === 0) return;
        const fetches = missingIds
          .filter((id) => id && id !== "null" && id !== "undefined")
          .map(async (id) => {
            // Try admin endpoint first (works even if provider is inactive)
            try {
              const ra = await fetch(
                `http://localhost:8080/admin/shipping/${id}`,
                { credentials: "include" }
              );
              const da = await ra.json();
              const itemA = da.item || da.shipping || da.data;
              if (ra.ok && itemA && itemA._id) return itemA;
            } catch (_) {}
            // Fallback to public endpoint
            try {
              const rp = await fetch(`http://localhost:8080/shipping/${id}`);
              const dp = await rp.json();
              const itemP = dp.item || dp.shipping || dp.data;
              if (rp.ok && itemP && itemP._id) return itemP;
            } catch (_) {}
            return null;
          });
        const results = (await Promise.all(fetches)).filter(Boolean);
        if (results.length > 0) {
          // Merge unique by _id
          const mergedMap = new Map();
          [...shippingProviders, ...results].forEach((p) => {
            if (p && p._id) mergedMap.set(String(p._id), p);
          });
          setShippingProviders(Array.from(mergedMap.values()));
        }
      } catch (_) {}
    })();
  }, [shippingSummary]);

  const handleChangeStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(
        `http://localhost:8080/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật trạng thái thất bại");
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
      );
      setSavedMsg("Đã cập nhật trạng thái đơn hàng");
      setTimeout(() => setSavedMsg(""), 1500);
    } catch (e) {
      alert(e.message || "Lỗi cập nhật trạng thái");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa đơn hàng thất bại");
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
      setSavedMsg("Đã xóa đơn hàng");
      setTimeout(() => setSavedMsg(""), 1500);
    } catch (e) {
      alert(e.message || "Lỗi xóa đơn hàng");
    }
  };

  const handlePermanentDelete = async (orderId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn XÓA HOÀN TOÀN đơn hàng này? Hành động này không thể hoàn tác!"
      )
    )
      return;
    try {
      const res = await fetch(
        `http://localhost:8080/admin/orders/${orderId}/permanent`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa hoàn toàn đơn hàng thất bại");
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setSavedMsg("Đã xóa hoàn toàn đơn hàng");
      setTimeout(() => setSavedMsg(""), 1500);
      setSelectedOrders([]);
    } catch (e) {
      alert(e.message || "Lỗi xóa hoàn toàn đơn hàng");
    }
  };

  // Xử lý chọn/bỏ chọn đơn hàng
  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Xử lý chọn tất cả
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedOrders(orders.map((o) => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Xóa nhiều đơn hàng
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedOrders.length} đơn hàng đã chọn?`
      )
    )
      return;
    try {
      const res = await fetch(`http://localhost:8080/admin/orders/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedOrders }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa nhiều đơn hàng thất bại");
      setOrders((prev) => prev.filter((o) => !selectedOrders.includes(o._id)));
      setSelectedOrders([]);
      setSelectAll(false);
      setSavedMsg(
        `Đã xóa ${data.deletedCount || selectedOrders.length} đơn hàng`
      );
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      alert(e.message || "Lỗi xóa nhiều đơn hàng");
    }
  };

  // Xóa hoàn toàn nhiều đơn hàng
  const handleBulkPermanentDelete = async () => {
    if (selectedOrders.length === 0) {
      alert("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA HOÀN TOÀN ${selectedOrders.length} đơn hàng đã chọn? Hành động này không thể hoàn tác!`
      )
    )
      return;
    try {
      const res = await fetch(
        `http://localhost:8080/admin/orders/bulk/permanent`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ids: selectedOrders }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(
          data.message || "Xóa hoàn toàn nhiều đơn hàng thất bại"
        );
      setOrders((prev) => prev.filter((o) => !selectedOrders.includes(o._id)));
      setSelectedOrders([]);
      setSelectAll(false);
      setSavedMsg(
        `Đã xóa hoàn toàn ${
          data.deletedCount || selectedOrders.length
        } đơn hàng`
      );
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      alert(e.message || "Lỗi xóa hoàn toàn nhiều đơn hàng");
    }
  };

  // Cập nhật trạng thái nhiều đơn hàng
  const handleBulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) {
      alert("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn cập nhật trạng thái của ${selectedOrders.length} đơn hàng đã chọn thành "${status}"?`
      )
    )
      return;
    try {
      const res = await fetch(
        `http://localhost:8080/admin/orders/bulk/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ids: selectedOrders, status }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật trạng thái thất bại");
      // Cập nhật trạng thái trong state
      setOrders((prev) =>
        prev.map((o) => (selectedOrders.includes(o._id) ? { ...o, status } : o))
      );
      setSelectedOrders([]);
      setSelectAll(false);
      setSavedMsg(
        `Đã cập nhật trạng thái ${
          data.updatedCount || selectedOrders.length
        } đơn hàng`
      );
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      alert(e.message || "Lỗi cập nhật trạng thái");
    }
  };

  // Reset selection khi đổi chế độ xem
  useEffect(() => {
    setSelectedOrders([]);
    setSelectAll(false);
  }, [showDeleted]);

  // Tự động cập nhật selectAll khi selectedOrders thay đổi
  useEffect(() => {
    if (orders.length > 0) {
      setSelectAll(
        selectedOrders.length === orders.length && orders.length > 0
      );
    } else {
      setSelectAll(false);
    }
  }, [selectedOrders, orders]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>
          {i}
        </Pagination.Item>
      );
    }
    return <Pagination className="mt-3">{items}</Pagination>;
  };

  const totalStatusCount = Object.values(stats).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

 

  const getShortCode = (id) =>
    id ? `#${String(id).slice(-5).toUpperCase()}` : "N/A";

  const handleStatusTabClick = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <h3 className="mb-0">Đơn hàng</h3>
          <Button
            variant={showDeleted ? "danger" : "outline-secondary"}
            onClick={() => {
              setShowDeleted(!showDeleted);
              setPage(1);
            }}
            title={
              showDeleted ? "Xem đơn hàng bình thường" : "Xem đơn hàng đã xóa"
            }
          >
            <i className={`fas ${showDeleted ? "fa-undo" : "fa-trash"}`}></i>
            {showDeleted ? " Đơn đã xóa" : " Thùng rác"}
          </Button>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Form.Select
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
            style={{ width: 240 }}
          >
            <option value="all">Tất cả đơn vị vận chuyển</option>
            {shippingProviders.map((sp) => (
              <option key={sp._id} value={sp._id}>
                {sp.name}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 220 }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipped">Đã giao cho DVVC</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
            <option value="returned">Hoàn hàng</option>
          </Form.Select>

          <Form.Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
            <option value="custom">Khoảng ngày...</option>
          </Form.Select>

          <Form.Select
            value={returnFilter}
            onChange={(e) => setReturnFilter(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="all">Tất cả đơn hàng</option>
            <option value="false">Đơn hàng thường</option>
            <option value="true">Đơn hàng hoàn</option>
          </Form.Select>

          {range === "custom" && (
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span className="text-muted">đến</span>
              <Form.Control
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => loadOrders(1)}>
                Lọc
              </Button>
            </div>
          )}
          <Form onSubmit={(e) => {
            e.preventDefault();
            setKeyword(keywordInput.trim());
            setPage(1);
          }}>
            <InputGroup style={{ minWidth: 280 }}>
              <Form.Control
                placeholder="SĐT hoặc 5 ký tự cuối mã đơn"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <Button type="submit" variant="primary">
                <i className="fas fa-search me-1"></i>
                Tìm
              </Button>
              {keyword && (
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setKeywordInput("");
                    setPage(1);
                  }}
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </InputGroup>
          </Form>
        </div>
      </div>

    
      {showDeleted && (
        <Alert variant="warning" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Bạn đang xem danh sách đơn hàng đã xóa. Để xem đơn hàng bình thường,
          hãy click nút "Thùng rác" ở trên.
        </Alert>
      )}

      {/* Stats cards - chỉ hiển thị khi không xem đơn đã xóa */}
      {!showDeleted && (
        <div className="row g-3 mb-3">
          {[
            { key: "pending", label: "Đang chờ", variant: "warning" },
            { key: "processing", label: "Đang xử lý", variant: "info" },
            { key: "shipped", label: "Đã giao DVVC", variant: "primary" },
            { key: "completed", label: "Hoàn tất", variant: "success" },
            { key: "cancelled", label: "Đã hủy", variant: "danger" },
            { key: "returned", label: "Hoàn hàng", variant: "secondary" },
          ].map((s) => (
            <div className="col-6 col-md-4 col-lg-2" key={s.key}>
              <div
                className={`border rounded p-3 text-${s.variant}`}
                style={{ background: "#fff" }}
              >
                <div className="small text-muted">{s.label}</div>
                <div className="fs-4 fw-bold">{stats[s.key] || 0}</div>
              </div>
            </div>
          ))}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="border rounded p-3" style={{ background: "#fff" }}>
              <div className="small text-muted">Tổng doanh thu (theo lọc)</div>
              <div className="fs-4 fw-bold text-success">
                {Number(totalRevenue).toLocaleString("vi-VN")} ₫
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="border rounded p-3" style={{ background: "#fff" }}>
              <div className="small text-muted mb-2">
                Thống kê theo đơn vị vận chuyển
              </div>
              <div className="d-flex flex-wrap gap-2">
                {shippingSummary.length === 0 && (
                  <span className="text-muted small">Không có dữ liệu</span>
                )}
                {shippingSummary.map((s) => {
                  const sp = shippingProviders.find(
                    (p) => String(p._id) === String(s._id)
                  );
                  const name =
                    s.name || sp?.name || (s._id ? String(s._id) : "N/A");
                  return (
                    <Badge key={String(s._id)} bg="secondary" className="p-2">
                      {name}: {s.count} đơn
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {savedMsg && (
        <Alert 
          key="saved-msg" 
          variant="success" 
          className="py-2 mb-2"
          dismissible
          onClose={() => setSavedMsg("")}
        >
          {savedMsg}
        </Alert>
      )}
      {error && (
        <Alert 
          key="error-msg" 
          variant="danger"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* Bulk actions toolbar */}
          {selectedOrders.length > 0 && (
            <div className="d-flex align-items-center gap-2 mb-3 p-3 bg-light rounded">
              <strong className="text-primary">
                Đã chọn: {selectedOrders.length} đơn hàng
              </strong>
              {!showDeleted ? (
                <>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small">Cập nhật trạng thái:</span>
                    <Form.Select
                      defaultValue=""
                      onChange={(e) => {
                        const status = e.target.value;
                        if (status) {
                          handleBulkUpdateStatus(status);
                          e.target.value = ""; // Reset dropdown
                        }
                      }}
                    >
                      <option value="">-- Chọn trạng thái --</option>
                      <option value="pending">Đang chờ</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipped">Đã giao cho DVVC</option>
                      <option value="completed">Hoàn tất</option>
                      <option value="cancelled">Đã hủy</option>
                      <option value="returned">Hoàn hàng</option>
                    </Form.Select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={handleBulkDelete}
                  >
                    <i className="fas fa-trash me-1"></i>
                    Xóa ({selectedOrders.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      setSelectedOrders([]);
                      setSelectAll(false);
                    }}
                  >
                    <i className="fas fa-times me-1"></i>
                    Bỏ chọn
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleBulkPermanentDelete}
                  >
                    <i className="fas fa-trash-alt me-1"></i>
                    Xóa hoàn toàn ({selectedOrders.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      setSelectedOrders([]);
                      setSelectAll(false);
                    }}
                  >
                    <i className="fas fa-times me-1"></i>
                    Bỏ chọn
                  </Button>
                </>
              )}
            </div>
          )}
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>
                  <Form.Check
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    title="Chọn tất cả"
                  />
                </th>
                <th>#</th>
                <th>Mã ngắn</th>
                <th>Thông tin khách hàng</th>
                <th>Tài khoản đặt hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th colSpan={2}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o._id}>
                  <td>
                    <Form.Check
                      checked={selectedOrders.includes(o._id)}
                      onChange={() => handleSelectOrder(o._id)}
                    />
                  </td>
                  <td>{(page - 1) * 10 + idx + 1}</td>
                  <td>
                    <span className="fw-semibold">{getShortCode(o._id)}</span>
                  </td>
                  <td>
                    <div className="fw-semibold">
                      {o.customer_info?.fullName ||
                        o.customer_info?.name ||
                        o.customer?.fullName ||
                        o.customer?.name ||
                        "Chưa có thông tin"}
                    </div>
                    <div className="text-muted small">
                      {o.customer_info?.phone ||
                        o.customer_info?.phoneNumber ||
                        o.customer?.phone ||
                        o.customer?.phoneNumber ||
                        ""}
                    </div>
                    <div className="text-muted small">
                      {o.customer_info?.email || o.customer?.email || ""}
                    </div>
                  </td>
                  <td>
                    <div className="fw-semibold text-primary">
                      <i className="fas fa-user me-1"></i>
                      {o.user_id?.fullName || "Chưa có tài khoản"}
                    </div>
                    <div className="text-muted small">
                      <i className="fas fa-envelope me-1"></i>
                      {o.user_id?.email || "Không có email"}
                    </div>
                    {o.user_id?.phone && (
                      <div className="text-muted small">
                        <i className="fas fa-phone me-1"></i>
                        {o.user_id.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="small text-muted">
                      {o.products?.length} sản phẩm
                    </div>
                  </td>
                  <td className="fw-semibold">
                    {Number(o.summary?.total || 0).toLocaleString("vi-VN")} ₫
                  </td>
                  <td>
                    <div>
                      <Badge bg={STATUS_COLORS[o.status] || "secondary"}>
                        {o.return_request?.isReturned ? "Hoàn hàng" : (STATUS_LABELS[o.status] || o.status)}
                      </Badge>
                      {o.return_request?.isReturned && o.return_request?.return_reason && (
                        <div className="mt-1">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            <i className="fas fa-info-circle me-1"></i>
                            Lý do: {o.return_request.return_reason}
                          </small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td colSpan={2}>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {/* XEM */}
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => setSelected(o)}
                        title="Xem chi tiết đơn hàng"
                      >
                        <i className="fas fa-eye me-1"></i> Xem
                      </Button>

                      {/* DROPDOWN CẬP NHẬT TRẠNG THÁI */}
                      {!showDeleted && (
                        <Form.Select
                          size="sm"
                          className="w-auto"
                          style={{ minWidth: "160px" }}
                          value={
                            o.return_request?.isReturned ? "returned" : o.status
                          }
                          disabled={
                            updatingId === o._id || o.return_request?.isReturned
                          }
                          onChange={(e) =>
                            handleChangeStatus(o._id, e.target.value)
                          }
                        >
                          <option value="pending">Đang chờ</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="shipped">Đã giao DVVC</option>
                          <option value="completed">Hoàn tất</option>
                          <option value="cancelled">Đã hủy</option>
                          <option value="returned">Hoàn hàng</option>
                        </Form.Select>
                      )}

                      {/* XÓA MỀM */}
                      {!showDeleted &&
                        !o.return_request?.isReturned &&
                        o.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={updatingId === o._id}
                            onClick={() => handleDelete(o._id)}
                            title="Chuyển vào thùng rác"
                          >
                            {updatingId === o._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>
                                <i className="fas fa-trash me-1"></i>
                                Xóa
                              </>
                            )}
                          </Button>
                        )}

                      {/* XÓA VĨNH VIỄN */}
                      {showDeleted && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handlePermanentDelete(o._id)}
                          title="Xóa hoàn toàn đơn hàng"
                        >
                          <i className="fas fa-trash-alt me-1"></i>
                          Xóa hoàn toàn
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
      {renderPagination()}

      {/* Order detail modal */}
      <Modal
        show={!!selected}
        onHide={() => setSelected(null)}
        size="lg"
        centered
        key={selected?._id || 'order-modal'}
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected ? (
            <div>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">Mã đơn hàng: {selected._id}</div>
                  <div className="text-muted small">
                    <strong>Ngày tạo:</strong>{" "}
                    {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </div>
                  <div className="text-muted small">
                    <strong>Cập nhật lần cuối:</strong>{" "}
                    {selected.updatedAt
                      ? new Date(selected.updatedAt).toLocaleString("vi-VN")
                      : "Chưa cập nhật"}
                  </div>
                  <div className="text-muted small">
                    <strong>Phương thức thanh toán:</strong>{" "}
                    {selected.payment_id?.name || "Chưa xác định"}
                  </div>
                  <div className="text-muted small">
                    <strong>Đơn vị shipping:</strong>{" "}
                    {selected.shipping_id?.name || "Chưa xác định"}
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded">
                    <div className="fw-semibold mb-2">Thông tin khách hàng</div>
                    <div className="mb-2">
                      <strong>Tên:</strong>{" "}
                      {selected.customer_info?.fullName ||
                        selected.customer_info?.name ||
                        selected.customer?.fullName ||
                        selected.customer?.name ||
                        "Chưa có thông tin"}
                    </div>
                    <div className="mb-2">
                      <strong>Số điện thoại:</strong>{" "}
                      {selected.customer_info?.phone ||
                        selected.customer_info?.phoneNumber ||
                        selected.customer?.phone ||
                        selected.customer?.phoneNumber ||
                        "Không có thông tin"}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong>{" "}
                      {selected.customer_info?.email ||
                        selected.customer?.email ||
                        "Không có thông tin"}
                    </div>
                    <div className="mb-2">
                      <strong>Địa chỉ:</strong>{" "}
                      {selected.customer_info?.address ||
                        selected.customer_info?.shippingAddress ||
                        selected.customer?.address ||
                        selected.customer?.shippingAddress ||
                        "Không có thông tin"}
                    </div>
                    <div className="mb-2">
                      <strong>Ghi chú:</strong>{" "}
                      {selected.customer_info?.note ||
                        selected.customer_info?.notes ||
                        selected.customer?.note ||
                        selected.customer?.notes ||
                        "Không có ghi chú"}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded">
                    <div className="fw-semibold mb-2">Thông tin tài khoản</div>
                    <div className="mb-2">
                      <strong>Tên:</strong>{" "}
                      {selected.user_id?.fullName || "Chưa có tài khoản"}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong>{" "}
                      {selected.user_id?.email || "Không có thông tin"}
                    </div>
                    <div className="mb-2">
                      <strong>Số điện thoại:</strong>{" "}
                      {selected.user_id?.phone || "Không có thông tin"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3 p-3 border rounded">
                <div className="fw-semibold mb-2">
                  Sản phẩm ({selected.products?.length})
                </div>
                <Table size="sm" responsive>
                  <thead>
                    <tr>
                      <th>Mã đơn </th>
                      <th>Sản phẩm</th>
                      <th>SL</th>
                      <th>Đơn giá</th>
                      <th>Giảm</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.products?.map((p, i) => (
                      <tr key={`product-${selected._id}-${p.product_id || i}-${i}`}>
                        <td>{p._id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {p.product_info?.thumbnail && (
                              <Image
                                src={`http://localhost:8080/uploads/products/foods/${p.product_info.thumbnail}`}
                                width={40}
                                height={40}
                                rounded
                              />
                            )}
                            <div>
                              <div className="fw-semibold">
                                {p.product_info?.name || p.product_id}
                              </div>
                              <div className="text-muted small">
                                Loại: {p.product_info?.type || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{p.quantity}</td>
                        <td>{Number(p.price).toLocaleString("vi-VN")} ₫</td>
                        <td>
                          {Number(p.discount || 0).toLocaleString("vi-VN")} ₫
                        </td>
                        <td>{Number(p.amount).toLocaleString("vi-VN")} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="border-top pt-3">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tạm tính:</span>
                        <strong>
                          {Number(
                            selected.summary?.subtotal || 0
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Giảm giá voucher:</span>
                        <strong className="text-danger">
                          -
                          {Number(
                            selected.summary?.voucher_discount || 0
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Phương thức vận chuyển:</span>
                        <strong>{name}</strong>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span>Phí vận chuyển:</span>
                        <strong>{price.toLocaleString("vi-VN")} ₫</strong>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span>Thời gian dự kiến:</span>
                        <strong>{estimated} ngày</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Số lượng sản phẩm:</span>
                        <strong>
                          {selected.products?.length || 0} sản phẩm
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tổng số lượng:</span>
                        <strong>
                          {selected.products?.reduce(
                            (sum, p) => sum + (p.quantity || 0),
                            0
                          )}{" "}
                          món
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Trạng thái hiện tại:</span>
                        <Badge
                          bg={STATUS_COLORS[selected.status] || "secondary"}
                        >
                          {selected.return_request?.isReturned
                            ? "Hoàn hàng"
                            : (STATUS_LABELS[selected.status] || selected.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin hoàn hàng */}
                  {selected.return_request?.isReturned && (
                    <div className="mb-3 p-3 border rounded" style={{ background: '#fff3cd' }}>
                      <div className="fw-semibold mb-2 text-warning">
                        <i className="fas fa-undo me-2"></i>
                        Thông tin hoàn hàng
                      </div>
                      {selected.return_request.return_reason && (
                        <div className="mb-2">
                          <strong>Lý do hoàn hàng:</strong>
                          <div className="mt-1 p-2 bg-white rounded border">
                            {selected.return_request.return_reason}
                          </div>
                        </div>
                      )}
                      {selected.return_request.return_description && (
                        <div className="mb-2">
                          <strong>Mô tả chi tiết:</strong>
                          <div className="mt-1 p-2 bg-white rounded border">
                            {selected.return_request.return_description}
                          </div>
                        </div>
                      )}
                      {selected.return_request.requested_at && (
                        <div className="mb-2">
                          <strong>Ngày yêu cầu:</strong>
                          <div className="mt-1 text-muted small">
                            {new Date(selected.return_request.requested_at).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      )}
                      {selected.return_request.status && (
                        <div className="mb-2">
                          <strong>Trạng thái yêu cầu:</strong>
                          <Badge 
                            bg={
                              selected.return_request.status === 'approved' ? 'success' :
                              selected.return_request.status === 'rejected' ? 'danger' :
                              'warning'
                            }
                            className="ms-2"
                          >
                            {selected.return_request.status === 'approved' ? 'Đã duyệt' :
                             selected.return_request.status === 'rejected' ? 'Đã từ chối' :
                             'Đang chờ xử lý'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-top pt-3 mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Tổng cộng:</h5>
                      <h4 className="mb-0 text-success">
                        {Number(selected.summary?.total || 0).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        ₫
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update History */}
              {selected.updatedBy && selected.updatedBy.length > 0 && (
                <div className="mb-3 p-3 border rounded">
                  <div className="fw-semibold mb-3">
                    <i className="fas fa-history me-2"></i>
                    Lịch sử cập nhật
                  </div>
                  <div className="bg-light rounded p-3">
                    {selected.updatedBy.map((update, index) => (
                      <div
                        key={`update-${selected._id}-${index}-${update.updatedAt || index}`}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <span className="fw-medium">
                            <i className="fas fa-user me-1"></i>
                            {update.user_info?.fullName ||
                              update.account_id ||
                              "Hệ thống"}
                          </span>
                          <small className="text-muted ms-2">
                            <i className="fas fa-clock me-1"></i>
                            {new Date(update.updatedAt).toLocaleString("vi-VN")}
                          </small>
                        </div>
                        <Badge bg="info" className="px-2 py-1">
                          Cập nhật #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center">
                {showDeleted ? (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <div>Trạng thái:</div>
                      <Badge bg="secondary" className="px-3 py-2">
                        Đã xóa
                      </Badge>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Bạn có chắc chắn muốn XÓA HOÀN TOÀN đơn hàng này? Hành động này không thể hoàn tác!"
                          )
                        ) {
                          setSelected(null);
                          handlePermanentDelete(selected._id);
                        }
                      }}
                    >
                      <i className="fas fa-trash-alt me-1"></i>
                      Xóa hoàn toàn
                    </Button>
                  </>
                ) : selected.status !== "completed" &&
                  !selected.return_request?.isReturned ? (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <div>Trạng thái:</div>
                      <Form.Select
                        size="sm"
                        style={{ width: 200 }}
                        value={
                          selected.return_request?.isReturned
                            ? "returned"
                            : selected.status
                        }
                        onChange={async (e) => {
                          const next = e.target.value;
                          await handleChangeStatus(selected._id, next);
                          setSelected((prev) => ({ ...prev, status: next }));
                        }}
                      >
                        <option value="pending">Đang chờ</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã giao cho DVVC</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                        <option value="returned">Hoàn hàng</option>
                      </Form.Select>
                    </div>
                    <Button
                      variant="outline-danger"
                      onClick={() => {
                        setSelected(null);
                        handleDelete(selected._id);
                      }}
                    >
                      Xóa đơn
                    </Button>
                  </>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <div>Trạng thái:</div>
                    <Badge
                      bg={
                        selected.return_request?.isReturned
                          ? "secondary"
                          : "success"
                      }
                      className="px-3 py-2"
                    >
                      {selected.return_request?.isReturned
                        ? "Hoàn hàng"
                        : "Hoàn tất"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default AdminOrders;
