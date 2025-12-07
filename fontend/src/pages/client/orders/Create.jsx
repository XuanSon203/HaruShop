import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function CreateOrder() {
  const [cart, setCart] = useState({ user_id: "", products: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [note, setNote] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showMomoModal, setShowMomoModal] = useState(false);
  const API_BASE = `http://${window.location.hostname}:8080`;

  const [momoPayUrl, setMomoPayUrl] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(-1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    phone: "",
    address: "",
  });
  const { addNotification } = useNotification();
  // Helper to normalize various Mongo/ObjectID shapes to plain string
  const normalizeId = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (typeof val.$oid === "string") return val.$oid;
      if (typeof val._id === "string") return val._id;
      if (val._id && typeof val._id.$oid === "string") return val._id.$oid;
    }
    try {
      return String(val);
    } catch (_) {
      return null;
    }
  };
  const extractShippingId = (cartProduct) => {
    try {
      const product = cartProduct?.product || {};
      const raw = cartProduct?.shipping_id ?? product?.shipping_id;
      if (!raw) return null;
      if (typeof raw === "string") return raw;
      if (typeof raw === "object") {
        if (typeof raw._id === "string") return raw._id;
        if (
          raw._id &&
          typeof raw._id === "object" &&
          typeof raw._id.$oid === "string"
        )
          return raw._id.$oid;
        if (typeof raw.$oid === "string") return raw.$oid;
      }
      return null;
    } catch (_) {
      return null;
    }
  };
  const listCustomer = async () => {
    try {
      const resCus = await fetch(`${API_BASE}/customer`, {
        credentials: "include",
        method: "GET",
      });
      const dataCus = await resCus.json();
      if (resCus.ok && Array.isArray(dataCus?.customers)) {
        // Lưu customers để render to-do list
        setCustomers(dataCus.customers);

        // Flatten địa chỉ cho khu "Địa chỉ nhận hàng"
        const flat = dataCus.customers.flatMap((c) => {
          const addrs = Array.isArray(c.address)
            ? c.address
            : c.address
            ? [c.address]
            : [];
          return addrs.map((addr) => {
            const addrStr =
              typeof addr === "string"
                ? addr
                : [addr.street, addr.district, addr.city]
                    .filter(Boolean)
                    .join(", ");
            return {
              _id: c._id,
              name: c.fullName,
              phone: c.phone,
              address: addrStr,
              customer_id: c._id,
            };
          });
        });
        if (flat.length > 0) {
          setAddresses(flat);
          setSelectedAddressIdx(0);
          setSelectedCustomerId(flat[0].customer_id);
        }
      }
    } catch {}
  };

  const sendAddressToServer = async (addr) => {
    if (!addr || !addr.address) return;
    
    // Kiểm tra xem địa chỉ đã tồn tại chưa (dựa vào _id hoặc số điện thoại)
    // Nếu địa chỉ đã có _id (đã được lưu trước đó), không cần lưu lại
    if (addr._id) {
      return; // Địa chỉ đã tồn tại, không cần lưu lại
    }
    
    // Kiểm tra xem số điện thoại đã tồn tại trong danh sách chưa
    const existingAddress = addresses.find(
      (a) => String(a.phone).trim() === String(addr.phone).trim() && a._id
    );
    if (existingAddress) {
      return; // Địa chỉ với số điện thoại này đã tồn tại, không cần lưu lại
    }
    
    try {
      const res = await fetch(`${API_BASE}/customer/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: cart.user_id,
          fullName: addr.name,
          phone: addr.phone,
          address: addr.address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Nếu lỗi là do số điện thoại đã tồn tại, bỏ qua (không throw error)
        if (data.message && data.message.includes("Số điện thoại đã được sử dụng")) {
          return;
        }
        throw new Error(data.message || "Không thể lưu địa chỉ");
      }
      return data;
    } catch (error) {
      // Nếu lỗi là do số điện thoại đã tồn tại, bỏ qua (không throw error)
      if (error.message && error.message.includes("Số điện thoại đã được sử dụng")) {
        return;
      }
      throw error;
    }
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/cart`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.status === 401) {
          // Không đăng nhập
          setCart({ user_id: "", products: [] });
          throw new Error(data?.message || "Bạn chưa đăng nhập");
        }
        if (!res.ok)
          throw new Error(data?.message || "Không thể tải giỏ hàng");
        setCart(data.cart || { user_id: "", products: [] });
      } catch (e) {
        setError(e.message || "Lỗi tải giỏ hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
    listCustomer();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/payment/methods`, {
          method: "GET",
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.methods)) {
          setPaymentMethods(data.methods);
          // Sử dụng slug hoặc _id làm identifier
          if (data.methods.length > 0) {
            const firstMethod = data.methods[0];
            setPaymentMethod(firstMethod.slug || firstMethod._id || "cod");
          }
        }
      } catch (_) {}
    })();
    // Prefer dynamic data from backend customers → flatten into addresses list
  }, []);
  const subtotal = useMemo(() => {
    return cart.products.reduce((sum, p) => {
      const unit = Number(
        p.price_after_discount > 0
          ? p.price_after_discount
          : p.price_original || p?.product?.price || 0
      );
      return sum + unit * Number(p.quantity || 0);
    }, 0);
  }, [cart]);

  // Dynamic shipping providers and selection
  const [shippingProviders, setShippingProviders] = useState([]);
  const [shippingProvider, setShippingProvider] = useState(null); // selected provider
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedProviderMethod, setSelectedProviderMethod] = useState(null);
  useEffect(() => {
    // derive shipping id from cart items and fetch provider
    const deriveShippingId = () => {
      try {
        const ids = (cart?.products || [])
          .map((p) => extractShippingId(p))
          .filter(Boolean);
        return ids.length > 0 ? ids[0] : null;
      } catch (_) {
        return null;
      }
    };

    (async () => {
      // Nếu chưa đăng nhập hoặc chưa có sản phẩm thì không cần gọi API vận chuyển
      if (!cart?.user_id || !(cart?.products || []).length) {
        setShippingProviders([]);
        setShippingProvider(null);
        setSelectedProviderMethod(null);
        setShippingLoading(false);
        return;
      }

      setShippingLoading(true);
      try {
        let shippingId = deriveShippingId();
        // If missing, try to fetch from first product detail
        if (!shippingId) {
          const first = (cart?.products || [])[0];
          const pid = first?.product_id || first?._id || first?.product?._id;
          const isAccessory = first?.product?.slug;
          if (pid) {
            try {
              const endpoint = isAccessory
                ? `${API_BASE}/accessories/${pid}`
                : `${API_BASE}/foods/${pid}`;
              const response = await fetch(endpoint);
              const data = await response.json();
              const detail =
                data?.accessory || data?.food || data?.data || data?.item;
              const sid =
                detail?.shipping_id || data?.shipping_id || detail?._id?.shipping_id;
              if (sid) {
                if (typeof sid === "string") shippingId = sid;
                else if (typeof sid === "object")
                  shippingId = sid._id || sid.$oid || sid?._id?.$oid || null;
              } else if (!isAccessory) {
                // fallback try accessories if first attempt was food
                const accessoryRes = await fetch(
                  `${API_BASE}/accessories/${pid}`
                );
                const accessoryData = await accessoryRes.json();
                const sid2 =
                  accessoryData?.accessory?.shipping_id ||
                  accessoryData?.shipping_id;
                if (sid2) {
                  if (typeof sid2 === "string") shippingId = sid2;
                  else if (typeof sid2 === "object")
                    shippingId =
                      sid2._id || sid2.$oid || sid2?._id?.$oid || null;
                }
              }
            } catch (_) {}
          }
        }

        // Chỉ dùng public route để tránh 401 khi không có quyền admin
        let provider = null;
        if (shippingId) {
          try {
            const res2 = await fetch(`${API_BASE}/shipping/${shippingId}`);
            const data2 = await res2.json();
            if (res2.ok && (data2.item || data2.shipping))
              provider = data2.item || data2.shipping;
          } catch (_) {}
        }

        // Fetch list of providers for dropdown (public only)
        let list = [];
        try {
          const rl2 = await fetch(`${API_BASE}/shipping`);
          const dl2 = await rl2.json();
          const arr = dl2.items || dl2.list || dl2.shippings || dl2.data;
          if (Array.isArray(arr)) list = arr;
        } catch (_) {}

        // Determine selected provider
        let selected = provider;
        if (!selected && shippingId && Array.isArray(list) && list.length > 0) {
          selected =
            list.find((x) => normalizeId(x._id) === normalizeId(shippingId)) ||
            list.find((x) => normalizeId(x.id) === normalizeId(shippingId)) ||
            null;
        }
        if (!selected && list.length > 0) {
          selected = list[0];
        }

        // Ensure list has at least the selected provider so dropdown has options
        if ((!Array.isArray(list) || list.length === 0) && selected) {
          list = [selected];
        }
        setShippingProviders(Array.isArray(list) ? list : []);
        if (selected) {
          setShippingProvider(selected);
          // default select first provider method if exists
          if (Array.isArray(selected.methods) && selected.methods.length > 0) {
            setSelectedProviderMethod(selected.methods[0]);
            if (selected.methods[0]?.name)
              setShippingMethod(selected.methods[0].name);
          } else if (selected?.name) {
            setShippingMethod(selected.name);
          }
        } else {
          setShippingProvider(null);
        }
      } catch (_) {
        setShippingProvider(null);
      } finally {
        setShippingLoading(false);
      }
    })();
  }, [cart]);

  const shippingFee = useMemo(() => {
    if (
      selectedProviderMethod &&
      typeof selectedProviderMethod.price === "number"
    ) {
      return Number(selectedProviderMethod.price || 0);
    }
    return Number(shippingProvider?.price || 0);
  }, [shippingProvider, selectedProviderMethod]);

  const originalSubtotal = useMemo(() => {
    return cart.products.reduce((sum, p) => {
      const unit = Number(p.price_original || p?.product?.price || 0);
      return sum + unit * Number(p.quantity || 0);
    }, 0);
  }, [cart]);

  const savingsFromCart = Math.max(0, originalSubtotal - subtotal);

  const total = Math.max(0, subtotal + shippingFee);
  const handlePlaceOrder = async () => {
    // Chặn đặt hàng khi chưa đăng nhập
    if (!cart?.user_id) {
      addNotification("Bạn chưa đăng nhập", "danger");
      return;
    }
    // Derive shipping_id from products in cart (prefer the first available)
    const deriveShippingId = () => {
      try {
        const ids = (cart?.products || [])
          .map((p) => {
            const prod = p?.product || {};
            const sid = p?.shipping_id ?? prod?.shipping_id;
            if (!sid) return null;
            if (typeof sid === "string") return sid;
            if (typeof sid === "object") return sid?._id || null;
            return null;
          })
          .filter(Boolean);
        return ids.length > 0 ? ids[0] : null;
      } catch (_) {
        return null;
      }
    };

    const orderShippingId = deriveShippingId();
    const items = cart.products.map((p) => {
      const product = p?.product || {};
      const originalPrice = Number(p.price_original || product.price || 0);
      const unit = Number(
        p.price_after_discount > 0 ? p.price_after_discount : originalPrice
      );
      const discountAmount = originalPrice - unit;

      // Lấy category_id từ cart item hoặc từ product data
      const categoryId = p.category_id || product.category_id || null;

      // Debug: log để kiểm tra category_id

      return {
        product_id: p.product_id,
        category_id: categoryId, // Lưu category_id của sản phẩm
        quantity: Number(p.quantity || 0),
        price: originalPrice,
        amount: unit * Number(p.quantity || 0),
        discount: discountAmount,
      };
    });

    const addr = addresses[selectedAddressIdx] || {};
    // gửi địa chỉ qua router riêng (nếu có)
    await sendAddressToServer(addr);

    // Tìm payment method được chọn để lấy _id hoặc slug
    const selectedPaymentMethod = paymentMethods.find(
      (m) => (m.slug || m._id) === paymentMethod
    );
    const paymentMethodValue = selectedPaymentMethod 
      ? (selectedPaymentMethod._id || selectedPaymentMethod.slug || paymentMethod)
      : paymentMethod; // Fallback nếu không tìm thấy

    const payload = {
      user_id: cart.user_id || null,
      cart_id: cart.cart_id || null,
      customer_id: selectedCustomerId,
      note,
      shipping_id:
        (shippingProvider && shippingProvider._id) || orderShippingId, // prefer selected provider
      shipping_method:
        (selectedProviderMethod && selectedProviderMethod.name) ||
        (shippingProvider && shippingProvider.name) ||
        shippingMethod,
      payment_method: paymentMethodValue, // Gửi _id hoặc slug của payment method
      products: items,
      summary: {
        subtotal,
        shipping_fee: shippingFee,
        total,
      },
    };
    // Nếu chọn MoMo, tạo liên kết thanh toán và hiển thị QR demo
    if (paymentMethod === "momo") {
      try {
        const momoRes = await fetch(
          `${API_BASE}/payment/momo/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: total,
              orderInfo: "Thanh toán đơn hàng HaruShop",
            }),
          }
        );
        const momoData = await momoRes.json();
        if (momoRes.ok && momoData.success && momoData.payUrl) {
          setMomoPayUrl(momoData.payUrl);
          setShowMomoModal(true);
        }
      } catch (_) {}
    }

    // Gửi order lên server để lưu vào database
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Order được tạo thành công
        addNotification("Đặt hàng thành công! Mã đơn hàng: ", "success");

        // Xóa giỏ hàng ở frontend (nếu cần)
        try {
          await fetch(`${API_BASE}/cart/clear`, {
            method: "DELETE",
            credentials: "include",
          });
        } catch (clearError) {
        }

        // Dispatch event để cập nhật order count trong header
        window.dispatchEvent(new CustomEvent("orderUpdated"));

        // Redirect về trang orders
        window.location.href = "/orders";
      } else {
        throw new Error(data.message || "Lỗi khi tạo đơn hàng");
      }
    } catch (error) {
    addNotification("Vui lòng chọn địa chỉ giao hàng", "danger");
      // addNotification("Lỗi khi đặt hàng: ", "danger");
    } finally {
      setLoading(false);
    }
  };
  const handleEditAddress = (addr) => {
    setEditForm({
      _id: addr._id,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
    });
    setShowEditModal(true);
  };

  const handleSaveEditAddress = async () => {
    try {
      const { _id, name, phone, address } = editForm;
      if (!_id || !name || !phone || !address) return;
      // Client-side duplicate phone check (exclude the same record)
      const isDup = addresses.some(
        (a) => a._id !== _id && String(a.phone).trim() === String(phone).trim()
      );
      if (isDup) {
        addNotification(
          "Số điện thoại đã tồn tại. Vui lòng dùng số khác.",
          "danger"
        );
        return;
      }
      const res = await fetch(`${API_BASE}/customer/edit/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: name, phone, address }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Sửa địa chỉ thất bại");

      // update local list
      setAddresses((prev) =>
        prev.map((a) => (a._id === _id ? { ...a, name, phone, address } : a))
      );
      // also reflect selected address if currently selected item belongs to this id
      setShowEditModal(false);
      addNotification("Cập nhật địa chỉ thành công", "success");
    } catch (error) {
      console.error("Edit address error:", error);
      addNotification("Sửa địa chỉ thất bại", "danger");
    }
  };

  return (
    <Container className="my-4">
      <h4 className="mb-3">Đặt hàng</h4>

      {loading && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <Spinner size="sm" animation="border" />
          <span>Đang tải giỏ hàng...</span>
        </div>
      )}
      {error && (
        <Alert variant="danger" className="mb-3 d-flex justify-content-between align-items-center">
          <span>{error}</span>
          {String(error).toLowerCase().includes("đăng nhập") && (
            <Button size="sm" onClick={() => (window.location.href = "/login")}>Đăng nhập</Button>
          )}
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="danger">Địa chỉ nhận hàng</Badge>
              <div className="fw-semibold">
                {addresses[selectedAddressIdx]?.name || "Người nhận"} •{" "}
                {addresses[selectedAddressIdx]?.phone || ""}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => setShowAddressEditor((s) => !s)}
            >
              {showAddressEditor ? "Xong" : "Thay đổi"}
            </Button>
          </div>
          <div className="text-muted small mb-2">
            {addresses[selectedAddressIdx]?.address || "Chưa có địa chỉ"}
          </div>

              {showAddressEditor && (
            <div className="mt-2">
              {addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-start justify-content-between border rounded p-2 mb-2"
                >
                  <Form.Check
                    type="radio"
                    name="addr"
                    id={`addr-${idx}`}
                    className="me-2 mt-1"
                    checked={selectedAddressIdx === idx}
                    onChange={() => {
                      setSelectedAddressIdx(idx);
                      setSelectedCustomerId(addr.customer_id);
                    }}
                    label={
                      <div>
                        <div className="fw-semibold">
                          {addr.name} • {addr.phone}
                        </div>
                        <div className="text-muted small">{addr.address}</div>
                      </div>
                    }
                  />
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleEditAddress(addr)}
                    >
                      Sửa
                    </Button>
                    {/* Luôn hiển thị nút xóa */}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={async () => {
                        if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
                        try {
                          const res = await fetch(`${API_BASE}/customer/delete/${addr._id}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            throw new Error(data.message || "Xóa địa chỉ thất bại");
                          }
                          // Cập nhật danh sách địa chỉ
                          const newAddresses = addresses.filter((a) => a._id !== addr._id);
                          setAddresses(newAddresses);
                          // Điều chỉnh selectedAddressIdx nếu cần
                          if (selectedAddressIdx >= newAddresses.length) {
                            setSelectedAddressIdx(Math.max(0, newAddresses.length - 1));
                          }
                          if (newAddresses.length > 0) {
                            setSelectedCustomerId(newAddresses[selectedAddressIdx >= newAddresses.length ? newAddresses.length - 1 : selectedAddressIdx]?.customer_id);
                          }
                          addNotification("Xóa địa chỉ thành công", "success");
                          // Reload danh sách từ server
                          listCustomer();
                        } catch (error) {
                          console.error("Delete address error:", error);
                          addNotification(error.message || "Xóa địa chỉ thất bại", "danger");
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}

              {!showAddForm && (
                <div className="d-flex justify-content-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      // Kiểm tra số lượng địa chỉ trước khi cho phép thêm
                      if (addresses.length >= 5) {
                        addNotification(
                          "Bạn đã có tối đa 5 địa chỉ. Vui lòng xóa một địa chỉ hoặc thay đổi địa chỉ hiện có.",
                          "warning"
                        );
                        return;
                      }
                      setShowAddForm(true);
                    }}
                    disabled={addresses.length >= 5}
                  >
                    Thêm địa chỉ {addresses.length >= 5 && "(Đã đạt tối đa)"}
                  </Button>
                </div>
              )}

              {showAddForm && (
                <div className="border-top pt-3 mt-2">
                  <div className="fw-semibold mb-2">Thêm địa chỉ mới</div>
                  <div className="d-grid gap-2">
                    <Form.Control
                      placeholder="Họ tên người nhận"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                    />
                    <Form.Control
                      placeholder="Số điện thoại"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                    />
                    <Form.Control
                      placeholder="Địa chỉ cụ thể"
                      value={newAddress.address}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          address: e.target.value,
                        })
                      }
                    />
                    <div className="d-flex gap-2">
                      <Button
                        onClick={async () => {
                          if (
                            !newAddress.name ||
                            !newAddress.phone ||
                            !newAddress.address
                          )
                            return;
                          
                          // Kiểm tra số lượng địa chỉ trước khi thêm
                          if (addresses.length >= 5) {
                            addNotification(
                              "Bạn đã có tối đa 5 địa chỉ. Vui lòng xóa một địa chỉ hoặc thay đổi địa chỉ hiện có.",
                              "warning"
                            );
                            return;
                          }

                          // Client-side duplicate phone check
                          const isDup = addresses.some(
                            (a) =>
                              String(a.phone).trim() ===
                              String(newAddress.phone).trim()
                          );
                          if (isDup) {
                            addNotification(
                              "Số điện thoại đã tồn tại. Vui lòng dùng số khác.",
                              "danger"
                            );
                            return;
                          }
                          
                          try {
                            await sendAddressToServer(newAddress);
                            // Reload danh sách từ server để đảm bảo đồng bộ
                            await listCustomer();
                            setNewAddress({ name: "", phone: "", address: "" });
                            setShowAddForm(false);
                            addNotification("Thêm địa chỉ thành công", "success");
                          } catch (error) {
                            // Nếu server trả về lỗi về số lượng, hiển thị thông báo
                            if (error.message && error.message.includes("tối đa")) {
                              addNotification(
                                "Bạn đã có tối đa 5 địa chỉ. Vui lòng xóa một địa chỉ hoặc thay đổi địa chỉ hiện có.",
                                "warning"
                              );
                            } else {
                              addNotification(error.message || "Thêm địa chỉ thất bại", "danger");
                            }
                          }
                        }}
                      >
                        Lưu địa chỉ
                      </Button>
                      <Button
                        variant="light"
                        onClick={() => setShowAddForm(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Header className="bg-white">
              <Row className="text-muted fw-semibold">
                <Col md={6}>Sản phẩm</Col>
                <Col md={2} className="text-center">
                  Đơn giá
                </Col>
                <Col md={2} className="text-center">
                  Số lượng
                </Col>
                <Col md={2} className="text-end">
                  Thành tiền
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {cart.products.length === 0 && (
                <div className="text-muted">Giỏ hàng trống.</div>
              )}
              {cart.products.map((it, idx) => {
                const product = it?.product || {};
                const unit = Number(
                  it.price_after_discount > 0
                    ? it.price_after_discount
                    : it.price_original || product.price || 0
                );
                const amount = unit * Number(it.quantity || 0);
                const img = product.thumbnail
                  ? `${API_BASE}/uploads/products/${
                      product.slug ? "accessory" : "foods"
                    }/${product.thumbnail}`
                  : `${API_BASE}/${product.image || ""}`;
                return (
                  <Row
                    key={`${it.product_id}-${idx}`}
                    className="align-items-center py-3 border-bottom gx-3"
                  >
                    <Col md={6} className="d-flex align-items-center gap-3">
                      <img
                        src={img}
                        alt={product.name || "product"}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      <div className="fw-semibold">
                        {product.name || "Sản phẩm"}
                      </div>
                    </Col>
                    <Col md={2} className="text-center text-muted">
                      {unit.toLocaleString("vi-VN")}₫
                    </Col>
                    <Col md={2} className="text-center">
                      {it.quantity}
                    </Col>
                    <Col md={2} className="text-end fw-semibold">
                      {amount.toLocaleString("vi-VN")}₫
                    </Col>
                  </Row>
                );
              })}

              <Row className="pt-3">
                <Col md={6} className="mb-2">
                  <Form.Control
                    placeholder="Lời nhắn cho Người bán..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Col>
                <Col
                  md={6}
                  className="d-flex justify-content-end align-items-center gap-3 flex-wrap"
                >
                  {shippingProvider && (
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      {Array.isArray(shippingProviders) && shippingProviders.length > 0 ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="text-muted small">Đơn vị:</div>
                          <Form.Select
                            size="sm"
                            style={{ width: 220 }}
                            value={normalizeId(shippingProvider._id) || ""}
                            onChange={(e) => {
                              const sel = shippingProviders.find(
                                (x) => normalizeId(x._id) === e.target.value
                              );
                              if (sel) {
                                setShippingProvider(sel);
                                if (Array.isArray(sel.methods) && sel.methods.length > 0) {
                                  setSelectedProviderMethod(sel.methods[0]);
                                  setShippingMethod(sel.methods[0].name);
                                } else {
                                  setSelectedProviderMethod(null);
                                  setShippingMethod(sel.name || "");
                                }
                              }
                            }}
                          >
                            {shippingProviders.map((p) => (
                              <option key={normalizeId(p._id) || p.name} value={normalizeId(p._id) || ""}>
                                {p.name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <div className="text-muted small">Đơn vị:</div>
                          <div className="fw-semibold">{shippingProvider.name}</div>
                        </div>
                      )}
                      {Array.isArray(shippingProvider.methods) &&
                      shippingProvider.methods.length > 0 ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="text-muted small">Phương thức:</div>
                          <Form.Select
                            size="sm"
                            style={{ width: 260 }}
                            value={selectedProviderMethod?.name || ""}
                            onChange={(e) => {
                              const m = shippingProvider.methods.find(
                                (x) => x.name === e.target.value
                              );
                              setSelectedProviderMethod(m || null);
                              setShippingMethod(
                                (m && m.name) || shippingProvider.name
                              );
                            }}
                          >
                            {shippingProvider.methods.map((m, idx) => (
                              <option key={idx} value={m.name}>
                                {m.name} -{" "}
                                {Number(m.price || 0).toLocaleString("vi-VN")}₫
                                {m.estimated_time
                                  ? ` • ${m.estimated_time}`
                                  : ""}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <div className="text-muted small">Phí:</div>
                          <div className="fw-semibold">
                            {Number(shippingProvider.price || 0).toLocaleString(
                              "vi-VN"
                            )}
                            ₫
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
          {/* Đã bỏ các phần: Voucher của Shop, Shopee Voucher, Shopee Xu */}
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header className="bg-white fw-semibold">
              Phương thức thanh toán
            </Card.Header>
            <Card.Body>
              {shippingProvider && (
                <div className="mb-3">
                  <div className="text-muted mb-1">Phương thức vận chuyển</div>
                  {/* Provider selector */}
                  {Array.isArray(shippingProviders) && shippingProviders.length > 0 && (
                    <div className="mb-2">
                      <Form.Select
                        value={normalizeId(shippingProvider._id) || ""}
                        onChange={(e) => {
                          const sel = shippingProviders.find(
                            (x) => normalizeId(x._id) === e.target.value
                          );
                          if (sel) {
                            setShippingProvider(sel);
                            if (Array.isArray(sel.methods) && sel.methods.length > 0) {
                              setSelectedProviderMethod(sel.methods[0]);
                              setShippingMethod(sel.methods[0].name);
                            } else {
                              setSelectedProviderMethod(null);
                              setShippingMethod(sel.name || "");
                            }
                          }
                        }}
                      >
                        {shippingProviders.map((p) => (
                          <option key={normalizeId(p._id) || p.name} value={normalizeId(p._id) || ""}>
                            {p.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                  {Array.isArray(shippingProvider.methods) &&
                  shippingProvider.methods.length > 0 ? (
                    <Form.Select
                      value={selectedProviderMethod?.name || ""}
                      onChange={(e) => {
                        const m = shippingProvider.methods.find(
                          (x) => x.name === e.target.value
                        );
                        setSelectedProviderMethod(m || null);
                        setShippingMethod(
                          (m && m.name) || shippingProvider.name
                        );
                      }}
                    >
                      {shippingProvider.methods.map((m, idx) => (
                        <option key={idx} value={m.name}>
                          {m.name} -{" "}
                          {Number(m.price || 0).toLocaleString("vi-VN")}₫
                          {m.estimated_time ? ` • ${m.estimated_time}` : ""}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="small">
                      {`${shippingProvider.name} - ${Number(
                        shippingProvider.price || 0
                      ).toLocaleString("vi-VN")}₫`}
                    </div>
                  )}
                </div>
              )}
              <div className="mb-3">
                <div className="text-muted mb-1">Chọn phương thức</div>
                <Form.Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.length === 0 && (
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                  )}
                  {paymentMethods.map((m) => {
                    const methodId = m.slug || m._id || "";
                    return (
                      <option key={methodId} value={methodId}>
                        {m.name}
                      </option>
                    );
                  })}
                </Form.Select>

                {/* Hiển thị mô tả và hình ảnh của phương thức được chọn */}
                {(() => {
                  const selected = paymentMethods.find(
                    (m) => (m.slug || m._id) === paymentMethod
                  );
                  if (!selected) return null;

                  return (
                    <>
                      {/* Hiển thị ảnh của phương thức thanh toán được chọn */}
                      {selected.image && (
                        <div className="mt-3 text-center">
                          <img
                            src={`${API_BASE}/uploads/paymetns/${selected.image}`}
                            alt={selected.name || "Phương thức thanh toán"}
                            style={{
                              width: "180px",
                              height: "auto",
                              objectFit: "contain",
                              maxHeight: "200px",
                            }}
                            className="img-fluid"
                            onError={(e) => {
                              console.error("Failed to load payment image:", selected.image);
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tổng tiền hàng</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              {savingsFromCart > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Giảm giá từ giỏ hàng</span>
                  <span>-{savingsFromCart.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tổng tiền vận chuyển</span>
                <span>{shippingFee.toLocaleString("vi-VN")}₫</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">Tổng thanh toán</div>
                <div className="h4 text-danger mb-0 fw-bold">
                  {total.toLocaleString("vi-VN")}₫
                </div>
              </div>
              <Button
                className="w-100 mt-3"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={!cart?.user_id}
              >
                Đặt hàng
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MoMo QR demo modal */}
      <Modal
        show={showMomoModal}
        onHide={() => setShowMomoModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thanh toán MoMo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-2">
              Quét QR trên app MoMo hoặc bấm Thanh toán để mở MoMo
            </div>
            {momoPayUrl && (
              <img
                alt="MoMo QR"
                style={{ width: 220, height: 220 }}
                src={`https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(
                  momoPayUrl
                )}`}
              />
            )}
            <div className="mt-3">
              <Button
                onClick={() => {
                  if (momoPayUrl) window.location.href = momoPayUrl;
                }}
              >
                Thanh toán
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Sửa địa chỉ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2">
            <Form.Control
              placeholder="Họ tên người nhận"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, name: e.target.value }))
              }
            />
            <Form.Control
              placeholder="Số điện thoại"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, phone: e.target.value }))
              }
            />
            <Form.Control
              placeholder="Địa chỉ cụ thể"
              value={editForm.address}
              onChange={(e) =>
                setEditForm((s) => ({ ...s, address: e.target.value }))
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveEditAddress}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CreateOrder;

// Modal chỉnh sửa địa chỉ
// Placed after export for file organization; JSX returned above renders Modal conditionally below
