import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Row,
  Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../components/nofication/Nofication";
import CartItem from "./CartItem";
const API_BASE = `http://${window.location.hostname}:8080`;
const Cart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState({ user_id: "", products: [] });
  const [shippingMethod, setShippingMethod] = useState("free");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  // Per-item vouchers mapping: { [product_id]: { code, name, type, value } }
  const [productVouchers, setProductVouchers] = useState({});

  const { addNotification } = useNotification(); // Lưu voucher cho từng sản phẩm
  const navigate = useNavigate();
  const emitCartUpdated = () => {
    try {
      window.dispatchEvent(new Event("cartUpdated"));
      // Trigger storage event for other tabs/windows
      localStorage.setItem("cartUpdated", String(Date.now()));
    } catch (_) {}
  };

  const fetchCart = async (options = {}) => {
    const silent = !!options.silent;
    try {
      if (!silent) setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/cart`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok && !silent)
        addNotification("Không thể tải giỏ hàng", "danger");

      if (data.cart?.products?.length > 0) {
      }

      setCart(data.cart || { user_id: "", products: [] });
      emitCartUpdated();
    } catch (err) {
      console.error(err);
      if (!silent) setError(err.message || "Lỗi tải giỏ hàng");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Selection helpers
  const allSelected =
    cart.products.length > 0 &&
    cart.products.every((p) => p.selected !== false);
  const selectedCount = cart.products.filter(
    (p) => p.selected !== false
  ).length;
  const toggleSelectAll = () => {
    const nextSelected = !allSelected;
    setCart((prev) => ({
      ...prev,
      products: prev.products.map((p) => ({ ...p, selected: nextSelected })),
    }));
  };

  const deleteSelected = async () => {
    try {
      const selectedItems = cart.products.filter((p) => p.selected !== false);
      if (selectedItems.length === 0) return;
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`${API_BASE}/cart/remove/${item.product_id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              product_id: item.product_id,
              category_id: item.category_id,
            }),
          })
        )
      );
      await fetchCart({ silent: true });
      emitCartUpdated();
      addNotification("Đã xóa các sản phẩm đã chọn", "success");
    } catch (e) {
      console.error(e);
      addNotification("Xóa thất bại", "danger");
    }
  };

  const getProductQuantity = (cartItem) => {
    const product = cartItem?.product || {};
    const raw =
      product.quantity ??
      product.remainingStock ??
      product.availableStock ??
      cartItem?.quantity;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  };

  const getProductSoldCount = (cartItem) => {
    const product = cartItem?.product || {};
    const raw =
      product.sold_count ??
      cartItem?.sold_count ??
      cartItem?.sold;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  };

  const getAvailableStock = (cartItem) => {
    const total = getProductQuantity(cartItem);
    const sold = getProductSoldCount(cartItem);
    if (Number.isFinite(total) && Number.isFinite(sold)) {
      return Math.max(0, total - Math.max(0, sold));
    }
    if (Number.isFinite(total)) {
      return Math.max(0, total);
    }
    return Infinity;
  };

  const updateQuantity = async (index, nextQuantity) => {
    const cartItem = cart.products[index];
    if (!cartItem) return;
    try {
      const res = await fetch(
        `${API_BASE}/cart/update-quantity/${cartItem.product_id}/${nextQuantity}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ category_id: cartItem.category_id }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addNotification(
          data.message || "Không thể cập nhật số lượng sản phẩm",
          "danger"
        );
        await fetchCart();
        return;
      }
      await fetchCart({ silent: true });
      emitCartUpdated();
    } catch (error) {
      console.error("Lỗi cập nhật số lượng", error);
      addNotification("Không thể cập nhật số lượng sản phẩm", "danger");
      await fetchCart();
    }
  };

  const handleIncrease = async (index) => {
    const cartItem = cart.products[index];
    if (!cartItem) return;

    // Tính tồn kho thực sự còn lại
    const availableStock = getAvailableStock(cartItem);
    const currentQuantity = Number(cartItem.quantity || 0);
    const newQuantity = currentQuantity + 1;

    // Kiểm tra nếu số lượng hiện tại đã bằng hoặc vượt quá tồn kho
    if (currentQuantity >= availableStock) {
      addNotification("Đã đạt tới giới hạn tồn kho", "warning");
      return;
    }

    // Kiểm tra nếu số lượng mới sẽ vượt quá tồn kho
    if (newQuantity > availableStock) {
      addNotification("Đã đạt tới giới hạn tồn kho", "warning");
      return;
    }

    await updateQuantity(index, newQuantity);
  };

  const handleDecrease = async (index) => {
    const cartItem = cart.products[index];
    if (!cartItem) return;
    const newQuantity = Math.max(1, Number(cartItem.quantity || 0) - 1);
    if (newQuantity === Number(cartItem.quantity || 0)) return;
    await updateQuantity(index, newQuantity);
  };

  const handleRemove = async (item, index) => {
    try {
      const res = await fetch(
        `${API_BASE}/cart/remove/${item.product_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            product_id: item.product_id,
            category_id: item.category_id,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        addNotification("Sản phẩm đã được xóa khỏi giỏ hàng ", "success");
        setCart(data.cart);
        emitCartUpdated();
      } else {
        addNotification("Xóa thất bại", "danger");
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      addNotification("Không thể xóa sản phẩm", "danger");
    }
  };

  // Tính subtotal có áp dụng voucher cho từng sản phẩm
  // Subtotal BEFORE per-item vouchers
  const subtotalBeforeVoucher = cart.products
    .filter((p) => p.selected !== false)
    .reduce((sum, p) => {
      const unitPrice = Number(
        p.price_after_discount > 0
          ? p.price_after_discount
          : p.price_original || p?.product?.price || 0
      );
      return sum + unitPrice * Number(p.quantity || 0);
    }, 0);

  // Subtotal AFTER per-item vouchers
  const subtotalAfterVoucher = cart.products
    .filter((p) => p.selected !== false)
    .reduce((sum, p) => {
      let unitPrice = Number(
        p.price_after_discount > 0
          ? p.price_after_discount
          : p.price_original || p?.product?.price || 0
      );
      const v = productVouchers[p.product_id];
      if (v && v.value) {
        if (v.type === "percentage") {
          unitPrice = Math.max(
            0,
            Math.round(unitPrice * (1 - (v.value || 0) / 100))
          );
        } else if (v.type === "fixed") {
          unitPrice = Math.max(0, unitPrice - (v.value || 0));
        }
      }
      return sum + unitPrice * Number(p.quantity || 0);
    }, 0);

  // Tính phí vận chuyển
  const getShippingFee = () => {
    switch (shippingMethod) {
      case "free":
        return 0;
      case "standard":
        return 15000;
      case "express":
        return 25000;
      default:
        return 0;
    }
  };

  // Tính giảm giá voucher
  const getVoucherDiscount = () => {
    if (!selectedVoucher) return 0;
    // Giả sử voucher có thể là % hoặc số tiền cố định
    if (selectedVoucher.type === "percentage") {
      return Math.round((subtotalAfterVoucher * selectedVoucher.value) / 100);
    } else if (selectedVoucher.type === "shipping") {
      return 0; // Voucher miễn phí vận chuyển không giảm giá sản phẩm
    } else {
      return selectedVoucher.value;
    }
  };

  // Tính phí vận chuyển có áp dụng voucher
  const getFinalShippingFee = () => {
    const baseShippingFee = getShippingFee();
    if (selectedVoucher && selectedVoucher.type === "shipping") {
      return 0; // Miễn phí vận chuyển
    }
    return baseShippingFee;
  };

  const shippingFee = getFinalShippingFee();
  const voucherDiscount = getVoucherDiscount();
  const total = subtotalAfterVoucher + shippingFee - voucherDiscount;
  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h2 
          className="fw-bold mb-3"
          style={{ 
            color: '#1f2937',
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
           Giỏ hàng của bạn
        </h2>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Kiểm tra và thanh toán các sản phẩm đã chọn
        </p>
      </div>

      {loading && (
        <div 
          className="d-flex align-items-center justify-content-center gap-3 py-5"
          style={{ 
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Spinner animation="border" size="sm" style={{ color: '#f2760a' }} />
          <span className="fw-medium">Đang tải giỏ hàng...</span>
        </div>
      )}
      
      {error && (
        <Alert 
          variant="danger" 
          className="border-0 rounded-3"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            color: '#dc2626'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fw-medium">{error}</span>
          </div>
        </Alert>
      )}
      
      {!loading && !error && cart.products.length === 0 && (
        <div 
          className="text-center py-5"
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h4 className="text-muted mb-3">Giỏ hàng trống</h4>
          <p className="text-muted mb-4">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm!</p>
          <Button 
            variant="primary" 
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 2rem'
            }}
            onClick={() => window.history.back()}
          >
            Tiếp tục mua sắm
          </Button>
        </div>
      )}

      {!loading && !error && cart.products.length > 0 && (
        <Row className="g-4">
          <Col md={8}>
            {/* Header row with select-all and bulk delete */}
            <div 
              className="px-4 py-3 mb-3"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}
            >
              <Row className="align-items-center gx-4">
                <Col xs={12} md={5} className="d-flex align-items-center gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                      style={{
                        width: '1.2rem',
                        height: '1.2rem',
                        borderColor: '#f2760a',
                        accentColor: '#f2760a'
                      }}
                    />
                  </div>
                  <strong className="fs-5" style={{ color: '#1f2937' }}>Sản Phẩm</strong>
                </Col>
                <Col
                  xs={4}
                  md={2}
                  className="text-center text-muted d-none d-md-block"
                >
                  <strong className="fs-6">Đơn Giá</strong>
                </Col>
                <Col
                  xs={4}
                  md={2}
                  className="text-center text-muted d-none d-md-block"
                >
                  <strong className="fs-6">Số Lượng</strong>
                </Col>
                <Col
                  xs={4}
                  md={2}
                  className="text-end text-muted d-none d-md-block"
                >
                  <strong className="fs-6">Số Tiền</strong>
                </Col>
                <Col
                  xs={12}
                  md={1}
                  className="text-end text-muted d-none d-md-block"
                >
                  <strong className="fs-6">Hành Động</strong>
                </Col>
              </Row>
              {selectedCount > 0 && (
                <div className="mt-3 d-flex justify-content-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={deleteSelected}
                    style={{
                      borderRadius: '8px',
                      borderColor: '#ef4444',
                      color: '#ef4444',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ef4444';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#ef4444';
                    }}
                  >
                     Xóa đã chọn ({selectedCount})
                  </Button>
                </div>
              )}
            </div>
            {cart.products.map((item, index) => (
              <div
                key={`${item.product_id}-${index}`}
                className="mb-3 animate-fade-in"
                style={{
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                  quantity: getProductQuantity(item),
                  sold_count: getProductSoldCount(item),
                })}
                <CartItem
                  item={item}
                  totalQuantity={getProductQuantity(item)}
                  soldCount={getProductSoldCount(item)}
                  availableToAdd={Math.max(0, getAvailableStock(item) - Number(item.quantity || 0))}
                  onIncrease={() => handleIncrease(index)}
                  onDecrease={() => handleDecrease(index)}
                  onRemove={() => handleRemove(item, index)}
                  onToggleSelect={() => {
                    setCart((prev) => {
                      const next = { ...prev, products: [...prev.products] };
                      const cur = next.products[index];
                      next.products[index] = {
                        ...cur,
                        selected: !(cur?.selected !== false ? true : false),
                      };
                      return next;
                    });
                  }}
                />
              </div>
            ))}
          </Col>
          
          <Col md={4}>
            <div
              className="card border-0"
              style={{ 
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                borderRadius: "20px",
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                position: 'sticky',
                top: '20px'
              }}
            >
              <div className="card-body p-4">
              
              
                {/* Tổng cộng */}
                <div 
                  className="d-flex justify-content-between mb-4 p-4 rounded-3"
                  style={{ 
                    background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
                    color: 'white'
                  }}
                >
                  <span className="fw-bold fs-5">Tổng cộng:</span>
                  <strong className="fs-4">
                    {(total || 0).toLocaleString("vi-VN")}₫
                  </strong>
                </div>

                <Button
                  className="w-100 py-3 fw-bold"
                  variant="primary"
                  disabled={selectedCount === 0}
                  size="lg"
                  onClick={() => navigate("/order/create")}
                  style={{
                    background: selectedCount === 0 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                      : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    boxShadow: selectedCount === 0 
                      ? 'none'
                      : '0 4px 14px 0 rgba(14, 165, 233, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCount > 0) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px 0 rgba(14, 165, 233, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCount > 0) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 14px 0 rgba(14, 165, 233, 0.4)';
                    }
                  }}
                >
                  {selectedCount === 0 ? (
                    'Chọn sản phẩm để thanh toán'
                  ) : (
                    <>
                       Mua ngay ({selectedCount} sản phẩm)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
      {/* Đã bỏ modal quản lý địa chỉ giao hàng */}
    </Container>
  );
};

export default Cart;
