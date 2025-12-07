import { useEffect, useState } from "react";
import { Nav, NavDropdown } from "react-bootstrap";
import {
  FaBars,
  FaBoxOpen,
  FaChartBar,
  FaCog,
  FaConciergeBell,
  FaEnvelope,
  FaHamburger,
  FaHome,
  FaKey,
  FaListAlt,
  FaShoppingCart,
  FaTags,
  FaTicketAlt,
  FaTruck,
  FaUserCircle,
  FaUsers,
  FaUserShield
} from "react-icons/fa";
import { Link } from "react-router-dom";

function SiderBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    // Bypass permission checks entirely
    setPermissions([]);
    setIsAdmin(true);
  }, []);

  const has = () => true;
  const hasAny = () => true;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Nút toggle cho màn hình nhỏ */}
      <div
        style={{
          backgroundColor: "#0ea5e9",
          padding: "10px",
          color: "white",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          zIndex: 1000,
        }}
        className="d-md-none"
      >
        <FaBars
          size={24}
          onClick={toggleSidebar}
          style={{ cursor: "pointer" }}
        />
        <h5 className="ms-3 mb-0"> HaiRu Shop</h5>
      </div>

      {/* Sidebar */}
      <div
        style={{
          height: "100vh",
          backgroundColor: "#0ea5e9",
          color: "white",
          paddingTop: "60px",
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-260px",
          width: "260px",
          transition: "left 0.3s ease",
          zIndex: 999,
          overflowY: "auto",
        }}
        className="d-flex flex-column"
      >
        <h4 className="text-center mb-4 d-none d-md-block">HaiRu Shop</h4>

        <Nav defaultActiveKey="/admin" className="flex-column sidebar-nav">
          <Nav.Link as={Link} to="/admin" className="sidebar-nav-link text-white">
            <FaHome style={{ marginRight: "8px" }} />
            Dashboard
          </Nav.Link>

          {hasAny("users.read", "users.create", "users.update", "users.delete") && (
          <Nav.Link as={Link} to="/admin/users" className="sidebar-nav-link text-white">
            <FaUsers style={{ marginRight: "8px" }} />
            Quản lý người dùng
          </Nav.Link>
          )}
          {hasAny("accounts.read", "accounts.create", "accounts.update", "accounts.delete") && (
          <Nav.Link as={Link} to="/admin/accounts" className="sidebar-nav-link text-white">
            <FaUsers style={{ marginRight: "8px" }} />
            Quản lý tài khoản 
          </Nav.Link>
          )}

          {hasAny("products.read","products.create","products.update","products.delete") && (
          <NavDropdown
            title={
              <>
                <FaBoxOpen style={{ marginRight: "8px" }} />
                Quản lý Sản phẩm
              </>
            }
            id="nav-dropdown-products"
            className="sidebar-nav-dropdown"
          >
            <NavDropdown.Item as={Link} to="/admin/foods" className="sidebar-nav-dropdown-item">
              <FaHamburger style={{ marginRight: "6px" }} />
              Đồ ăn
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/admin/accessories" className="sidebar-nav-dropdown-item">
              <FaTags style={{ marginRight: "6px" }} />
              Phụ kiện
            </NavDropdown.Item>
          </NavDropdown>
          )}

          {hasAny("categories.read","categories.create","categories.update","categories.delete") && (
          <Nav.Link as={Link} to="/admin/categories" className="sidebar-nav-link text-white">
            <FaListAlt style={{ marginRight: "8px" }} />
            Quản lý danh mục
          </Nav.Link>
          )}

          {hasAny("services.read","services.create","services.update","services.delete") && (
          <Nav.Link as={Link} to="/admin/services" className="sidebar-nav-link text-white">
            <FaConciergeBell style={{ marginRight: "8px" }} />
            Quản lý dịch vụ
          </Nav.Link>
          )}

          {hasAny("orders.read","orders.update") && (
          <Nav.Link as={Link} to="/admin/orders" className="sidebar-nav-link text-white">
            <FaShoppingCart style={{ marginRight: "8px" }} />
            Quản lý đơn hàng
          </Nav.Link>
          )}

          {hasAny("orderservices.read","orderservices.update") && (
          <Nav.Link as={Link} to="/admin/service-orders" className="sidebar-nav-link text-white">
            <FaConciergeBell style={{ marginRight: "8px" }} />
            Quản lý lịch đặt dịch vụ
          </Nav.Link>
          )}

          {hasAny("discounts.read","discounts.create","discounts.update","discounts.delete") && (
          <Nav.Link as={Link} to="/admin/discounts" className="sidebar-nav-link text-white">
            <FaTicketAlt style={{ marginRight: "8px" }} />
            Quản lý mã giảm giá
          </Nav.Link>
          )}

          {isAdmin && (
          <Nav.Link as={Link} to="/admin/roles" className="sidebar-nav-link text-white">
            <FaUserShield style={{ marginRight: "8px" }} />
            Quản lý role
          </Nav.Link>
          )}

          {hasAny("customers.read","customers.create","customers.update","customers.delete") && (
          <Nav.Link as={Link} to="/admin/customers" className="sidebar-nav-link text-white">
            <FaUserCircle style={{ marginRight: "8px" }} />
            Quản lý địa chỉ giao hàng 
          </Nav.Link>
          )}

       
          {hasAny("payments.read","payments.create","payments.update","payments.delete") && (
          <Nav.Link as={Link} to="/admin/payments" className="sidebar-nav-link text-white">
            <FaTruck style={{ marginRight: "8px" }} />
            Quản lý phương thức thanh toán
          </Nav.Link>
          )}

          {(hasAny("shipping.read","shipping.create","shipping.update","shipping.delete") || isAdmin) && (
          <Nav.Link as={Link} to="/admin/shipping" className="sidebar-nav-link text-white">
            <FaTruck style={{ marginRight: "8px" }} />
            Quản lý đối tác
          </Nav.Link>
          )}

          {hasAny("contacts.read","contacts.update") && (
          <Nav.Link as={Link} to="/admin/contacts" className="sidebar-nav-link text-white">
            <FaEnvelope style={{ marginRight: "8px" }} />
            Quản lý phản hồi 
          </Nav.Link>
          )}
          {hasAny("revenues.read","revenues.update") && (
          <Nav.Link as={Link} to="/admin/revenues" className="sidebar-nav-link text-white">
            <FaEnvelope style={{ marginRight: "8px" }} />
            Thông kê doanh thu
          </Nav.Link>
          )}

          
          

          {isAdmin && (
          <Nav.Link as={Link} to="/admin/permissions" className="sidebar-nav-link text-white">
            <FaKey style={{ marginRight: "8px" }} />
            Phân quyền
          </Nav.Link>
          )}

          {hasAny("users.read") && (
          <Nav.Link as={Link} to="/admin/settings" className="sidebar-nav-link text-white">
            <FaCog style={{ marginRight: "8px" }} />
            Cài đặt
          </Nav.Link>
          )}
        </Nav>
      </div>
    </>
  );
}

export default SiderBar;

