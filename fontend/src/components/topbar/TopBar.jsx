import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar, Badge, Nav, NavDropdown, Container, Spinner } from "react-bootstrap";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function TopBar() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [fetchingNoti, setFetchingNoti] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const pollingRef = useRef(null);
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    const name = Cookies.get("fullName");
    setFullName(name || "");
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setFetchingNoti(true);
      setNotifError("");
      const res = await fetch(
        `${API_BASE}/admin/notifications?limit=10&type=order,service_order`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải thông báo");
      }
      setNotifications(data.notifications || []);
    } catch (error) {
      setNotifError(error.message || "Không thể tải thông báo");
    } finally {
      setFetchingNoti(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const markNotificationAsRead = async (id) => {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: "read", readAt: new Date() } : item
        )
      );
      await fetchNotifications();
    } catch (error) {
      // ignore error visually, maybe log
      console.error("Mark notification read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await fetch(`${API_BASE}/admin/notifications/read/all`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((item) =>
          item.status === "unread" ? { ...item, status: "read", readAt: new Date() } : item
        )
      );
      await fetchNotifications();
    } catch (error) {
      console.error("Mark all notifications read error:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const resolveNotificationLink = (notification) => {
    if (!notification) return "/admin/orders";
    if (notification.type === "service_order") {
      const id =
        notification.service_order_id ||
        notification.meta?.serviceOrderId ||
        notification.meta?.orderId ||
        notification.meta?.id;
      return id ? `/admin/service-orders?orderId=${id}` : "/admin/service-orders";
    }
    if (notification.type === "order") {
      const id =
        notification.order_id ||
        notification.meta?.orderId ||
        notification.meta?.id ||
        notification.meta?._id;
      return id ? `/admin/orders?orderId=${id}` : "/admin/orders";
    }
    if (notification.action_url) {
      if (notification.action_url.startsWith("/admin/orderservices")) {
        const id = notification.service_order_id || notification.meta?.serviceOrderId;
        return id ? `/admin/service-orders?orderId=${id}` : "/admin/service-orders";
      }
      if (notification.action_url.startsWith("/admin/orders")) {
        return notification.action_url.replace("/orderservices", "/service-orders");
      }
      return notification.action_url;
    }
    return "/admin/orders";
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;
    if (notification.status === "unread") {
      await markNotificationAsRead(notification._id);
    }
    const url = resolveNotificationLink(notification);
    if (url.startsWith("http")) {
      window.location.href = url;
    } else {
      navigate(url);
    }
  };

  const handleLogout = async () => {
    try {
      // Gọi API logout từ backend admin
      const res = await fetch(`${API_BASE}/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
      } else {
      }
    } catch (error) {
      console.error("Lỗi khi logout:", error);
    }

    // Xóa tất cả cookies
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });

    // Chuyển hướng về trang login
    navigate("/admin/auth/login", { replace: true });
  };
  return (
    <Navbar
      expand="md"
      className="shadow-sm admin-topbar"
      style={{
        height: "60px",
      }}
    >
      <Container>
        {/* Logo / Tên admin */}
        <Navbar.Brand className="fw-bold">Admin Panel</Navbar.Brand>

        {/* Nút toggle menu khi mobile */}
        <Navbar.Toggle aria-controls="topbar-nav" />

        {/* Menu chính */}
        <Navbar.Collapse id="topbar-nav" className="justify-content-end">
          <Nav>
            <NavDropdown
              title={
                <div className="d-flex align-items-center gap-1">
                  <FaBell size={18} />
                  {unreadCount > 0 && (
                    <Badge bg="danger" pill>
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              }
              id="admin-notification-dropdown"
              align="end"
              onToggle={(isOpen) => {
                if (isOpen && notifications.length === 0 && !fetchingNoti) {
                  fetchNotifications();
                }
              }}
            >
              <div style={{ minWidth: "320px" }}>
                <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                  <div>
                    <strong>Thông báo</strong>
                    <div className="text-muted small">
                      Có {unreadCount} thông báo chưa đọc
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none"
                    onClick={markAllAsRead}
                    disabled={markingAll || unreadCount === 0}
                  >
                    {markingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
                  </button>
                </div>
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  {fetchingNoti ? (
                    <div className="text-center py-3">
                      <Spinner size="sm" animation="border" className="me-2" />
                      Đang tải...
                    </div>
                  ) : notifError ? (
                    <div className="text-center text-danger py-3">
                      {notifError}
                      <div>
                        <button
                          type="button"
                          className="btn btn-link btn-sm"
                          onClick={fetchNotifications}
                        >
                          Thử lại
                        </button>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        className={`dropdown-item text-start ${notification.status === "unread" ? "fw-bold" : ""
                          }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="small text-muted">
                          {new Date(notification.createdAt).toLocaleString("vi-VN")}
                        </div>
                        <div>{notification.title}</div>
                        <div className="text-muted small">{notification.message}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </NavDropdown>
            <p className="mb-0 ms-3">{fullName}</p>
            {/* Dropdown tài khoản */}
            <NavDropdown
              title={<FaUserCircle size={20} />}
              id="account-dropdown"
              align="end"
            >
              <NavDropdown.Item onClick={handleLogout}>
                Đăng xuất
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopBar;
