import React, { useState } from "react";
import SiderBar from "../sidebar/SiderBar";
import TopBar from "../topbar/TopBar";
import { Outlet } from "react-router-dom";
import "../../styles/admin/LayoutAdmin.css";
import { PermissionsProvider } from "../../context/PermissionsContext";
import AuthGuard from "../auth/AuthGuard";

function LayoutAdmin() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <AuthGuard>
      <PermissionsProvider>
        {/* Sidebar, thêm class open/closed theo isOpen */}
        <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <SiderBar />
        </div>

        {/* Main content với margin-left phụ thuộc sidebar */}
        <div
          className={`main-content ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          {/* Truyền toggleSidebar cho TopBar để nút hamburger bật/tắt */}
          <TopBar toggleSidebar={toggleSidebar} />
          <Outlet />
        </div>
      </PermissionsProvider>
    </AuthGuard>
  );
}

export default LayoutAdmin;
