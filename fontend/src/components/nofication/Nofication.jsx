import React, { useState, useEffect, createContext, useContext } from "react";
import Alert from "react-bootstrap/Alert";
import Fade from "react-bootstrap/Fade";

// Tạo context cho Notification
const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Hàm thêm thông báo
  const addNotification = (message, variant = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, variant, show: true }]);

    // Sau 1.5s thì ẩn đi (fade out)
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, show: false } : n
        )
      );
    }, 1500);

    // Sau 2s thì xóa khỏi danh sách
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Hiển thị thông báo */}
      <div
        className="notification-toast-container"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          left: "auto",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
          width: "auto",
        }}
      >
        {notifications.map((n) => (
          <Fade in={n.show} key={n.id}>
            <div>
              <Alert 
                variant={n.variant}
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  wordBreak: "break-word",
                }}
              >
                {n.message}
              </Alert>
            </div>
          </Fade>
        ))}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .notification-toast-container {
            top: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: calc(100vw - 20px) !important;
            width: calc(100vw - 20px) !important;
          }

          .notification-toast-container .alert {
            font-size: 0.9rem !important;
            padding: 12px 16px !important;
          }
        }

        @media (max-width: 576px) {
          .notification-toast-container {
            top: 5px !important;
            right: 5px !important;
            left: 5px !important;
            max-width: calc(100vw - 10px) !important;
            width: calc(100vw - 10px) !important;
          }

          .notification-toast-container .alert {
            font-size: 0.85rem !important;
            padding: 10px 14px !important;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
