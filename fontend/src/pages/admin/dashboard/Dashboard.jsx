import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Table,
  Badge,
  ProgressBar,
  Form,
  Button,
  Modal,
} from "react-bootstrap";

function Dashboard() {
  const [range, setRange] = useState("7d");
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    users: 0,
    foods: 0,
    accessories: 0,
    services: 0,
    revenueChange: 0,
    ordersChange: 0,
    customersChange: 0,
    productsChange: 0,
    profit: 0,
    profitChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    averageOrderValue: 0,
    aovChange: 0,
    returns: 0,
    cancellations: 0,
    partners: 0,
    serviceOrders: 0,
    serviceOrdersRevenue: 0,
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use dashboard stats for totals and breakdown
        const res = await fetch(
          `${API_BASE}/admin/dashboard/stats?period=` +
            encodeURIComponent(range),
          { credentials: "include" }
        );
        const data = await res.json();
        if (!data.success) throw new Error("Failed to fetch stats");

        const all = data.ranges?.allTime || { totalRevenue: 0, totalCount: 0 };
        const entities = data.entities || {};
        const averageOrderValue =
          all.totalCount > 0
            ? Math.round((all.totalRevenue || 0) / all.totalCount)
            : 0;

        setStats((prev) => ({
          ...prev,
          totalRevenue: all.totalRevenue || 0,
          totalOrders: all.totalCount || 0,
          totalCustomers: entities.customers || entities.users || 0,
          totalProducts: entities.productsTotal || 0,
          users: entities.users || 0,
          foods: entities.foods || 0,
          accessories: entities.accessories || 0,
          services: entities.services || 0,
          partners: entities.partners || 0,
          serviceOrders: entities.serviceOrders?.count || 0,
          serviceOrdersRevenue: entities.serviceOrders?.revenue || 0,
          averageOrderValue,
        }));

        // Build category revenue breakdown from revenueByType
        const rbt = Array.isArray(all.revenueByType) ? all.revenueByType : [];
        const foodRevenue = Number(
          rbt.find((x) => x.type === "food")?.revenue || 0
        );
        const accessoryRevenue = Number(
          rbt.find((x) => x.type === "accessory")?.revenue || 0
        );
        const total = foodRevenue + accessoryRevenue;
        const toPercent = (v) =>
          total > 0 ? Math.round((v / total) * 100) : 0;
        setCategoryBreakdown([
          {
            name: "Đồ ăn",
            percent: toPercent(foodRevenue),
            revenue: foodRevenue,
          },
          {
            name: "Phụ kiện",
            percent: toPercent(accessoryRevenue),
            revenue: accessoryRevenue,
          },
        ]);

        // Prepare trend points for simple line (no external chart lib)
        const points = Array.isArray(data.revenueTrend?.points)
          ? data.revenueTrend.points
          : [];
        setTrend(points);

        // widgets
        setTopProducts(data.widgets?.topProducts || []);
        const recentOrdersData = (data.widgets?.recentOrders || []).map((o) => {
          return {
            id: o.id,
            customer: o.customer,
            total: o.total,
            status: o.status,
          };
        });
        setRecentOrders(recentOrdersData);
        // Lọc bỏ các khách hàng không tồn tại (không có tên hoặc tên là "—")
        const validCustomers = (data.widgets?.topCustomers || []).filter(
          (c) => c.name && c.name.trim() !== "" && c.name !== "—" && c.name !== "Khách vãng lai"
        );
        setTopCustomers(validCustomers);
        setLowStock(data.widgets?.lowStock || []);
      } catch (e) {
        // keep defaults
        console.error(e);
      }
    };
    fetchStats();
  }, [range]);

  const [topProducts, setTopProducts] = useState([]);

  const [recentOrders, setRecentOrders] = useState([]);

  const [categoryBreakdown, setCategoryBreakdown] = useState([
    { name: "Đồ ăn", percent: 0, revenue: 0 },
    { name: "Phụ kiện", percent: 0, revenue: 0 },
  ]);

  const channelBreakdown = useMemo(
    () => [
      { name: "Website", percent: 62 },
      { name: "Facebook", percent: 24 },
      { name: "Shopee", percent: 10 },
      { name: "Khác", percent: 4 },
    ],
    [range]
  );

  const [topCustomers, setTopCustomers] = useState([]);

  const [lowStock, setLowStock] = useState([]);

  const [trend, setTrend] = useState([]);

  // Voucher modal state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    name: "",
    description: "",
    value: "",
    type: "percent",
    maxDiscount: "",
    applyOncePerUser: false,
    timeSlots: [{ date: "", startTime: "", endTime: "" }],
  });

  // Removed revenue trend chart per request

  // Simple inline SVG icons (multi-line to avoid parser issues)
  const IconMoney = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="6" width="18" height="12" opacity="0.2" />
      <circle cx="12" cy="12" r="3" />
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
  const IconCart = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M7 4H5L4 6h2l3 9h8l3-7H9"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
  const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="10" r="4" />
      <path d="M3 20a9 6 0 0 1 18 0" opacity="0.6" />
    </svg>
  );
  const IconBox = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 7L12 2 3 7v10l9 5 9-5V7z" />
    </svg>
  );
  const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M3 22v-2c0-4 4-7 9-7s9 3 9 7v2H3z" />
    </svg>
  );
  const IconFood = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="3" width="2" height="18" />
      <path d="M10 3h2v7h4V3h2v7a3 3 0 0 1-3 3h-3v8h-2V3z" />
    </svg>
  );
  const IconAccessory = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4" />
      <rect x="4" y="12" width="16" height="7" rx="2" />
    </svg>
  );
  const IconService = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5v6l-10 5-10-5v-6z" />
    </svg>
  );

  const formatCurrency = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
    return value.toLocaleString("vi-VN") + " ₫";
  };

  const getBasePrice = (p) => {
    const candidates = [
      p?.price,
      p?.currentPrice,
      p?.unitPrice,
      p?.priceNumber,
      p?.price_value,
      p?.unit_price,
      p?.amount,
    ];
    const found = candidates.find(
      (v) => typeof v === "number" && Number.isFinite(v)
    );
    if (Number.isFinite(found)) return Number(found);
    if (Number.isFinite(p?.revenue) && Number.isFinite(p?.sold) && p.sold > 0) {
      return Math.round(Number(p.revenue) / Number(p.sold));
    }
    return null;
  };

  const getDiscountedPrice = (p) => {
    const base = Number(getBasePrice(p));
    if (!Number.isFinite(base)) return null;
    if (Number.isFinite(p?.priceAfterDiscount))
      return Number(p.priceAfterDiscount);
    // Common discount shapes
    const type = p?.discountType ?? p?.voucherType;
    const value = Number(p?.discountValue ?? p?.voucherValue);
    if (!type || !Number.isFinite(value)) return null;
    if (type === "percent") {
      return Math.max(0, Math.round(base * (1 - value / 100)));
    }
    if (type === "amount") {
      return Math.max(0, Math.round(base - value));
    }
    return null;
  };

  const miniTrend = (
    label,
    value,
    change,
    variant,
    suffix = "",
    IconComp = null,
    to = null
  ) => (
    <Card
      className="mb-3 shadow-sm w-100 h-100"
      onClick={() => to && navigate(to)}
      style={{ ...(to ? { cursor: "pointer" } : {}), minHeight: 96 }}
    >
      <Card.Body className="py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span
              className={`rounded-circle bg-${variant}-subtle text-${variant} d-inline-flex align-items-center justify-content-center`}
              style={{ width: 36, height: 36 }}
            >
              {IconComp ? <IconComp /> : null}
            </span>
            <div>
              <div className="text-muted small">{label}</div>
              <div className="fs-4 fw-semibold mt-1">
                {typeof value === "number"
                  ? value.toLocaleString("vi-VN")
                  : value}
                {suffix}
              </div>
            </div>
          </div>
          <div className="small mt-1 fw-semibold text-success">
            {change >= 0 ? `+${change}%` : `${change}%`}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const statusBadge = (status) => {
    if (!status)
      return (
        <Badge
          bg="light"
          text="dark"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          N/A
        </Badge>
      );

    const statusLower = status.toLowerCase();

    // Order statuses - dựa vào ServiceOrders.jsx
    if (statusLower === "completed")
      return (
        <Badge
          bg="success"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Hoàn tất
        </Badge>
      );
    if (statusLower === "confirmed")
      return (
        <Badge
          bg="info"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đang xử lý
        </Badge>
      );
    if (statusLower === "in progress")
      return (
        <Badge
          bg="primary"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đã giao DVVC
        </Badge>
      );
    if (statusLower === "pending")
      return (
        <Badge
          bg="warning"
          text="dark"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đang chờ
        </Badge>
      );
    if (statusLower === "cancelled")
      return (
        <Badge
          bg="danger"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đã hủy
        </Badge>
      );

    // Legacy order statuses
    if (statusLower === "processing")
      return (
        <Badge
          bg="primary"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đang xử lý
        </Badge>
      );
    if (statusLower === "shipped")
      return (
        <Badge
          bg="info"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đã giao
        </Badge>
      );
    if (statusLower === "delivered")
      return (
        <Badge
          bg="success"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Đã nhận
        </Badge>
      );
    if (statusLower === "refunded")
      return (
        <Badge
          bg="secondary"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Hoàn tiền
        </Badge>
      );

    // Product statuses
    if (statusLower === "active")
      return (
        <Badge
          bg="success"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Active
        </Badge>
      );
    if (statusLower === "inactive")
      return (
        <Badge
          bg="secondary"
          style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
        >
          Inactive
        </Badge>
      );

    // Default fallback - show the actual status value
    return (
      <Badge
        bg="light"
        text="dark"
        style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
      >
        {status}
      </Badge>
    );
  };

  // Voucher modal functions
  const handleOpenVoucherModal = async (product) => {
    setSelectedProduct(product);
    setSelectedVoucher("");
    setShowVoucherModal(true);

    // Fetch available vouchers
    try {
      const res = await fetch(`${API_BASE}/admin/discounts`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.discounts) {
        // Filter only active discounts
        const activeDiscounts = data.discounts.filter(
          (d) => d.status === "active"
        );
        setAvailableVouchers(activeDiscounts);
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
    setShowAddVoucher(false);
    setNewVoucher({
      name: "",
      description: "",
      value: "",
      type: "percent",
      maxDiscount: "",
      applyOncePerUser: false,
      timeSlots: [{ date: "", startTime: "", endTime: "" }],
    });
  };

  const handleAssignVoucher = async () => {
    if (!selectedProduct || !selectedVoucher) return;

    try {
      const productType =
        selectedProduct.type === "food" ? "food" : "accessory";
      const res = await fetch(
        `${API_BASE}/admin/products/${productType}/edit/${selectedProduct._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            discount_id: selectedVoucher,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.success) {
        alert("Gán voucher thành công!");
        handleCloseVoucherModal();
        // Refresh dashboard data
        window.location.reload();
      } else {
        alert("Lỗi khi gán voucher: " + data.message);
      }
    } catch (error) {
      console.error("Error assigning voucher:", error);
      alert("Lỗi khi gán voucher");
    }
  };

  const handleAddVoucher = async () => {
    try {
      // Validate required fields
      if (
        !newVoucher.name ||
        !newVoucher.value ||
        !newVoucher.timeSlots[0].date ||
        !newVoucher.timeSlots[0].startTime ||
        !newVoucher.timeSlots[0].endTime
      ) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      // Prepare data for API
      const voucherData = {
        name: newVoucher.name,
        description: newVoucher.description,
        value: Number(newVoucher.value),
        type: newVoucher.type,
        maxDiscount: newVoucher.maxDiscount
          ? Number(newVoucher.maxDiscount)
          : null,
        applyOncePerUser: newVoucher.applyOncePerUser,
        timeSlots: newVoucher.timeSlots.filter(
          (slot) => slot.date && slot.startTime && slot.endTime
        ),
      };

      const res = await fetch(`${API_BASE}/admin/discounts/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(voucherData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.message === "Tạo discount thành công" || res.status === 201) {
        alert("Tạo voucher thành công!");
        // Refresh vouchers list
        const vouchersRes = await fetch(
          `${API_BASE}/admin/discounts`,
          { credentials: "include" }
        );
        const vouchersData = await vouchersRes.json();
        if (vouchersData.discounts) {
          const activeDiscounts = vouchersData.discounts.filter(
            (d) => d.status === "active"
          );
          setAvailableVouchers(activeDiscounts);
        }
        setShowAddVoucher(false);
        setNewVoucher({
          name: "",
          description: "",
          value: "",
          type: "percent",
          minOrderAmount: "",
          maxDiscount: "",
          applyOncePerUser: false,
          timeSlots: [{ date: "", startTime: "", endTime: "" }],
        });
      } else {
        alert("Lỗi khi tạo voucher: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating voucher:", error);
      alert("Lỗi khi tạo voucher: " + error.message);
    }
  };

  const addTimeSlot = () => {
    setNewVoucher((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { date: "", startTime: "", endTime: "" }],
    }));
  };

  const removeTimeSlot = (index) => {
    if (newVoucher.timeSlots.length > 1) {
      setNewVoucher((prev) => ({
        ...prev,
        timeSlots: prev.timeSlots.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTimeSlot = (index, field, value) => {
    setNewVoucher((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", minHeight: "auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0 text-center ">Tổng quan</h2>
        <Form.Select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="7d">7 ngày</option>
          <option value="30d">30 ngày</option>
          <option value="90d">90 ngày</option>
        </Form.Select>
      </div>

      {/* Top row - 5 cards */}
      <Row className="g-3">
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Doanh thu (₫)",
            stats.totalRevenue,
            stats.revenueChange,
            "success",
            " ₫",
            IconMoney,
            "/admin/revenues"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Đơn hàng",
            stats.totalOrders,
            stats.ordersChange,
            "info",
            "",
            IconCart,
            "/admin/orders"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Sản phẩm",
            stats.totalProducts,
            stats.productsChange,
            "warning",
            "",
            IconBox,
            "/admin/foods"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Đơn dịch vụ",
            stats.serviceOrders,
            0,
            "warning",
            "",
            IconService,
            "/admin/service-orders"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Người dùng",
            stats.users,
            0,
            "primary",
            "",
            IconUser,
            "/admin/users"
          )}
        </Col>
      </Row>

      {/* Bottom row - 5 cards (thêm 1 card trống để cân bằng) */}
      <Row className="mt-3 g-3">
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Đồ ăn",
            stats.foods,
            0,
            "info",
            "",
            IconFood,
            "/admin/foods"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Phụ kiện",
            stats.accessories,
            0,
            "secondary",
            "",
            IconAccessory,
            "/admin/accessories"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Dịch vụ",
            stats.services,
            0,
            "success",
            "",
            IconService,
            "/admin/services"
          )}
        </Col>
        <Col xl={2} md={4} sm={6} className="d-flex">
          {miniTrend(
            "Đối tác vận chuyển",
            stats.partners,
            0,
            "secondary",
            "",
            IconUsers,
            "/admin/shipping"
          )}
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col lg={6} className="d-flex">
          <Card
            className="shadow-sm mb-3 w-100 no-card-hover"
            style={{ height: "auto", minHeight: "fit-content" }}
          >
            <Card.Header className="bg-white fw-semibold">
              Sản phẩm bán chạy
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0 no-hover" style={{ fontSize: "1rem" }}>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th className="text-end">Giá</th>
                    <th>Voucher</th>
                    <th className="text-center">Đã bán</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="text-end"  title={p.name}>
                        {p.name}
                      </td>
                      <td>{p.category || "N/A"}</td>
                      <td className="text-end">
                        {(() => {
                          const base = getBasePrice(p);
                          return base == null ? "N/A" : formatCurrency(base);
                        })()}
                      </td>
                      <td title={p.voucher} >{p.voucher || "0"} </td>
                      <td className="text-center">
                        {p.sold.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  {/* Hàng tổng số lượng bán */}
                  <tr className="table-info fw-bold">
                    <td colSpan="2" className="text-center">
                      Tổng số lượng bán
                    </td>
                    <td className="text-end">
                      {formatCurrency(
                        topProducts.reduce((sum, p) => {
                          const base = getBasePrice(p);
                          return sum + (base || 0) * (p.sold || 0);
                        }, 0)
                      )}
                    </td>
                    <td></td>
                    <td className="text-center">
                      {topProducts
                        .reduce((sum, p) => sum + (p.sold || 0), 0)
                        .toLocaleString("vi-VN")}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="d-flex">
          <Card className="shadow-sm mb-3 no-card-hover">
            <Card.Header className="bg-white fw-semibold">
              Đơn hàng gần đây
            </Card.Header>

            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0 no-hover">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Khách</th>
                      <th className="text-end">Tổng</th>
                      <th>TT</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td title={o.id}>{o.id?.toString().slice(-4)}</td>
                        <td title={o.customer}>{o.customer}</td>
                        <td className="text-end">
                          {o.total.toLocaleString("vi-VN")} ₫
                        </td>
                        <td>{statusBadge(o.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3 g-3">
        <Col lg={6} className="d-flex">
          <Card
            className="shadow-sm mb-3 w-100 no-card-hover"
            style={{ height: "auto", minHeight: "fit-content" }}
          >
            <Card.Header className="bg-white fw-semibold">
              Khách hàng nổi bật
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0 no-hover" style={{ fontSize: "1rem" }}>
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th className="text-center">Số đơn</th>
                      <th className="text-end">Chi tiêu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, idx) => (
                      <tr key={c.customerId || `customer-${idx}-${c.name}`}>
                        <td title={c.name}>{c.name || "Khách vãng lai"}</td>
                        <td className="text-center">{c.orders || 0}</td>
                        <td className="text-end">
                          {(c.spent || 0).toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="d-flex">
          <Card
            className="shadow-sm mb-3 w-100 no-card-hover"
            style={{ height: "auto", minHeight: "fit-content" }}
          >
            <Card.Header className="bg-white fw-semibold">
              Sắp hết hàng
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="mb-0 no-hover" style={{ fontSize: "1rem" }}>
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Danh mục</th>
                      <th>Voucher</th>
                      <th className="text-end">Giá</th>
                      <th className="text-center">Tồn</th>
                      <th className="text-end">Tổng tiền</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p) => (
                      <tr key={p.name}>
                        <td title={p.name}>{p.name}</td>
                        <td>{p.category || "N/A"}</td>
                        <td title={p.voucher}>{p.voucher || "N/A"}</td>
                        <td className="text-end">
                          {p.price
                            ? p.price.toLocaleString("vi-VN") + " ₫"
                            : "N/A"}
                        </td>
                        <td className="text-center">
                          <span
                            className={p.stock < 10 ? "text-danger fw-bold" : ""}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="text-end">
                          {p.price && p.stock
                            ? (p.price * p.stock).toLocaleString("vi-VN") + " ₫"
                            : "N/A"}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{
                              fontSize: "0.6rem",
                              padding: "0.2rem 0.4rem",
                            }}
                            onClick={() => handleOpenVoucherModal(p)}
                          >
                            Voucher
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="table-info fw-bold">
                      <td colSpan="4" className="text-center">
                        Tổng cộng
                      </td>
                      <td className="text-center">
                        {lowStock
                          .reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
                          .toLocaleString("vi-VN")}
                      </td>
                      <td className="text-end">
                        {lowStock
                          .reduce(
                            (sum, p) => sum + (p.price || 0) * (p.stock || 0),
                            0
                          )
                          .toLocaleString("vi-VN")}{" "}
                        ₫
                      </td>
                      <td className="text-center">-</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
              <strong>Danh mục:</strong> {selectedProduct?.category}
            </p>
            <p>
              <strong>Giá:</strong>{" "}
              {selectedProduct?.price?.toLocaleString("vi-VN")} ₫
            </p>
            <p>
              <strong>Voucher hiện tại:</strong>{" "}
              {selectedProduct?.voucher || "Chưa có"}
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

          {!showAddVoucher ? (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                {availableVouchers.length === 0 && (
                  <p className="text-muted mb-0">
                    Không có voucher nào khả dụng.
                  </p>
                )}
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowAddVoucher(true)}
              >
                + Thêm voucher mới
              </Button>
            </div>
          ) : (
            <div className="border p-3 rounded mb-3">
              <h6>Thêm voucher mới</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên voucher *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newVoucher.name}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nhập tên voucher"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      type="text"
                      value={newVoucher.description}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Nhập mô tả"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giá trị *</Form.Label>
                    <Form.Control
                      type="number"
                      value={newVoucher.value}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder="Nhập giá trị"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại</Form.Label>
                    <Form.Select
                      value={newVoucher.type}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    >
                      <option value="percent">Phần trăm (%)</option>
                      <option value="amount">Số tiền (₫)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giảm tối đa (₫)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newVoucher.maxDiscount}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          maxDiscount: e.target.value,
                        }))
                      }
                      placeholder="Không giới hạn"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Chỉ áp dụng 1 lần/người dùng"
                      checked={newVoucher.applyOncePerUser}
                      onChange={(e) =>
                        setNewVoucher((prev) => ({
                          ...prev,
                          applyOncePerUser: e.target.checked,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label>Thời gian áp dụng *</Form.Label>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addTimeSlot}
                  >
                    + Thêm khung giờ
                  </Button>
                </div>
                {newVoucher.timeSlots.map((slot, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={4}>
                      <Form.Control
                        type="date"
                        value={slot.date}
                        onChange={(e) =>
                          updateTimeSlot(index, "date", e.target.value)
                        }
                        placeholder="Ngày"
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "startTime", e.target.value)
                        }
                        placeholder="Bắt đầu"
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTimeSlot(index, "endTime", e.target.value)
                        }
                        placeholder="Kết thúc"
                      />
                    </Col>
                    <Col md={2}>
                      {newVoucher.timeSlots.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                        >
                          Xóa
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
              </div>

              <div className="d-flex gap-2">
                <Button variant="success" onClick={handleAddVoucher}>
                  Tạo voucher
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddVoucher(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseVoucherModal}>
            Hủy
          </Button>
          {!showAddVoucher && (
            <Button
              variant="primary"
              onClick={handleAssignVoucher}
              disabled={!selectedVoucher}
            >
              Gán voucher
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dashboard;

// Disable table hover effects (background/transform) globally
const tableStyle = document.createElement("style");
tableStyle.innerHTML = `
.table-hover tbody tr:hover,
table tbody tr:hover {
  background-color: inherit !important;
  box-shadow: none !important;
  transform: none !important;
  transition: none !important;
}
/* Also disable any transforms/transitions applied to children when hovering rows */
table tbody tr:hover *,
.table-hover tbody tr:hover * {
  transform: none !important;
  transition: none !important;
}
/* Explicitly disable hover for tables tagged no-hover */
.no-hover tbody tr:hover,
.no-hover tbody tr:hover * {
  background-color: inherit !important;
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
}
/* Hard disable any transform/transition inside .no-hover tables */
.no-hover, .no-hover * {
  transform: none !important;
  transition: none !important;
}
/* Ensure origin doesn't cause perceived scaling */
.no-hover tbody tr { transform-origin: center center !important; }
/* Disable hover/transition for dashboard cards marked no-card-hover */
.no-card-hover,
.no-card-hover *,
.no-card-hover:hover,
.no-card-hover:hover * {
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
}

/* Responsive table handling: force wrap, limit cell width, allow horizontal scroll when unavoidable */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-responsive .table,
.table {
  width: 100% !important;
  table-layout: fixed; /* enable cell width control and wrapping */
  border-collapse: collapse;
}
.table th, .table td {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
  max-width: 240px; /* limit cell width to prevent extreme expansion */
  vertical-align: middle;
  padding: 0.55rem 0.75rem;
}
/* Specific tighter columns: mã, số lượng, giá trị nhỏ */
.table th.code, .table td.code { max-width: 80px; width: 8%; }
.table th.qty, .table td.qty { max-width: 80px; width: 8%; text-align: right; }
.table th.price, .table td.price { max-width: 110px; width: 12%; text-align: right; }

/* Truncate long single-line fields but allow wrap for multi-line content */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* small screens: giảm padding / font-size nếu cần */
@media (max-width: 992px) {
  .table th, .table td { font-size: 0.95rem; padding: 0.45rem 0.6rem; }
  .table th.code, .table td.code { display: table-cell; }
}
`;
document.head.appendChild(tableStyle);
