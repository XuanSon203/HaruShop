import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  Modal,
  Pagination,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  BsThreeDotsVertical
} from "react-icons/bs";
import { useNotification } from "../../../components/nofication/Nofication";

function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addNotification } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    Pending: 0,
    Confirmed: 0,

    Completed: 0,
    Cancelled: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");

  const statusLabels = {
    Pending: "Đang chờ xác nhận ",
    Confirmed: "Đã xác nhận",
    "In Progress": "Đang thực hiện",
    Completed: "Hoàn tất",
    Cancelled: "Đã hủy",
  };

  const statusCardColors = {
    Pending: "#ffc107",
    Confirmed: "#17a2b8",
    "In Progress": "#007bff",
    Completed: "#28a745",
    Cancelled: "#dc3545",
  };

  const statusOptions = [
    { value: "Pending", label: "Chờ xác nhận " },
    { value: "Confirmed", label: "Đã xác nhận" },
    { value: "In Progress", label: "Đang thực hiện" },
    { value: "Completed", label: "Hoàn thành" },
    { value: "Cancelled", label: "Đã hủy" },
  ];

  const paymentMethodLabels = {
    'cash': 'Tiền mặt',
    'bank_transfer': 'Chuyển khoản ngân hàng',
    'credit_card': 'Thẻ tín dụng',
    'e_wallet': 'Ví điện tử',
    'other': 'Khác'
  };

  const hoverStyles = `
    .hover-scale-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .hover-scale-card:hover {
      transform: scale(1.02);
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }
    .service-orders-table tbody tr {
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .service-orders-table tbody tr:hover {
      transform: scale(1.01);
      box-shadow: 0 8px 18px rgba(15,23,42,0.12);
    }
  `;

  // Helper functions for status management
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      Pending: "Confirmed",
      Confirmed: "In Progress",
      "In Progress": "Completed",
      Completed: null,
      Cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return "Hoàn tất";
    return statusLabels[nextStatus];
  };

  const getAvailableStatusOptions = (currentStatus) => {
    const allStatuses = [
      "Pending",
      "Confirmed",
      "In Progress",
      "Completed",
      "Cancelled",
    ];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, range, from, to, keyword]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (range !== "all") params.append("range", range);
      if (range === "custom" && from && to) {
        params.append("from", from);
        params.append("to", to);
      }

      if (keyword.trim()) params.append("keyword", keyword.trim());

      const response = await fetch(
        `http://localhost:8080/admin/orderservices?${params.toString()}`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách đơn dịch vụ");
      }

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.totalOrders || 0);
      setStatusCounts(data.statusCounts || statusCounts);

      // Calculate total revenue
      const revenue = (data.orders || []).reduce((sum, order) => {
        if (order.summary && order.summary.total) {
          return sum + Number(order.summary.total);
        } else if (order.services && order.services.length > 0) {
          return (
            sum +
            order.services.reduce((serviceSum, service) => {
              return serviceSum + Number(service.services_id?.price || 0);
            }, 0)
          );
        }
        return sum;
      }, 0);
      setTotalRevenue(revenue);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err.message || "Có lỗi xảy ra khi tải danh sách đơn dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, paymentMethodValue = null) => {
    try {
      setUpdating(true);
      setError(""); // Clear previous errors

      // Nếu chọn "Completed" và chưa có payment method, hiển thị modal
      if (newStatus === "Completed" && !paymentMethodValue) {
        setPendingOrderId(orderId);
        setPendingStatus(newStatus);
        setShowPaymentModal(true);
        setUpdating(false);
        return;
      }


      const requestBody = { status: newStatus };
      if (paymentMethodValue) {
        requestBody.paymentMethod = paymentMethodValue;
      }

      const response = await fetch(
        `http://localhost:8080/admin/orderservices/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật trạng thái");
      }

      // Show success message

      // Refresh orders list
      await fetchOrders();

      // Show success notification
      addNotification("Đã cập nhật trạng thái thành công!", "success");
      
      // Đóng modal payment nếu đang mở
      setShowPaymentModal(false);
      setPendingOrderId(null);
      setPendingStatus(null);
      setPaymentMethod("");
    } catch (err) {
      console.error("Update status error:", err);
      setError(err.message || "Có lỗi xảy ra khi cập nhật trạng thái");
      addNotification(
        `Lỗi: ${err.message || "Có lỗi xảy ra khi cập nhật trạng thái"}`,
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) {
      addNotification("Vui lòng chọn phương thức thanh toán", "error");
      return;
    }
    if (pendingOrderId && pendingStatus) {
      handleUpdateStatus(pendingOrderId, pendingStatus, paymentMethod);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn dịch vụ này?")) {
      return;
    }

    try {
      setUpdating(true);
      setError(""); // Clear previous errors

      const response = await fetch(
        `http://localhost:8080/admin/orderservices/${orderId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa đơn dịch vụ");
      }

      // Refresh orders list
      await fetchOrders();

      // Show success notification
      addNotification("Đã xóa đơn dịch vụ thành công!", "success");
    } catch (err) {
      console.error("Delete order error:", err);
      setError(err.message || "Có lỗi xảy ra khi xóa đơn dịch vụ");
      addNotification(
        `Lỗi: ${err.message || "Có lỗi xảy ra khi xóa đơn dịch vụ"}`,
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const showOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && orders.length === 0) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải danh sách đơn dịch vụ...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <style>{hoverStyles}</style>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2
          className="fw-bold mb-0"
          style={{ color: "#1f2937", fontSize: "1.8rem" }}
        >
          Quản lý lịch đặt dịch vụ
        </h2>
        <div className="d-flex gap-3 flex-wrap">
          <Form.Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: "150px" }}
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <Form.Select
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: "150px" }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="day">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">1 năm qua</option>
            <option value="custom">Tùy chọn</option>
          </Form.Select>
          <Form
            className="d-flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setKeyword(searchInput.trim());
              setCurrentPage(1);
            }}
          >
            <InputGroup>
              <Form.Control
                placeholder="Số điện thoại hoặc mã đơn"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="primary">
                <i className="fas fa-search me-1" />
                Tìm
              </Button>
              {keyword && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => {
                    setKeyword("");
                    setSearchInput("");
                    setCurrentPage(1);
                  }}
                >
                  <i className="fas fa-times" />
                </Button>
              )}
            </InputGroup>
          </Form>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="border-0 rounded-3 mb-4"
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fw-medium">{error}</span>
          </div>
        </Alert>
      )}

      {/* Status Summary Cards */}
      <Row className="mb-4">
        {Object.keys(statusLabels).map((status) => {
          const isActive = statusFilter === status;
          return (
            <Col key={status} md={2} className="mb-3">
              <Card
                className={`h-100 shadow-sm hover-scale-card ${
                  isActive ? "border-2" : "border-0"
                }`}
                style={{
                  cursor: "pointer",
                  borderColor: isActive ? statusCardColors[status] : undefined,
                }}
                onClick={() => {
                  setStatusFilter(isActive ? "" : status);
                  setCurrentPage(1);
                }}
              >
                <Card.Body className="text-center p-3">
                  <div
                    className="fw-bold mb-1"
                    style={{
                      fontSize: "1.6rem",
                      color: statusCardColors[status],
                    }}
                  >
                    {statusCounts[status] || 0}
                  </div>
                  <div
                    className={isActive ? "fw-semibold" : "text-muted small"}
                  >
                    {statusLabels[status]}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Total Revenue Card */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm hover-scale-card">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Tổng doanh thu (theo lọc)</h6>
                  <div
                    className="fw-bold"
                    style={{
                      fontSize: "2rem",
                      color: "#28a745",
                    }}
                  >
                    {totalRevenue.toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Custom Date Range */}
      {range === "custom" && (
        <Card className="mb-4 border-0 shadow-sm hover-scale-card">
          <Card.Body className="p-3">
            <Row className="g-3">
              <Col md={3}>
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </Col>
              <Col md={3}>
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={fetchOrders}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? <Spinner size="sm" /> : "Làm mới"}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="border-0 shadow-sm hover-scale-card">
        <Card.Body className="p-0">
          {orders.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📋</div>
              <h5 className="text-muted">Không có đơn dịch vụ nào</h5>
              <p className="text-muted">Chưa có đơn dịch vụ nào được tạo.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 service-orders-table">
              <thead className="table-light">
                <tr>
                  <th>STT</th>
                  <th>Mã đơn</th>
                  <th>Thông tin khách hàng</th>
                  <th>Tài khoản đặt hàng</th>
                  <th>Dịch vụ</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id} className="service-order-row">
                    <td>{index + 1}</td>
                    <td>
                      <div className="fw-medium">#{order._id.slice(-8)}</div>
                      <small className="text-muted">
                        {formatDateTime(order.createdAt)}
                      </small>
                    </td>
                    <td>
                      {order.services && order.services.length > 0 ? (
                        <div>
                          <div className="fw-medium">
                            <i className="fas fa-user me-1 text-primary"></i>
                            {order.services[0].fullName}
                          </div>
                          <div className="small text-muted">
                            <i className="fas fa-phone me-1"></i>
                            {order.services[0].phone}
                          </div>
                          {order.services[0].email && (
                            <div className="small text-muted">
                              <i className="fas fa-envelope me-1"></i>
                              {order.services[0].email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="fw-medium text-muted">
                            <i className="fas fa-user-slash me-1"></i>
                            Chưa có thông tin
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {order.user_id ? (
                        <div>
                          <div className="fw-medium text-success">
                            <i className="fas fa-user-check me-1"></i>
                            {order.user_id.fullName}
                          </div>
                          <small className="text-muted">
                            <i className="fas fa-envelope me-1"></i>
                            {order.user_id.email}
                          </small>
                          {order.user_id.phone && (
                            <div className="small text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {order.user_id.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="fw-medium text-warning">
                            <i className="fas fa-user-times me-1"></i>
                            Khách vãng lai
                          </div>
                          <small className="text-muted">
                            Không có tài khoản
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      {order.services && order.services.length > 0 ? (
                        <div>
                          <div className="fw-medium">
                            {order.services.length} dịch vụ
                          </div>
                          <small className="text-muted">
                            {order.services[0].services_id?.serviceName ||
                              "Dịch vụ không xác định"}
                          </small>
                          {order.services[0].petName && (
                            <div className="text-muted small">
                              Thú cưng: {order.services[0].petName} (
                              {order.services[0].typePet})
                            </div>
                          )}
                          {order.services[0].dateOrder && (
                            <div className="text-muted small">
                              Ngày: {formatDate(order.services[0].dateOrder)}{" "}
                              {formatTime(order.services[0].hoursOrder)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">0 dịch vụ</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold">
                        {order.summary && order.summary.total ? (
                          <span>
                            {Number(order.summary.total).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            ₫
                          </span>
                        ) : order.services && order.services.length > 0 ? (
                          <span>
                            {order.services
                              .reduce(
                                (sum, service) =>
                                  sum + Number(service.services_id?.price || 0),
                                0
                              )
                              .toLocaleString("vi-VN")}{" "}
                            ₫
                          </span>
                        ) : (
                          <span>0 ₫</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <p>{statusLabels[order.status]}</p>
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => showOrderDetail(order)}
                        >
                          Xem
                        </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => {
                                const nextStatus = getNextStatus(order.status);
                                if (nextStatus) {
                                  handleUpdateStatus(order._id, nextStatus);
                                }
                              }}
                              disabled={
                                updating || !getNextStatus(order.status)
                              }
                            >
                              {updating ? (
                                <>
                                  <Spinner size="sm" className="me-1" />
                                  Đang cập nhật...
                                </>
                              ) : (
                                getNextStatusLabel(order.status)
                              )}
                            </Button>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                id={`status-dropdown-${order._id}`}
                                disabled={updating}
                              >
                                {updating ? (
                                  <>
                                    <Spinner size="sm" className="me-1" />
                                    Đang cập nhật...
                                  </>
                                ) : (
                                  <>
                                    {statusLabels[order.status]}{" "}
                                    <BsThreeDotsVertical />
                                  </>
                                )}
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {getAvailableStatusOptions(order.status).map(
                                  (status) => (
                                    <Dropdown.Item
                                      key={status}
                                      onClick={() =>
                                        handleUpdateStatus(order._id, status)
                                      }
                                      disabled={updating}
                                      className={
                                        status === "Cancelled"
                                          ? "text-danger"
                                          : ""
                                      }
                                    >
                                      {statusLabels[status]}
                                    </Dropdown.Item>
                                  )
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                        {order.status !== "Completed" && order.status !== "Cancelled" && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteOrder(order._id)}
                              disabled={updating}
                            >
                              Xóa
                            </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị trang {currentPage} / {totalPages} ({totalOrders} đơn dịch
            vụ)
          </div>
          <Pagination>
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            />

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}

            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-bold">
            <i className="fas fa-clipboard-list me-2"></i>
            Chi tiết đơn dịch vụ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedOrder && (
            <div>
              {/* Order Header */}
              <div className="bg-light p-4 border-bottom">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: "50px", height: "50px" }}
                      >
                        <i className="fas fa-receipt"></i>
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold">
                          Mã đơn hàng: {selectedOrder._id}
                        </h5>
                        <div className="text-muted small">
                          <div>
                            <i className="fas fa-calendar-plus me-1"></i> Ngày
                            tạo: {formatDateTime(selectedOrder.createdAt)}
                          </div>
                          <div>
                            <i className="fas fa-calendar-check me-1"></i> Cập
                            nhật lần cuối:{" "}
                            {formatDateTime(selectedOrder.updatedAt)}
                          </div>
                          <div>
                            <i className="fas fa-credit-card me-1"></i> Phương
                            thức thanh toán:{" "}
                            {selectedOrder.paymentMethod ? (
                              <Badge bg="success" className="ms-1">
                                {paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                              </Badge>
                            ) : (
                              <span className="text-muted">Chưa xác định</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={4} className="text-end">
                      <Badge
                        className="px-3 py-2 fs-6"
                      style={{ 
                        color: selectedOrder.status === 'Pending' ? '#000' : '#fff',
                        backgroundColor: statusCardColors[selectedOrder.status]
                      }}
                      >
                        <i
                          className="fas fa-circle me-1"
                          style={{ fontSize: "8px" }}
                        ></i>
                        {statusLabels[selectedOrder.status]}
                      </Badge>
                  </Col>
                </Row>
              </div>

              <div className="p-4">
                {/* Services Summary */}
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header
                    className="bg-gradient text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    }}
                  >
                    <h6 className="mb-0 fw-bold">
                      <i className="fas fa-list me-2"></i>
                      Tóm tắt dịch vụ ({selectedOrder.services?.length || 0})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    {/* Account Information - Tài khoản đã đặt */}
                    <div className="mb-3 p-2 bg-light rounded">
                      <h6 className="text-success fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
                        <i className="fas fa-user-check me-2"></i>
                        Tài khoản đã đặt
                      </h6>
                      {selectedOrder.user_id ? (
                        <div className="row g-2">
                          <div className="col-md-4">
                            <small className="text-muted d-block mb-1">Tên:</small>
                            <div className="fw-medium small">
                              {selectedOrder.user_id.fullName}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted d-block mb-1">Email:</small>
                            <div className="fw-medium small">
                              {selectedOrder.user_id.email}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted d-block mb-1">Số điện thoại:</small>
                            <div className="fw-medium small">
                              {selectedOrder.user_id.phone || "Không có"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted small">
                          <i className="fas fa-user-slash me-2"></i>
                          Khách vãng lai - Chưa có tài khoản
                        </div>
                      )}
                    </div>

                    <Row className="g-2">
                      {selectedOrder.services?.map((service, index) => (
                        <Col md={6} key={index} className="mb-2">
                          <div className="border rounded p-2">
                            <div className="d-flex align-items-center mb-2">
                              {service.services_id?.image ? (
                                <img
                                  src={
                                    service.services_id.image.startsWith("http")
                                      ? service.services_id.image
                                      : service.services_id.image.startsWith(
                                          "/"
                                        )
                                      ? `http://localhost:8080${service.services_id.image}`
                                      : `http://localhost:8080/uploads/services/${service.services_id.image}`
                                  }
                                  alt={service.services_id.serviceName}
                                  className="rounded me-2"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded d-flex align-items-center justify-content-center me-2"
                                  style={{ width: "50px", height: "50px" }}
                                >
                                  <i className="fas fa-image text-muted"></i>
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <h6 className="mb-0 fw-bold small">
                                  {service.services_id?.serviceName}
                                </h6>
                                <div className="text-primary fw-bold small">
                                  {Number(
                                    service.services_id?.price || 0
                                  ).toLocaleString("vi-VN")}{" "}
                                  ₫
                                </div>
                              </div>
                            </div>
                            <div className="row g-1">
                              <div className="col-6">
                                <small className="text-muted d-block mb-0">Khách hàng:</small>
                                <div className="fw-medium small">
                                  {service.fullName}
                                </div>
                                <small className="text-muted small">
                                  <i className="fas fa-phone me-1"></i>
                                  {service.phone}
                                </small>
                              </div>
                              <div className="col-6">
                                <small className="text-muted d-block mb-0">Thú cưng:</small>
                                <div className="fw-medium small">
                                  {service.petName} ({service.typePet})
                                  {service.agePet && ` - ${service.agePet} tuổi`}
                                </div>
                              </div>
                              <div className="col-6">
                                <small className="text-muted d-block mb-0">Ngày hẹn:</small>
                                <div className="fw-medium small">
                                  {formatDate(service.dateOrder)}{" "}
                                  {formatTime(service.hoursOrder)}
                                </div>
                              </div>
                              {service.note && (
                                <div className="col-12 mt-1">
                                  <small className="text-muted d-block mb-0">Ghi chú:</small>
                                  <div className="fw-medium small">
                                    {service.note}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>

                {/* Order Summary */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-3">
                    <div className="bg-light rounded p-3 text-center">
                      <h6 className="text-muted mb-2">Tổng cộng</h6>
                      <div className="h4 fw-bold text-success mb-0">
                            {(
                              Number(selectedOrder.summary?.total || 0) + 25000
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                          </div>
                        </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="secondary"
            onClick={() => setShowDetailModal(false)}
            className="px-4"
          >
            <i className="fas fa-times me-2"></i>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => {
          setShowPaymentModal(false);
          setPendingOrderId(null);
          setPendingStatus(null);
          setPaymentMethod("");
        }}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-bold">
            <i className="fas fa-credit-card me-2"></i>
            Chọn phương thức thanh toán
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Label className="fw-bold mb-3">
              Vui lòng chọn phương thức thanh toán cho đơn hàng:
            </Form.Label>
            <Form.Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mb-3"
            >
              <option value="">-- Chọn phương thức thanh toán --</option>
              <option value="cash">Tiền mặt</option>
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="credit_card">Thẻ tín dụng</option>
              <option value="e_wallet">Ví điện tử</option>
              <option value="other">Khác</option>
            </Form.Select>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPaymentModal(false);
              setPendingOrderId(null);
              setPendingStatus(null);
              setPaymentMethod("");
            }}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmPayment}
            disabled={!paymentMethod || updating}
          >
            {updating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ServiceOrders;

