import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Table,
  Image,
  Nav,
  Navbar,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../components/paginartion/Pagination";
import { useNotification } from "../../../components/nofication/Nofication";
import { BsStarFill, BsEye, BsXCircle, BsArrowReturnLeft } from "react-icons/bs";
function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [orderStats, setOrderStats] = useState({
    all: 0,
    pending: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
    returned: 0,
  });
  const { addNotification } = useNotification();
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateItem, setRateItem] = useState(null); // { product_id, category_id, name }
  const [rateStars, setRateStars] = useState(5);
  const [ratedProducts, setRatedProducts] = useState({}); // product_id -> true

  // Initialize ratedProducts from backend data when orders load
  useEffect(() => {
    if (orders.length > 0) {
      const ratedMap = {};
      orders.forEach((order) => {
        order.products?.forEach((product) => {
          // Kiểm tra cả alreadyRated và rated_by để đảm bảo chính xác
          if (product.alreadyRated === true || product.rated_by) {
            ratedMap[product.product_id] = true;
          }
        });
      });
      setRatedProducts((prev) => ({ ...prev, ...ratedMap }));
    }
  }, [orders]);

  // Return request states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const API_BASE = `http://${window.location.hostname}:8080`;
  const [isReturned, setIsReturned] = useState(true);
  const loadOrders = async (page = 1, status = null) => {
    try {
      setLoading(true);
      setError("");
      // Không cần gửi user_id trong query vì backend sẽ lấy từ cookie tokenUser
      let url = `${API_BASE}/orders?page=${page}&limit=5`;
     // Thêm status fiter nếu có
      if (status && status !== "all") {
        url += `&status=${status}`;
      }

      const res = await fetch(url, {
        credentials: "include",
        method: "GET",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalOrders(data.totalOrders || 0);
        // Cập nhật thống kê nếu có
        if (data.stats) {
          setOrderStats(data.stats);
        }
      } else {
        console.error("Lỗi từ backend:", data);
        throw new Error(data.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(currentPage, activeTab);
    // Subscribe live changes via SSE
    const es = new EventSource(`${API_BASE}/orders/stream`);
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data || "{}");
        if (payload && payload.type) {
          // Khi có thay đổi, reload trang hiện tại với tab hiện tại
          loadOrders(currentPage, activeTab);
        }
      } catch (_) {}
    };
    es.onerror = () => {
      // auto close on error; will re-open next mount
      try {
        es.close();
      } catch (_) {}
    };
    return () => {
      try {
        es.close();
      } catch (_) {}
    };
  }, [currentPage, activeTab]);
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "warning", text: "Chờ xác nhận" },
      processing: { variant: "primary", text: "Đang xử lý" },
      shipping: { variant: "info", text: "Đang giao" },
      shipped: { variant: "info", text: "Đang giao" },
      completed: { variant: "success", text: "Hoàn thành" },
      cancelled: { variant: "danger", text: "Đã hủy" },
      returned: { variant: "secondary", text: "Hoàn hàng" },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      text: status,
    };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  if (loading) {
    return (
      <Container className="my-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "200px" }}
        >
          <Spinner animation="border" />
          <span className="ms-2">Đang tải danh sách đơn hàng...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          {error}
          <Button
            variant="outline-danger"
            className="ms-2"
            onClick={loadOrders}
          >
            Thử lại
          </Button>
        </Alert>
      </Container>
    );
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset về trang 1 khi chuyển tab
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/orders/${orderId}/cancel`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        addNotification("Đơn hàng đã được hủy thành công!", "success");
        loadOrders(currentPage, activeTab); // Reload danh sách
        // Dispatch event để cập nhật order count trong header
        window.dispatchEvent(new CustomEvent("orderUpdated"));
      } else {
        addNotification("Không thể hủy đơn hàng", "danger");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      addNotification("Lỗi khi hủy đơn hàng: ", "danger");
    }
  };

  const openRateModal = (product) => {
    setRateItem({
      product_id: product.product_id,
      category_id: product.category_id?._id || product.category_id,
      name: product.product_info?.name || "Sản phẩm",
    });
    setRateStars(5);
    setShowRateModal(true);
  };

  const submitRating = async () => {
    if (!rateItem) return;
    try {
      const res = await fetch(`${API_BASE}/orders/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: rateItem.product_id,
          category_id: rateItem.category_id,
          rating: rateStars,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Đã đánh giá rồi -> ẩn nút luôn
          setRatedProducts((prev) => ({
            ...prev,
            [rateItem.product_id]: true,
          }));
          addNotification(data.message || "Bạn đã đánh giá rồi", "info");
          setShowRateModal(false);
          // Reload danh sách đơn hàng để cập nhật dữ liệu
          await loadOrders(currentPage, activeTab);
          return;
        }
        throw new Error(data.message || "Đánh giá thất bại");
      }
      if (data.success) {
        addNotification("Cảm ơn bạn đã đánh giá!", "success");
        // Ẩn nút đánh giá cho sản phẩm này
        setRatedProducts((prev) => ({ ...prev, [rateItem.product_id]: true }));
        setShowRateModal(false);
        // Reload danh sách đơn hàng để cập nhật dữ liệu từ backend
        await loadOrders(currentPage, activeTab);
      }
    } catch (e) {
      addNotification(e.message || "Không thể gửi đánh giá", "danger");
    }
  };

  // Return request functions
  const handleOpenReturnModal = (order) => {
    setReturnOrder(order);
    setIsReturned(true); // Set to true for return request
    setShowReturnModal(true);
  };

  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
    setReturnOrder(null);
    setReturnReason("");
    setReturnDescription("");
    setIsReturned(true); // Keep as true for return request
  };

  const handleReturnRequest = async () => {
    if (!returnOrder || !returnReason) {
      addNotification("Vui lòng nhập lý do hoàn hàng", "warning");
      return;
    }

    const requestData = {
      order_id: returnOrder._id,
      return_request: {
        isReturned: isReturned,
        return_reason: returnReason,
        return_description: returnDescription
      }
    };


    try {
      const res = await fetch(`${API_BASE}/orders/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        addNotification("Yêu cầu hoàn hàng đã được gửi thành công!", "success");
        handleCloseReturnModal();
        
        // Cập nhật trạng thái đơn hàng ngay lập tức để ẩn nút
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === returnOrder._id 
              ? { ...order, return_request: data.return_request, status: "returned" }
              : order
          )
        );
      } else {
        console.error("Request failed:", data);
        addNotification(
          data.message || "Gửi yêu cầu hoàn hàng thất bại",
          "danger"
        );
      }
    } catch (err) {
      console.error("Return request error:", err);
      addNotification("Lỗi khi gửi yêu cầu hoàn hàng", "danger");
    }
  };

  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h2
          className="fw-bold mb-3"
          style={{
            color: "#0ea5e9",
            fontSize: "2.5rem",
           
          }}
        >
           Đơn hàng sản phẩm
        </h2>
        <p
          className="text-muted fs-5"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          Theo dõi và quản lý các đơn hàng sản phẩm đã đặt
        </p>
      </div>

      <div
        className="d-flex justify-content-between align-items-center mb-4 p-4 rounded-3"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#1f2937" }}>
            Danh sách đơn hàng
          </h4>
          <small className="text-muted fs-6">
            Hiển thị {orders.length} trong tổng số {totalOrders} đơn hàng
          </small>
        </div>
        <Button
          variant="primary"
          onClick={() => loadOrders(currentPage, activeTab)}
          style={{
            background: "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.5rem",
            fontWeight: "600",
          }}
        >
          🔄 Làm mới
        </Button>
      </div>

      {/* Tab Navigation */}
      <div
        className="mb-4 p-3 rounded-3"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <Nav
          variant="pills"
          activeKey={activeTab}
          onSelect={handleTabChange}
          className="justify-content-center"
        >
          <Nav.Item>
            <Nav.Link
              eventKey="all"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
              Tất cả
            
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="pending"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
              Chờ xác nhận
              {orderStats.pending > 0 && (
                <Badge
                  bg="warning"
                  pill
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    fontSize: "0.7rem",
                    minWidth: "20px",
                    padding: "2px 6px",
                  }}
                >
                  {orderStats.pending}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="shipping"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
              Đang giao
              {orderStats.shipping > 0 && (
                <Badge
                  bg="info"
                  pill
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    fontSize: "0.7rem",
                    minWidth: "20px",
                    padding: "2px 6px",
                  }}
                >
                  {orderStats.shipping}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="completed"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
              Hoàn thành
              {orderStats.completed > 0 && (
                <Badge
                  bg="success"
                  pill
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    fontSize: "0.7rem",
                    minWidth: "20px",
                    padding: "2px 6px",
                  }}
                >
                  {orderStats.completed}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="cancelled"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
               Đã hủy
             
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="returned"
              style={{
                borderRadius: "12px",
                margin: "0 0.25rem",
                fontWeight: "600",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
               Hoàn hàng
              {orderStats.returned > 0 && (
                <Badge
                  bg="secondary"
                  pill
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    fontSize: "0.7rem",
                    minWidth: "20px",
                    padding: "2px 6px",
                  }}
                >
                  {orderStats.returned}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {orders.length === 0 ? (
        <div
          className="text-center py-5"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "20px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
          <h4 className="text-muted mb-3">Chưa có đơn hàng nào</h4>
          <p className="text-muted mb-4">
            Hãy mua sắm và tạo đơn hàng đầu tiên của bạn!
          </p>
          <Button
            variant="primary"
            size="lg"
            style={{
              background: "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem 2rem",
            }}
            onClick={() => (window.location.href = "/")}
          >
             Bắt đầu mua sắm
          </Button>
        </div>
      ) : (
        <Row>
          {orders.map((order, index) => (
            <Col key={order._id} lg={12} className="mb-4">
              <Card
                className="border-0"
                style={{
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Card.Header
                  className="d-flex justify-content-between align-items-center p-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                    color: "white",
                    borderRadius: "20px 20px 0 0",
                  }}
                >
                  <div>
                    <strong className="fs-5">
                      Đơn hàng #{order._id.slice(-8)}
                    </strong>
                    <div className="small opacity-75">
                       {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Badge
                      bg="light"
                      text="dark"
                      className="fs-6 px-3 py-2"
                      style={{ borderRadius: "12px" }}
                    >
                       {formatPrice(order.summary.total)}
                    </Badge>
                    {order.discount_id?.name && (
                      <Badge
                        bg="secondary"
                        className="px-3 py-2"
                        style={{ borderRadius: "12px" }}
                      >
                         {order.discount_id.name}
                      </Badge>
                    )}
                  </div>
                </Card.Header>

                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <h6>Sản phẩm:</h6>
                      <Table responsive size="sm">
                        <thead>
                          <tr>
                            <th>Hình ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Giảm giá</th>
                            <th>Thành tiền</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.products.map((product, index) => (
                            <tr key={index}>
                              <td>
                                <Image
                                  src={(() => {
                                    const productInfo =
                                      product?.product_info || {};
                                    if (productInfo.thumbnail) {
                                      const folder =
                                        productInfo.type === "accessory"
                                          ? "accessory"
                                          : "foods";
                                      return `${API_BASE}/uploads/products/${folder}/${productInfo.thumbnail}`;
                                    }
                                    // fallback nếu có images array
                                    if (
                                      productInfo.images &&
                                      productInfo.images.length > 0
                                    ) {
                                      const folder =
                                        productInfo.type === "accessory"
                                          ? "accessory"
                                          : "foods";
                                      return `${API_BASE}/uploads/products/${folder}/${productInfo.images[0]}`;
                                    }
                                    return "/placeholder.jpg";
                                  })()}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                  rounded
                                />
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span>
                                    {product.product_info?.name || "Sản phẩm"}
                                  </span>
                                  {product.category_id?.name && (
                                    <small className="text-muted">
                                       {product.category_id.name}
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>{product.quantity}</td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span>{formatPrice(product.price)}</span>
                                  {product.discount > 0 && (
                                    <small className="text-success">
                                      -{formatPrice(product.discount)} (
                                      {Math.round(
                                        (product.discount / product.price) * 100
                                      )}
                                      %)
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>
                                {product.discount > 0 ? (
                                  <div className="d-flex flex-column">
                                    <span className="text-success">
                                      -{formatPrice(product.discount)}
                                    </span>
                                    <small className="text-muted">
                                      Còn: {formatPrice(product.amount)}
                                    </small>
                                  </div>
                                ) : (
                                  <span className="text-muted">Không</span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="fw-bold">
                                    {formatPrice(product.amount)}
                                  </span>
                                  {product.discount > 0 && (
                                    <small className="text-muted text-decoration-line-through">
                                      {formatPrice(
                                        product.price * product.quantity
                                      )}
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td className="text-end">
                                {order.status === "completed" &&
                                  !ratedProducts[product.product_id] &&
                                  product.alreadyRated !== true && (
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => openRateModal(product)}
                                      style={{
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      <BsStarFill className="me-1" />
                                      Đánh giá
                                    </Button>
                                  )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>

                    <Col md={4}>
                      <h6>Hành động:</h6>
                      <div className="d-flex flex-column gap-2 mb-3">
                        {/* Nút Xem chi tiết - luôn hiển thị */}
                        <Button
                          variant="primary"
                          className="w-100"
                          onClick={() => navigate(`/orders/${order._id}`)}
                          style={{
                            borderRadius: "8px",
                            fontWeight: "600",
                          }}
                        >
                          <BsEye className="me-2" />
                          Xem chi tiết
                        </Button>

                        {/* Nút Hủy đơn hàng - chỉ hiển thị khi pending */}
                        {order.status === "pending" && (
                          <Button
                            variant="outline-danger"
                            className="w-100"
                            onClick={() => handleCancelOrder(order._id)}
                            style={{
                              borderRadius: "8px",
                              fontWeight: "600",
                            }}
                          >
                            <BsXCircle className="me-2" />
                            Hủy đơn hàng
                          </Button>
                        )}

                        {/* Nút Hoàn hàng - chỉ hiển thị khi completed và trong 3 ngày */}
                        {order.status === "completed" &&
                          order.status !== "returned" &&
                          (!order.return_request || order.return_request.isReturned === false) &&
                          (() => {
                            let completedDate = null;
                            if (order.updatedBy && order.updatedBy.length > 0) {
                              const lastUpdate = order.updatedBy[order.updatedBy.length - 1];
                              completedDate = new Date(lastUpdate.updatedAt);
                            } else if (order.updatedAt) {
                              completedDate = new Date(order.updatedAt);
                            }
                            
                            if (completedDate) {
                              const now = new Date();
                              const daysDiff = (now - completedDate) / (1000 * 60 * 60 * 24);
                              return Math.floor(daysDiff) <= 3;
                            }
                            return false;
                          })() && (
                          <Button
                            variant="outline-warning"
                            className="w-100"
                            onClick={() => handleOpenReturnModal(order)}
                            style={{
                              borderRadius: "8px",
                              fontWeight: "600",
                            }}
                          >
                            <BsArrowReturnLeft className="me-2" />
                            Hoàn hàng
                          </Button>
                        )}
                      </div>

                      <hr />

                      <div className="small">
                        <div className="d-flex justify-content-between">
                          <span>Tổng tiền hàng:</span>
                          <span>{formatPrice(order.summary.subtotal)}</span>
                        </div>

                        {/* Hiển thị discount của từng sản phẩm */}
                        {order.products.some((p) => p.discount > 0) && (
                          <div className="mt-2">
                            <div className="text-success fw-bold mb-1">
                               Giảm giá sản phẩm:
                            </div>
                            {order.products
                              .filter((p) => p.discount > 0)
                              .map((product, index) => (
                                <div
                                  key={index}
                                  className="d-flex justify-content-between text-success small"
                                >
                                  <span>
                                    {product.product_info?.name || "Sản phẩm"}
                                    <small className="text-muted">
                                      {" "}
                                      (x{product.quantity})
                                    </small>
                                  </span>
                                  <span>
                                    -
                                    {formatPrice(
                                      product.discount * product.quantity
                                    )}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Hiển thị voucher discount */}
                        {order.summary.voucher_discount > 0 && (
                          <div className="d-flex justify-content-between text-success">
                            <span>
                               Giảm giá voucher
                              {order.discount_id?.name
                                ? ` (${order.discount_id.name})`
                                : ""}
                              :
                            </span>
                            <span>
                              -{formatPrice(order.summary.voucher_discount)}
                            </span>
                          </div>
                        )}

                        <div className="d-flex justify-content-between">
                          <span>Phí vận chuyển:</span>
                          <span>
                            {Number(order.summary.shipping_fee || 0) <= 0
                              ? 'Miễn phí'
                              : formatPrice(order.summary.shipping_fee)}
                          </span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Tổng thanh toán:</span>
                          <span className="text-danger">
                            {formatPrice(order.summary.total)}
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal đánh giá */}
      <Modal
        show={showRateModal}
        onHide={() => setShowRateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">{rateItem?.name}</div>
          <div className="d-flex align-items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                onClick={() => setRateStars(s)}
                style={{
                  cursor: "pointer",
                  color: s <= rateStars ? "#f59e0b" : "#d1d5db",
                  fontSize: 24,
                }}
              >
               <BsStarFill />

              </span>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowRateModal(false)}>
            Hủy
          </Button>
          <Button onClick={submitRating}>Gửi đánh giá</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal hoàn hàng */}
      <Modal
        show={showReturnModal}
        onHide={handleCloseReturnModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Yêu cầu hoàn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {returnOrder && (
            <>
              <div className="mb-3">
                <h6>Thông tin đơn hàng:</h6>
                <div className="p-3 bg-light rounded">
                  <div>
                    <strong>Mã đơn hàng:</strong> {returnOrder._id}
                  </div>
                  <div>
                    <strong>Tổng tiền:</strong>{" "}
                    {formatPrice(returnOrder.summary.total)}
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{" "}
                    {getStatusBadge(returnOrder.status).text}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <strong>Lý do hoàn hàng *</strong>
                </label>
                <select
                  className="form-select"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                >
                  <option value="">Chọn lý do hoàn hàng</option>
                  <option value="Sản phẩm bị lỗi">Sản phẩm bị lỗi</option>
                  <option value="Sản phẩm không đúng mô tả">
                    Sản phẩm không đúng mô tả
                  </option>
                  <option value="Sản phẩm bị hỏng trong quá trình vận chuyển">
                    Sản phẩm bị hỏng trong quá trình vận chuyển
                  </option>
                  <option value="Không hài lòng với chất lượng">
                    Không hài lòng với chất lượng
                  </option>
                  <option value="Đổi ý không muốn mua nữa">
                    Đổi ý không muốn mua nữa
                  </option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <strong>Mô tả chi tiết</strong>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về vấn đề hoặc lý do hoàn hàng..."
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCloseReturnModal}>
            Hủy
          </Button>
          <Button variant="warning" onClick={handleReturnRequest}>
            Gửi yêu cầu hoàn hàng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Orders;
