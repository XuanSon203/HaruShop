import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Badge from "react-bootstrap/Badge";
import {
  FaBell,
  FaCheckDouble,
  FaInbox,
  FaLink,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ALLOWED_TYPES = ["order", "service_order"];
const TYPE_QUERY = ALLOWED_TYPES.join(",");

const LEVEL_VARIANTS = {
  info: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const LEVEL_ICONS = {
  info: <FaInfoCircle />,
  success: <FaCheckDouble />,
  warning: <FaExclamationTriangle />,
  danger: <FaExclamationTriangle />,
};

const TYPE_ICON = {
  order: null,
  service_order: null,
  system: <FaInfoCircle />,
};

const PANEL_WIDTH = 460;
const LIMIT = 20;

function NotificationModals({ show, onHide, onUpdated, anchorRef }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [panelStyle, setPanelStyle] = useState(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
const API_BASE = `http://${window.location.hostname}:8080`;
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `${API_BASE}/notifications?limit=${LIMIT}&type=${TYPE_QUERY}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Không thể tải danh sách thông báo");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Không thể tải danh sách thông báo");
      }

      const list = (data.notifications || []).filter((item) =>
        ALLOWED_TYPES.includes((item.type || "").toLowerCase())
      );
      setNotifications(list);
      if (typeof onUpdated === "function") {
        const unreadOfList = list.filter(
          (item) => item.status === "unread"
        ).length;
        onUpdated(unreadOfList);
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [onUpdated]);

  useEffect(() => {
    if (!show) return;
    fetchNotifications();
  }, [show, fetchNotifications]);

  const markAsRead = async (id, { silent = false } = {}) => {
    if (!id) return;
    try {
      if (!silent) setMarkingId(id);
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể cập nhật thông báo");
      }

      setNotifications((prev) => {
        const next = prev.map((item) =>
          item._id === id ? { ...item, status: "read", readAt: new Date() } : item
        );
        if (typeof onUpdated === "function") {
          const nextUnread = next.filter((n) => n.status === "unread").length;
          onUpdated(nextUnread);
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông báo");
    } finally {
      if (!silent) setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const res = await fetch(`${API_BASE}/notifications/read/all`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể cập nhật thông báo");
      }
      setNotifications((prev) => {
        const next = prev.map((item) =>
          item.status === "unread"
            ? { ...item, status: "read", readAt: new Date() }
            : item
        );
        if (typeof onUpdated === "function") {
          onUpdated(0);
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông báo");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === "unread").length,
    [notifications]
  );

  const handleViewNotification = async (notification) => {
    if (!notification) return;
    if (notification.status === "unread") {
      await markAsRead(notification._id, { silent: true });
    }
    onHide?.();
    
    // Xử lý điều hướng dựa trên type và ID của notification
    let url = "/";
    
    // Kiểm tra type và ID từ notification object
    const notificationType = (notification.type || "").toLowerCase();
    const serviceOrderId = notification.service_order_id || notification.meta?.serviceOrderId;
    const orderId = notification.order_id || notification.meta?.orderId;
    
    if (notificationType === "service_order" || serviceOrderId) {
      // Đơn dịch vụ: chuyển đến trang service-orders
      if (serviceOrderId) {
        // Chuyển đổi ObjectId thành string nếu cần
        const id = typeof serviceOrderId === 'object' ? serviceOrderId.toString() : serviceOrderId;
        url = `/service-orders/${id}`;
      } else {
        url = "/service-orders";
      }
    } else if (notificationType === "order" || orderId) {
      // Đơn sản phẩm: chuyển đến trang orders
      if (orderId) {
        // Chuyển đổi ObjectId thành string nếu cần
        const id = typeof orderId === 'object' ? orderId.toString() : orderId;
        url = `/orders/${id}`;
      } else {
        url = "/orders";
      }
    } else {
      // Các loại khác: dùng action_url nếu có
      url = notification.action_url || "/";
    }
    
    if (/^https?:\/\//.test(url)) {
      window.location.href = url;
    } else {
      navigate(url);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0 text-muted">Đang tải thông báo...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-5 text-center text-danger">
          <p className="mb-3">{error}</p>
          <Button variant="outline-primary" size="sm" onClick={fetchNotifications}>
            Thử lại
          </Button>
        </div>
      );
    }

    if (!notifications.length) {
      return (
        <div className="py-5 text-center text-muted">
          <FaInbox size={40} className="mb-3" />
          <p className="mb-0">Bạn chưa có thông báo nào</p>
        </div>
      );
    }

    return (
      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`notification-item ${
              notification.status === "unread" ? "unread" : ""
            }`}
          >
            <div className="notification-content">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h6 className="mb-0 notification-title">
                    {notification.title}
                  </h6>
                </div>
                <Badge
                  bg={LEVEL_VARIANTS[notification.level] || "secondary"}
                  className="text-uppercase fw-semibold"
                >
                  {notification.level === "danger"
                    ? "Cảnh báo"
                    : notification.level === "warning"
                    ? "Cảnh báo"
                    : notification.level === "success"
                    ? "Thành công"
                    : "Thông báo"}
                </Badge>
              </div>
              <p className="mb-2 text-muted">{notification.message}</p>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <small className="text-muted">
                  {new Date(notification.createdAt).toLocaleString("vi-VN")}
                </small>
                <div className="d-flex gap-2 align-items-center">
                  {notification.action_url && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleViewNotification(notification)}
                    >
                      <FaLink className="me-1" />
                      Xem
                    </Button>
                  )}
                  {notification.status === "unread" && (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={markingId === notification._id}
                      onClick={() => markAsRead(notification._id)}
                    >
                      {markingId === notification._id ? (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                      ) : (
                        <FaCheckDouble className="me-1" />
                      )}
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!show) return;

    const handleOutsideClick = (e) => {
      const anchorEl = anchorRef?.current;
      const panel = panelRef.current;
      if (
        panel &&
        !panel.contains(e.target) &&
        (!anchorEl || !anchorEl.contains(e.target))
      ) {
        onHide?.();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onHide?.();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [show, onHide, anchorRef]);

  const updatePanelPosition = useCallback(() => {
    if (!show) return;
    const anchorEl = anchorRef?.current;
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Trên mobile: full width với padding
      setPanelStyle({
        top: 70,
        left: 10,
        right: 10,
        width: "calc(100vw - 20px)",
        maxWidth: "calc(100vw - 20px)",
      });
    } else {
      // Trên desktop: giữ nguyên logic cũ
    const maxWidth = Math.min(PANEL_WIDTH, window.innerWidth - 32);
    const left = Math.min(
      Math.max(rect.right - maxWidth, 16),
      window.innerWidth - maxWidth - 16
    );
    const top = Math.min(
      rect.bottom + 12,
      window.innerHeight - 100
    );
    setPanelStyle({
      top,
      left,
      width: maxWidth,
    });
    }
  }, [show, anchorRef]);

  useEffect(() => {
    updatePanelPosition();
  }, [updatePanelPosition, notifications.length, show]);

  useEffect(() => {
    if (!show) return;
    const handleResize = () => updatePanelPosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [show, updatePanelPosition]);

  if (!show) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="notification-popover shadow-lg"
      style={{
        position: "fixed",
        zIndex: 2000,
        ...(panelStyle || {}),
      }}
    >
      <div className="notification-header">
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center gap-2 title-row">
            <FaBell /> Thông báo của bạn
          </div>
          <small className="text-muted">
            Có {unreadCount} thông báo chưa đọc
          </small>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline-primary"
            size="sm"
            disabled={markingAll || unreadCount === 0}
            onClick={markAllAsRead}
            className="ms-auto"
          >
            {markingAll ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <FaCheckDouble className="me-1" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        )}
        <Button
          variant="link"
          className="text-decoration-none text-dark fs-4 ms-2"
          style={{ lineHeight: 1 }}
          onClick={onHide}
        >
          ×
        </Button>
      </div>
      <div className="notification-body">{renderContent()}</div>
      <style>{`
        .notification-popover {
          background: white;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          max-height: min(70vh, 520px);
          overflow: hidden;
        }
        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid #e5e7eb;
          gap: 12px;
          flex-wrap: wrap;
        }
        .notification-header .title-row {
          flex: 1;
          min-width: 200px;
        }
        .notification-body {
          padding: 16px;
          overflow-y: auto;
          max-height: calc(70vh - 80px);
        }
        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
          transition: all 0.2s ease;
        }
        .notification-item:nth-child(even) {
          background: #f8fafc;
        }
        .notification-item.unread {
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
        }
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        .notification-content > div:first-child {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .notification-content > div:first-child > div:first-child {
          flex: 1;
          min-width: 0;
        }
        .notification-content .badge {
          min-width: 100px;
          text-align: center;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .notification-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0f172a;
        }
        .order-code {
          margin-left: 6px;
          font-size: 0.85rem;
          color: #2563eb;
          font-weight: 600;
        }
        .notification-content p {
          font-size: 0.85rem;
        }
        .notification-content button {
          min-width: 90px;
          font-size: 0.8rem;
          padding: 4px 10px;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .notification-popover {
            border-radius: 12px;
            max-height: calc(100vh - 90px);
          }
          .notification-header {
            padding: 12px 14px 10px;
            gap: 8px;
          }
          .notification-header .title-row {
            min-width: auto;
            width: 100%;
            margin-bottom: 8px;
          }
          .notification-header button {
            font-size: 0.85rem;
            padding: 6px 10px;
          }
          .notification-body {
            padding: 12px;
            max-height: calc(100vh - 150px);
          }
          .notification-item {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
          }
          .notification-title {
            font-size: 0.85rem;
          }
          .notification-content p {
            font-size: 0.8rem;
          }
          .notification-content button {
            min-width: auto;
            width: 100%;
            font-size: 0.75rem;
            padding: 4px 10px;
          }
          .notification-content .d-flex {
            flex-direction: column;
            gap: 8px;
          }
          .notification-content .d-flex > div {
            width: 100%;
          }
        }

        @media (max-width: 576px) {
          .notification-header {
            padding: 10px 12px 8px;
          }
          .notification-header .title-row {
            font-size: 0.9rem;
          }
          .notification-body {
            padding: 10px;
          }
          .notification-item {
            padding: 8px;
            gap: 8px;
          }
          .notification-title {
            font-size: 0.8rem;
          }
          .notification-content p {
            font-size: 0.75rem;
          }
          .notification-content button {
            font-size: 0.7rem;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default NotificationModals;
