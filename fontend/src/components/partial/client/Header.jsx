import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { BsBellFill, BsDoorOpen, BsPersonVcard, BsSearch } from "react-icons/bs";
import { FaSearch, FaShoppingCart } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../../../context/SettingsContext";
import "../../../styles/client/LayoutClient.css";
import NotificationModals from "../../nofication/Modals";
const ORDER_NOTIFICATION_TYPES = "order,service_order";
function Header() {
  const { settings, getLogoUrl } = useSettings();
  const [cartCount, setCartCount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [foodCategories, setFoodCategories] = useState([]);
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const notificationButtonRef = useRef(null);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    const name = Cookies.get("fullName");
    if (name) setFullName(name);
    // Nếu chưa có cookie tên, thử gọi API lấy thông tin user bằng tokenUser (httpOnly cookie)
    if (!name) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/user`, {
            credentials: "include",
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.fullName) {
            setFullName(data.fullName);
            Cookies.set("fullName", data.fullName, { expires: 7 });
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, []);

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.cart && data.cart.products) {
        // Tính tổng số lượng sản phẩm trong giỏ hàng
        const totalQuantity = data.cart.products.reduce((total, product) => {
          return total + (product.quantity || 0);
        }, 0);
        setCartCount(totalQuantity);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Error fetching cart count:", err);
      setCartCount(0);
    }
  };

  const fetchUnreadNotifications = useCallback(async () => {
    if (!fullName) {
      setNotificationCount(0);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/notifications?limit=10&type=${ORDER_NOTIFICATION_TYPES}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationCount(data.unreadCount || 0);
      } else {
        setNotificationCount(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotificationCount(0);
    }
  }, [fullName]);

  // Fetch food categories for dropdown
  useEffect(() => {
    const fetchFoodCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/category/food`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.children) {
          setFoodCategories(data.children);
        }
      } catch (err) {
        console.error("Error fetching food categories:", err);
      }
    };

    const fetchAccessoryCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/category/accessory`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.children) {
          setAccessoryCategories(data.children);
        }
      } catch (err) {
        console.error("Error fetching accessory categories:", err);
      }
    };
    fetchAccessoryCategories();
    fetchFoodCategories();
    fetchCartCount(); // Fetch cart count when component mounts
  }, []);

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  const handleLogout = async () => {
    try {
      // Gọi API logout để invalidate refreshToken phía server (nếu có)
      await fetch(`${API_BASE}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    // Xóa tất cả cookies
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
    setFullName("");
    setCartCount(0); // Reset cart count on logout
    setNotificationCount(0);
    navigate("/login"); // Quay về trang login
  };

  const handleNotificationIconClick = () => {
    if (!fullName) {
      navigate("/login");
      return;
    }
    if (showNotificationsModal) {
      setShowNotificationsModal(false);
      return;
    }
    setShowNotificationsModal(true);
  };

  const handleNotificationsUpdated = (nextCount) => {
    if (typeof nextCount === "number" && !Number.isNaN(nextCount)) {
      setNotificationCount(nextCount);
    } else {
      fetchUnreadNotifications();
    }
  };

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    // Listen for custom cart update events
    window.addEventListener("cartUpdated", handleCartUpdate);

    // Also listen for storage changes (if other components update localStorage)
    window.addEventListener("storage", (e) => {
      if (e.key === "cartUpdated") {
        fetchCartCount();
      }
    });

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  // Search functionality
  const searchProducts = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=8`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setSearchResults(data.results || []);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(true); // Vẫn hiển thị dropdown để thông báo không tìm thấy
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowSearchResults(true); // Vẫn hiển thị dropdown để thông báo lỗi
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus input when search is opened
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchInput]);

  // Close other dropdowns when one is opened
  useEffect(() => {
    const handleDropdownToggle = (event) => {
      // Find all dropdown toggles
      const allDropdownToggles = document.querySelectorAll(".dropdown-toggle");
      const clickedToggle = event.target.closest(".dropdown-toggle");

      // Close all other dropdowns except the clicked one
      allDropdownToggles.forEach((toggle) => {
        if (toggle !== clickedToggle) {
          const dropdown = toggle.closest(".dropdown");
          if (dropdown) {
            dropdown.classList.remove("show");
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
              menu.classList.remove("show");
            }
          }
        }
      });
    };

    document.addEventListener("click", handleDropdownToggle);
    return () => {
      document.removeEventListener("click", handleDropdownToggle);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const handleSearchItemClick = (item) => {
    if (item) {
      // Handle different URL patterns
      let url = "";
      if (item.type === "food") {
        url = `/foods/${item.slug || item._id}`;
      } else if (item.type === "accessory") {
        url = `/accessories/${item.slug || item._id}`;
      } else if (item.type === "service") {
        url = `/services/${item.slug || item._id}`;
      } else {
        url = item.url || "/";
      }

      // Đóng dropdown và clear search
      setShowSearchResults(false);
      setSearchQuery("");

      // Navigate to the item
      navigate(url);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "food":
        return "";
      case "accessory":
        return "";
      case "service":
        return "";
      default:
        return "";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "food":
        return "Đồ ăn";
      case "accessory":
        return "Phụ kiện";
      case "service":
        return "Dịch vụ";
      default:
        return "Sản phẩm";
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const currentCategoryIdFromQuery = searchParams.get("categoryId");

  const buildAccessoryCategoryLink = (category) =>
    `/accessories?categoryId=${category._id}&categoryName=${encodeURIComponent(
      category.name
    )}`;

  const renderAccessoryCategories = (categories, level = 0) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      if (level === 0) {
        return (
          <div className="text-muted small px-3 py-2" key="no-accessory-categories">
            Chưa có phụ kiện
          </div>
        );
      }
      return null;
    }

    return categories.map((category) => {
      const hasChildren =
        Array.isArray(category.children) && category.children.length > 0;
      const isActive =
        location.pathname === "/accessories" &&
        currentCategoryIdFromQuery === category._id;

      return (
        <div
          key={`${category._id}-${level}`}
          className={`accessory-category-item level-${level} ${
            isActive ? "active" : ""
          } ${hasChildren ? "has-children" : ""}`}
        >
          <Link
            to={buildAccessoryCategoryLink(category)}
            className="category-link d-flex align-items-center justify-content-between"
          >
            <span>{category.name}</span>
            {hasChildren && <span className="submenu-indicator">›</span>}
          </Link>
          {hasChildren && (
            <div className="subcategory-dropdown">
              {renderAccessoryCategories(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Clean Header with Single Color */}
      <div
        style={{
          backgroundColor: "#0ea5e9",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          width: "100%",
        }}
      >
        <Navbar
          expand="lg"
          className="p-0 compact-navbar"
          style={{
            backgroundColor: "#0ea5e9",
            flexWrap: "nowrap",
            overflow: "visible",
            zIndex: 1050,
          }}
        >
          <Container
            className="header"
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              overflow: "visible",
              position: "relative",
              zIndex: 1050,
              padding: "10px 20px",
              maxWidth: "100%",
            }}
          >
            {/* Logo */}
            <Navbar.Brand
              as={Link}
              to="/"
              className="d-flex align-items-center gap-2 text-white"
              style={{
                transition: "all 0.3s ease",
                textDecoration: "none",
                marginRight: "24px",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.opacity = "1";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}
              >
                <img
                  src={getLogoUrl()}
                  alt="Logo"
                  className="logo"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="d-none d-md-block">
                <span
                  className="fw-bold text-white"
                  style={{
                    fontSize: "1.3rem",
                    lineHeight: "1.2",
                    letterSpacing: "0.3px",
                  }}
                >
                  🐾 {settings.shopName || "HaruShop"}
                </span>
              </div>
            </Navbar.Brand>

            {/* Search Input - Ra ngoài, chỉ hiển thị trên laptop/desktop */}
            <div
              className="position-relative search-container d-none d-lg-flex"
              ref={searchRef}
              style={{ 
                margin: "0 15px 0 0",
                flexShrink: 0,
              }}
            >
                <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center">
                  <div className="d-flex align-items-center search-input-group" style={{ gap: "6px" }}>
                  <Form.Control
                      ref={searchInputRef}
                    type="text"
                      placeholder="🔍 Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim() && searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                      className="search-input border-0"
                    style={{
                      padding: "10px 16px",
                      fontSize: "0.9rem",
                        borderRadius: "25px",
                        background: "rgba(255, 255, 255, 0.2)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "white",
                      transition: "all 0.3s ease",
                        width: "250px",
                        minWidth: "200px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <button
                    type="submit"
                    className="search-button border-0 d-flex align-items-center justify-content-center"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "25px",
                        background: "rgba(255, 255, 255, 0.25)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        color: "white",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        width: "42px",
                        height: "42px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255, 255, 255, 0.35)";
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255, 255, 255, 0.25)";
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      {isSearching ? (
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <FaSearch size={18} />
                      )}
                    </button>
                  </div>
                </Form>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div
                    className="position-absolute mt-1 search-results-dropdown"
                    style={{
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                      border: "none",
                      maxHeight: "500px",
                      overflowY: "auto",
                      zIndex: 1050,
                      minWidth: "400px",
                      width: "max-content",
                      left: "0",
                      top: "100%",
                      marginTop: "8px",
                    }}
                  >
                    {searchResults.length > 0 ? (
                      <>
                        <div
                          className="p-3 border-bottom"
                          style={{ background: "#f8fafc" }}
                        >
                          <small className="text-muted fw-medium">
                            🔍 Tìm thấy {searchResults.length} kết quả cho "
                            {searchQuery}"
                          </small>
                        </div>
                        <div className="row g-3 p-3">
                          {searchResults.map((item, index) => (
                            <div
                              key={`${item.type}-${item._id}-${index}`}
                              className="col-md-6 col-12"
                            >
                              <div
                                className="search-result-item p-3"
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSearchItemClick(item);
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background =
                                    "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
                                  e.target.style.transform = "translateY(-2px)";
                                  e.target.style.boxShadow =
                                    "0 4px 12px rgba(0, 0, 0, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "white";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    style={{
                                      width: "60px",
                                      height: "60px",
                                      borderRadius: "8px",
                                      background:
                                        "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "24px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {item.thumbnail ? (
                                      <img
                                        src={
                                          item.type === "service"
                                            ? item.thumbnail.startsWith("http")
                                              ? item.thumbnail
                                              : item.thumbnail.startsWith("/")
                                              ? `${API_BASE}${item.thumbnail}`
                                              : `${API_BASE}/uploads/services/${item.thumbnail}`
                                            : item.type === "food"
                                            ? `${API_BASE}/uploads/products/foods/${item.thumbnail}`
                                            : item.type === "accessory"
                                            ? `${API_BASE}/uploads/products/accessory/${item.thumbnail}`
                                            : item.thumbnail
                                        }
                                        alt={item.name}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextSibling.style.display =
                                            "block";
                                        }}
                                      />
                                    ) : null}
                                    <span
                                      style={{
                                        display: item.thumbnail
                                          ? "none"
                                          : "block",
                                      }}
                                    >
                                      {getTypeIcon(item.type)}
                                    </span>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div
                                      className="fw-medium text-dark mb-2"
                                      style={{ fontSize: "1rem" }}
                                    >
                                      {item.name}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                      <span
                                        className="badge"
                                        style={{
                                          backgroundColor:
                                            item.type === "food"
                                              ? "#10b981"
                                              : item.type === "accessory"
                                              ? "#f59e0b"
                                              : "#8b5cf6",
                                          color: "white",
                                          fontSize: "0.7rem",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        {getTypeLabel(item.type)}
                                      </span>
                                      {item.rating > 0 && (
                                        <span className="text-warning small">
                                          ⭐ {item.rating}
                                        </span>
                                      )}
                                    </div>
                                    {item.price && (
                                      <div
                                        className="text-success fw-bold"
                                        style={{ fontSize: "1rem" }}
                                      >
                                        {item.price.toLocaleString("vi-VN")}₫
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          className="p-3 text-center"
                          style={{
                            background: "#f8fafc",
                            borderTop: "1px solid #e2e8f0",
                          }}
                        >
                          <Link
                            to={`/search?q=${encodeURIComponent(searchQuery)}`}
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowSearchResults(false)}
                            style={{ fontSize: "0.9rem" }}
                          >
                            <BsSearch /> Xem tất cả kết quả cho "{searchQuery}"
                          </Link>
                        </div>
                      </>
                    ) : searchQuery.trim() && !isSearching ? (
                      <div className="p-4 text-center">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                          🔍
                        </div>
                        <div className="text-muted fw-medium mb-2">
                          Không tìm thấy kết quả
                        </div>
                        <div className="text-muted small">
                          Không có sản phẩm nào phù hợp với "{searchQuery}"
                        </div>
                        <div className="mt-3">
                          <Link
                            to={`/search?q=${encodeURIComponent(searchQuery)}`}
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowSearchResults(false)}
                          >
                            Tìm kiếm nâng cao
                          </Link>
                        </div>
                      </div>
                    ) : isSearching ? (
                      <div className="p-4 text-center">
                        <div
                          className="spinner-border spinner-border-sm text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Đang tìm kiếm...
                          </span>
                        </div>
                        <div className="text-muted small">Đang tìm kiếm...</div>
                      </div>
                    ) : null}
                  </div>
                )}
            </div>

            {/* Thông báo - Chỉ hiển thị trên mobile, ngoài collapse */}
            <div className="position-relative d-flex align-items-center d-lg-none" ref={notificationButtonRef} style={{ marginRight: "10px", flexShrink: 0 }}>
              <Nav.Link
                as="button"
                type="button"
                className="position-relative d-flex align-items-center justify-content-center text-white bg-transparent border-0 header-icon-btn"
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  width: "44px",
                  height: "44px",
                  flexShrink: 0,
                }}
                onClick={handleNotificationIconClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <BsBellFill size={20} />
                {notificationCount > 0 && (
                  <span
                    className="position-absolute top-50 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{
                      fontSize: "0.65rem",
                      padding: "3px 6px",
                      minWidth: "18px",
                      lineHeight: "1.2",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Nav.Link>
            </div>

            {/* Toggle button - Ngoài cùng bên phải */}
            <Navbar.Toggle
              aria-controls="basic-navbar-nav"
              className="border-0"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                padding: "10px 12px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }}></span>
            </Navbar.Toggle>

            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mx-auto align-items-center gap-1 d-flex flex-column flex-lg-row mobile-menu-nav justify-content-center">
              {/* Search Input - Trong collapse menu, chỉ hiển thị trên mobile */}
              <div
                className="position-relative search-container d-lg-none w-100 mb-3"
                ref={searchRef}
                style={{ 
                  padding: "0 10px",
                }}
              >
                <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center w-100">
                  <div className="d-flex align-items-center search-input-group" style={{ gap: "6px", width: "100%" }}>
                    <Form.Control
                      ref={searchInputRef}
                      type="text"
                      placeholder="🔍 Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim() && searchResults.length > 0) {
                          setShowSearchResults(true);
                        }
                      }}
                      className="search-input border-0"
                    style={{
                      padding: "10px 16px",
                        fontSize: "0.9rem",
                        borderRadius: "25px",
                      background: "rgba(255, 255, 255, 0.2)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        color: "white",
                        transition: "all 0.3s ease",
                        flex: "1",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <button
                      type="submit"
                      className="search-button border-0 d-flex align-items-center justify-content-center"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "25px",
                        background: "rgba(255, 255, 255, 0.25)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "white",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                        width: "42px",
                      height: "42px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255, 255, 255, 0.35)";
                      e.target.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255, 255, 255, 0.25)";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    {isSearching ? (
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <FaSearch size={18} />
                    )}
                  </button>
                </div>
              </Form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div
                    className="position-absolute mt-1 search-results-dropdown"
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                    border: "none",
                    maxHeight: "500px",
                    overflowY: "auto",
                    zIndex: 1050,
                      minWidth: "100%",
                    width: "max-content",
                      left: "10px",
                      right: "10px",
                      top: "100%",
                      marginTop: "8px",
                  }}
                >
                  {searchResults.length > 0 ? (
                    <>
                      <div
                        className="p-3 border-bottom"
                        style={{ background: "#f8fafc" }}
                      >
                        <small className="text-muted fw-medium">
                          🔍 Tìm thấy {searchResults.length} kết quả cho "
                          {searchQuery}"
                        </small>
                      </div>
                      <div className="row g-3 p-3">
                        {searchResults.map((item, index) => (
                          <div
                            key={`${item.type}-${item._id}-${index}`}
                            className="col-md-6 col-12"
                          >
                            <div
                              className="search-result-item p-3"
                              style={{
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSearchItemClick(item);
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background =
                                  "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                  "0 4px 12px rgba(0, 0, 0, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "white";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "8px",
                                    background:
                                      "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.thumbnail ? (
                                    <img
                                      src={
                                        item.type === "service"
                                          ? item.thumbnail.startsWith("http")
                                            ? item.thumbnail
                                            : item.thumbnail.startsWith("/")
                                            ? `${API_BASE}${item.thumbnail}`
                                            : `${API_BASE}/uploads/services/${item.thumbnail}`
                                          : item.type === "food"
                                          ? `${API_BASE}/uploads/products/foods/${item.thumbnail}`
                                          : item.type === "accessory"
                                          ? `${API_BASE}/uploads/products/accessory/${item.thumbnail}`
                                          : item.thumbnail
                                      }
                                      alt={item.name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "block";
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    style={{
                                      display: item.thumbnail
                                        ? "none"
                                        : "block",
                                    }}
                                  >
                                    {getTypeIcon(item.type)}
                                  </span>
                                </div>
                                <div className="flex-grow-1">
                                  <div
                                    className="fw-medium text-dark mb-2"
                                    style={{ fontSize: "1rem" }}
                                  >
                                    {item.name}
                                  </div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor:
                                          item.type === "food"
                                            ? "#10b981"
                                            : item.type === "accessory"
                                            ? "#f59e0b"
                                            : "#8b5cf6",
                                        color: "white",
                                        fontSize: "0.7rem",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      {getTypeLabel(item.type)}
                                    </span>
                                    {item.rating > 0 && (
                                      <span className="text-warning small">
                                        ⭐ {item.rating}
                                      </span>
                                    )}
                                  </div>
                                  {item.price && (
                                    <div
                                      className="text-success fw-bold"
                                      style={{ fontSize: "1rem" }}
                                    >
                                      {item.price.toLocaleString("vi-VN")}₫
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        className="p-3 text-center"
                        style={{
                          background: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Link
                          to={`/search?q=${encodeURIComponent(searchQuery)}`}
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowSearchResults(false)}
                          style={{ fontSize: "0.9rem" }}
                        >
                          <BsSearch /> Xem tất cả kết quả cho "{searchQuery}"
                        </Link>
                      </div>
                    </>
                  ) : searchQuery.trim() && !isSearching ? (
                    <div className="p-4 text-center">
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        🔍
                      </div>
                      <div className="text-muted fw-medium mb-2">
                        Không tìm thấy kết quả
                      </div>
                      <div className="text-muted small">
                        Không có sản phẩm nào phù hợp với "{searchQuery}"
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/search?q=${encodeURIComponent(searchQuery)}`}
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowSearchResults(false)}
                        >
                          Tìm kiếm nâng cao
                        </Link>
                      </div>
                    </div>
                  ) : isSearching ? (
                    <div className="p-4 text-center">
                      <div
                        className="spinner-border spinner-border-sm text-primary mb-2"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Đang tìm kiếm...
                        </span>
                      </div>
                      <div className="text-muted small">Đang tìm kiếm...</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

              {/* Menu chính */}
              <Link
                className="text-white header-menu-link"
                to="/"
                style={{
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  color: "white",
                  lineHeight: "1.5",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                }}
              >
                Trang chủ
              </Link>

              <NavDropdown
                title={
                  <span className="header-menu-link"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      lineHeight: "1.5",
                    }}
                  >
                    Đồ ăn
                  </span>
                }
                className="menu-button header-menu-dropdown"
                style={{
                  padding: 0,
                }}
                onClick={(e) => {
                  if (e.target.classList.contains("dropdown-toggle")) {
                    navigate("/foods");
                  }
                }}
              >
                {foodCategories.map((category) => {
                  const isActive =
                    location.pathname === "/foods" &&
                    currentCategoryIdFromQuery === category._id;

                  return (
                    <NavDropdown.Item
                      key={category._id}
                      as={Link}
                      to={`/foods?categoryId=${
                        category._id
                      }&categoryName=${encodeURIComponent(category.name)}`}
                      className={isActive ? "active-category-item" : ""}
                      style={{
                        backgroundColor: isActive ? "#0ea5e9" : "transparent",
                        color: isActive ? "white" : "#212529",
                        fontWeight: isActive ? "600" : "400",
                        transition: "all 0.2s ease",
                        borderRadius: isActive ? "8px" : "0",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                          e.currentTarget.style.color = "#212529";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#212529";
                        } else {
                          e.currentTarget.style.backgroundColor = "#0ea5e9";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                    >
                      {category.name}
                    </NavDropdown.Item>
                  );
                })}
              </NavDropdown>

              <NavDropdown
                title={
                  <span className="header-menu-link"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      lineHeight: "1.5",
                    }}
                  >
                    Phụ kiện
                  </span>
                }
                className="menu-button multi-level-dropdown header-menu-dropdown"
                style={{
                  padding: 0,
                }}
                onClick={(e) => {
                  if (e.target.classList.contains("dropdown-toggle")) {
                    navigate("/accessories");
                  }
                }}
              >
                <div className="accessory-dropdown-list">
                  {renderAccessoryCategories(accessoryCategories)}
                </div>
              </NavDropdown>

              <Link
                className="text-white header-menu-link"
                to="/services"
                style={{
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  color: "white",
                  lineHeight: "1.5",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                }}
              >
                Dịch vụ
              </Link>

              <NavDropdown
                title={
                  <span className="header-menu-link"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      lineHeight: "1.5",
                    }}
                  >
                    Đơn hàng
                  </span>
                }
                className="menu-button header-menu-dropdown"
                style={{
                  padding: 0,
                }}
                onClick={(e) => {
                  if (e.target.classList.contains("dropdown-toggle")) {
                    navigate("/orders");
                  }
                }}
              >
                <NavDropdown.Item as={Link} to="/orders">
                  Đơn hàng sản phẩm
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/service-orders">
                  Đơn dịch vụ
                </NavDropdown.Item>
              </NavDropdown>

              <Link
                className="text-white header-menu-link"
                to="/contact"
                style={{
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  color: "white",
                  lineHeight: "1.5",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                }}
              >
                Liên hệ
              </Link>

              {/* Thông báo - Trong collapse menu, cạnh giỏ hàng trên laptop */}
              <div className="position-relative d-none d-lg-flex align-items-center" ref={notificationButtonRef}>
                <Nav.Link
                  as="button"
                  type="button"
                  className="position-relative d-flex align-items-center justify-content-center text-white bg-transparent border-0 header-icon-btn"
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    width: "40px",
                    height: "40px",
                    marginRight: "8px",
                  }}
                  onClick={handleNotificationIconClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <BsBellFill size={20} />
                  {notificationCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{
                        fontSize: "0.65rem",
                        padding: "3px 6px",
                        minWidth: "18px",
                        lineHeight: "1.2",
                        fontWeight: "600",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Nav.Link>
              </div>

              {/* Giỏ hàng */}
              <Nav.Link
                as={Link}
                to="/cart"
                className="position-relative d-flex align-items-center justify-content-center text-white header-icon-btn"
                style={{
                  padding: "8px",
                  borderRadius: "10px",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                  width: "40px",
                  height: "40px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FaShoppingCart size={20} />
                {cartCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{
                      fontSize: "0.65rem",
                      padding: "3px 6px",
                      minWidth: "18px",
                      lineHeight: "1.2",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Nav.Link>

              {/* Tài khoản */}
              {!fullName && (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center justify-content-center text-white header-icon-btn"
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        width: "36px",
                        height: "36px",
                        fontSize: "18px",
                      }}
                    >
                      👤
                    </span>
                  }
                  className="nav-dropdown-custom"
                  style={{
                    padding: 0,
                  }}
                  menuVariant="dark"
                  align="end"
                >
                  <NavDropdown.Item
                    as={Link}
                    to="/login"
                    style={{
                      padding: "10px 16px",
                      transition: "all 0.2s ease",
                      borderLeft: "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
                      e.target.style.borderLeftColor = "#22c55e";
                      e.target.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderLeftColor = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      Đăng nhập
                    </span>
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    as={Link}
                    to="/register"
                    style={{
                      padding: "10px 16px",
                      transition: "all 0.2s ease",
                      borderLeft: "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
                      e.target.style.borderLeftColor = "#f59e0b";
                      e.target.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderLeftColor = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      Đăng ký
                    </span>
                  </NavDropdown.Item>
                </NavDropdown>
              )}
              {fullName && (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center justify-content-center text-white header-icon-btn"
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        minWidth: "auto",
                        height: "36px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        maxWidth: "180px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fullName}
                    </span>
                  }
                  className="nav-dropdown-custom"
                  style={{
                    padding: 0,
                  }}
                  menuVariant="dark"
                  align="end"
                >
                  <NavDropdown.Item
                    as={Link}
                    to="/user/profile"
                    style={{
                      padding: "10px 16px",
                      transition: "all 0.2s ease",
                      borderLeft: "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)";
                      e.target.style.borderLeftColor = "#3b82f6";
                      e.target.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderLeftColor = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <BsPersonVcard /> Thông tin tài khoản
                    </span>
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    onClick={handleLogout}
                    style={{
                      color: "#ef4444",
                      padding: "10px 16px",
                      transition: "all 0.2s ease",
                      borderLeft: "3px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
                      e.target.style.borderLeftColor = "#ef4444";
                      e.target.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.borderLeftColor = "transparent";
                      e.target.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <BsDoorOpen /> Đăng xuất
                    </span>
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>

      <NotificationModals
        show={showNotificationsModal}
        onHide={() => setShowNotificationsModal(false)}
        onUpdated={handleNotificationsUpdated}
        anchorRef={notificationButtonRef}
      />

      {/* Custom CSS for search styling */}
      <style>{`
        /* Fixed header compensation */
        body {
          padding-top: 80px !important;
          overflow-x: hidden !important;
        }

        /* Ensure dropdowns are not clipped */
        .container,
        .container-fluid {
          overflow: visible !important;
        }

        .navbar-nav {
          overflow: visible !important;
        }

        @media (max-width: 768px) {
          body {
            padding-top: 70px !important;
          }
        }

        .search-input-group {
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border-radius: 25px;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-input-group:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .search-input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.8) !important;
          font-weight: 400;
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.25) !important;
          border: 2px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.2) !important;
        }

        .search-button {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .search-button:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: scale(1.05) !important;
        }

        .search-button:active {
          transform: scale(0.95) !important;
        }

        /* Search results dropdown improvements */
        .search-results-dropdown {
          border-radius: 15px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
        }

        .search-result-item {
          border-radius: 10px !important;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .search-result-item:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        /* Dropdown menu fixes */
        .dropdown-menu {
          z-index: 1060 !important;
          position: absolute !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
          border-radius: 12px !important;
          background: white !important;
          margin-top: 8px !important;
          display: flex !important;
          flex-direction: column !important;
          width: auto !important;
          min-width: 200px !important;
        }

        .dropdown-item {
          display: block !important;
          width: 100% !important;
          padding: 10px 16px !important;
          clear: both !important;
          font-weight: 400 !important;
          color: #212529 !important;
          text-align: inherit !important;
          text-decoration: none !important;
          white-space: nowrap !important;
          background-color: transparent !important;
          border: 0 !important;
        }

        /* Active category item styling */
        .active-category-item {
          background-color: #0ea5e9 !important;
          color: white !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }

        .active-category-item:hover {
          background-color: #0ea5e9 !important;
          color: white !important;
        }

        .nav-dropdown-custom .dropdown-menu {
          z-index: 1060 !important;
          position: absolute !important;
          top: 100% !important;
          right: 0 !important;
          left: auto !important;
          min-width: 200px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
          border-radius: 12px !important;
          background: white !important;
          margin-top: 8px !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .nav-dropdown-custom .dropdown-menu.show {
          display: flex !important;
          flex-direction: column !important;
        }

        .nav-dropdown-custom .dropdown-toggle::after {
          margin-left: 8px !important;
        }

        /* Force all dropdown items to display vertically */
        .dropdown-menu .dropdown-item,
        .dropdown-menu a,
        .dropdown-menu .nav-link {
          display: block !important;
          width: 100% !important;
          float: none !important;
          clear: both !important;
        }

        /* Reset any flex properties that might cause horizontal layout */
        .dropdown-menu {
          flex-wrap: nowrap !important;
        }

        .multi-level-dropdown .dropdown-menu {
          min-width: 240px !important;
          padding: 12px !important;
        }

        .accessory-dropdown-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .accessory-category-item {
          position: relative;
          border-radius: 10px;
          transition: all 0.2s ease;
          padding: 0;
        }

        .accessory-category-item .category-link {
          padding: 10px 14px;
          color: #1f2937;
          text-decoration: none;
          font-weight: 500;
          display: flex;
        }

        .accessory-category-item .category-link:hover {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .accessory-category-item.active .category-link {
          background: #0ea5e9;
          color: white;
          border-radius: 10px;
        }

        .accessory-category-item.has-children .category-link {
          padding-right: 28px;
        }

        .accessory-category-item .submenu-indicator {
          font-size: 0.85rem;
          opacity: 0.5;
          margin-left: 8px;
        }

        .accessory-category-item.level-1 .category-link {
          font-size: 0.85rem;
        }

        .accessory-category-item.level-2 .category-link {
          font-size: 0.8rem;
        }

        .subcategory-dropdown {
          display: none;
          position: absolute;
          top: 0;
          left: calc(100% + 10px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 12px;
          min-width: 220px;
          z-index: 1070;
        }

        .accessory-category-item.has-children:hover > .subcategory-dropdown,
        .accessory-category-item.has-children .subcategory-dropdown:hover,
        .accessory-category-item.has-children .subcategory-dropdown:focus-within {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        @media (max-width: 992px) {
          .subcategory-dropdown {
            position: static;
            box-shadow: none;
            padding-left: 8px;
            margin-top: 4px;
            border-left: 2px solid #e2e8f0;
          }

          .accessory-category-item.has-children:hover > .subcategory-dropdown {
            display: flex;
          }
        }

        /* Ensure only one dropdown is open at a time */
        .dropdown-menu:not(.show) {
          display: none !important;
        }

        .dropdown-menu.show {
          display: flex !important;
          flex-direction: column !important;
        }

        /* Prevent multiple dropdowns from showing */
        .navbar-nav .dropdown:not(.show) .dropdown-menu {
          display: none !important;
        }

        .navbar-nav .dropdown.show .dropdown-menu {
          display: flex !important;
          flex-direction: column !important;
        }

        /* Bootstrap dropdown behavior */
        .dropdown-toggle[aria-expanded="false"] + .dropdown-menu {
          display: none !important;
        }

        .dropdown-toggle[aria-expanded="true"] + .dropdown-menu {
          display: flex !important;
          flex-direction: column !important;
        }

        /* Force single dropdown behavior */
        .navbar-nav .dropdown:not(.show) .dropdown-menu {
          opacity: 0 !important;
          visibility: hidden !important;
          transform: translateY(-10px) !important;
          transition: all 0.2s ease !important;
        }

        .navbar-nav .dropdown.show .dropdown-menu {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(0) !important;
          transition: all 0.2s ease !important;
        }

        /* Responsive search */
        @media (max-width: 1200px) {
          .search-container {
            max-width: 250px !important;
            min-width: 180px !important;
          }
        }

        @media (max-width: 992px) {
          .search-container {
            max-width: 200px !important;
            min-width: 150px !important;
          }
        }

        /* Đồng bộ font chữ cho tất cả menu items */
        .header-menu-link {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: white !important;
          line-height: 1.5 !important;
        }

        .header-menu-dropdown .dropdown-toggle {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: white !important;
          line-height: 1.5 !important;
        }

        .header-menu-dropdown .dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .header-icon-btn {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
        }

        /* Căn chỉnh gọn gàng */
        .header {
          min-height: 70px;
        }

        .navbar-nav {
          gap: 4px !important;
        }

        /* Cải thiện menu items */
        .header-menu-link {
          transition: all 0.3s ease !important;
        }

        .header-menu-link:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        .header-menu-dropdown .dropdown-toggle {
          transition: all 0.3s ease !important;
        }

        .header-menu-dropdown .dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        /* Icon buttons improvements */
        .header-icon-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .header-icon-btn:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        @media (max-width: 768px) {
          body {
            padding-top: 70px !important;
          }

          .search-container {
            margin: 0 8px !important;
            order: 2;
            flex: 1 1 auto !important;
            max-width: 200px !important;
          }

          .search-input-group {
            flex-wrap: nowrap !important;
            width: 100% !important;
          }

          .search-input {
            padding: 6px 10px !important;
            font-size: 0.8rem !important;
            min-width: 120px !important;
            flex: 1 1 auto !important;
          }

          .search-button {
            padding: 6px 8px !important;
            width: 32px !important;
            height: 32px !important;
            flex-shrink: 0;
          }

          .search-results-dropdown {
            min-width: calc(100vw - 40px) !important;
            max-width: calc(100vw - 40px) !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }

          .navbar-nav {
            width: 100%;
            margin-top: 0 !important;
            padding: 8px 0 !important;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0 0 12px 12px;
            justify-content: center !important;
            text-align: center !important;
          }

          .navbar-nav .nav-link,
          .navbar-nav .dropdown-toggle,
          .header-menu-link {
            padding: 12px 16px !important;
            font-size: 0.9rem !important;
            font-weight: 500 !important;
            color: white !important;
            width: 100%;
            text-align: center !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
            line-height: 1.4 !important;
            transition: all 0.2s ease !important;
            border-radius: 0 !important;
            justify-content: center !important;
          }

          .navbar-nav .nav-link:last-child,
          .navbar-nav .dropdown-toggle:last-child {
            border-bottom: none !important;
          }

          .navbar-nav .nav-link:hover,
          .navbar-nav .dropdown-toggle:hover {
            background: rgba(255, 255, 255, 0.15) !important;
          }

          .navbar-nav .header-icon-btn {
            justify-content: center !important;
            margin: 0 auto !important;
          }

          .navbar-nav .dropdown-menu {
            position: static !important;
            float: none !important;
            width: 100% !important;
            margin-top: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .navbar-nav .dropdown-item {
            padding: 10px 24px !important;
            color: rgba(255, 255, 255, 0.95) !important;
            font-size: 0.85rem !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            transition: all 0.2s ease !important;
          }

          .navbar-nav .dropdown-item:last-child {
            border-bottom: none !important;
          }

          .navbar-nav .dropdown-item:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            color: white !important;
            padding-left: 28px !important;
          }

          .header {
            flex-wrap: wrap !important;
          }

          .navbar-brand {
            margin-right: auto !important;
          }

          /* Icon buttons trên mobile - đã ra ngoài collapse */
          .header-icon-btn {
            width: 40px !important;
            height: 40px !important;
            padding: 8px !important;
          }
        }

        @media (max-width: 576px) {
          .search-container {
            margin: 0 6px !important;
            max-width: 160px !important;
          }

          .search-input {
            min-width: 100px !important;
            font-size: 0.75rem !important;
            padding: 5px 8px !important;
          }

          .search-button {
            width: 28px !important;
            height: 28px !important;
            padding: 5px !important;
          }

          .navbar-brand span {
            font-size: 1rem !important;
          }

          .navbar-brand div:first-child {
            width: 40px !important;
            height: 40px !important;
          }

          .navbar-brand .logo {
            width: 28px !important;
            height: 28px !important;
          }

          .navbar-nav .nav-link,
          .navbar-nav .dropdown-toggle {
            font-size: 0.85rem !important;
            padding: 10px 14px !important;
          }

          .navbar-nav .dropdown-item {
            padding: 8px 20px !important;
            font-size: 0.8rem !important;
          }

          .navbar-nav svg {
            width: 18px !important;
            height: 18px !important;
          }

          .badge {
            font-size: 0.65rem !important;
            padding: 2px 5px !important;
          }
        }

        /* Mobile menu improvements */
        @media (max-width: 991px) {
          .navbar-collapse {
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 0 0 12px 12px !important;
            margin-top: 8px !important;
            padding: 0 !important;
          }

          .mobile-menu-nav {
            flex-direction: column !important;
            width: 100% !important;
            gap: 0 !important;
          }
        }

        /* Ensure icons are visible on mobile */
        @media (max-width: 768px) {
          .navbar-nav .nav-link svg {
            width: 20px;
            height: 20px;
          }

          .navbar-nav .position-relative {
            display: flex;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
}

export default Header;
