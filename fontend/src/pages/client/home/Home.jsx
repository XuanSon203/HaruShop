import { useEffect, useState } from "react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
import { BsCartPlus } from "react-icons/bs";
import Banner from "../../../components/common/Banner";
import { useNotification } from "../../../components/nofication/Nofication";
import ProductService from "../../../services/ProductService";
function Home() {
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [featuredAccessories, setFeaturedAccessories] = useState([]);
  const [allFeaturedProducts, setAllFeaturedProducts] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [popularAccessories, setPopularAccessories] = useState([]);
  const [allPopularProducts, setAllPopularProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productService = new ProductService();
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [
          featuredFoods,
          featuredAccessories,
          popularFoods,
          popularAccessories,
          newFoodsData,
          newAccessoriesData,
          services,
        ] = await Promise.all([
          productService.getFeaturedFoods(20), // Lấy nhiều hơn để có đủ lựa chọn
          productService.getFeaturedAccessories(20), // Lấy nhiều hơn để có đủ lựa chọn
          productService.getPopularFoods(20), // Lấy nhiều hơn để thay thế
          productService.getPopularAccessories(20), // Lấy nhiều hơn để thay thế
          // Lấy sản phẩm mới trực tiếp từ API - lấy nhiều hơn để có đủ sản phẩm mới
          fetch(`${API_BASE}/products/food?limit=50`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.foods) {
                return data.foods || [];
              }
              return [];
            })
            .catch((err) => {
              console.error('Error fetching new foods:', err);
              return [];
            }),
          fetch(`${API_BASE}/products/accessory?limit=50`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.accessories) {
                // Debug: log một vài items để xem cấu trúc
                return data.accessories || [];
              }
              return [];
            })
            .catch((err) => {
              console.error('Error fetching new accessories:', err);
              return [];
            }),
          productService.getPopularServices(4),
        ]);

        // Hàm kiểm tra còn hàng
        const isInStock = (p) => {
          const sold = Number(p?.sold ?? p?.sold_count ?? 0);
          const quantity = Number(p?.quantity ?? 0);
          return Math.max(0, quantity - sold) > 0;
        };

        // Format tất cả sản phẩm
        const allFeaturedProducts = [
          ...featuredFoods.map((p) => ({ ...productService.formatProduct(p), type: 'food' })),
          ...featuredAccessories.map((p) => ({ ...productService.formatProduct(p), type: 'accessory' }))
        ];

        // Lấy tất cả sản phẩm bán chạy để thay thế
        const allPopularProducts = [
          ...popularFoods.map((p) => ({ ...productService.formatProduct(p), type: 'food' })),
          ...popularAccessories.map((p) => ({ ...productService.formatProduct(p), type: 'accessory' }))
        ].sort((a, b) => {
          const soldDiff = (b.sold_count || 0) - (a.sold_count || 0);
          if (soldDiff !== 0) return soldDiff;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Lọc sản phẩm nổi bật: CHỈ lấy sản phẩm có is_featured/featured = true
        // Ưu tiên sản phẩm có sold_count > 0 và còn hàng
        let featuredWithSales = allFeaturedProducts
          .filter((p) => {
            const isFeatured = p.is_featured || p.featured;
            const hasSales = (p.sold_count || 0) > 0;
            return isFeatured && hasSales && isInStock(p);
          })
          .sort((a, b) => {
            const soldDiff = (b.sold_count || 0) - (a.sold_count || 0);
            if (soldDiff !== 0) return soldDiff;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        // Nếu thiếu, lấy thêm từ tất cả sản phẩm nổi bật (không yêu cầu sold_count)
        // NHƯNG vẫn phải có is_featured = true
        let finalFeaturedProducts = [...featuredWithSales];
        if (finalFeaturedProducts.length < 4) {
          const existingIds = new Set(finalFeaturedProducts.map(p => p._id));
          const additionalFeatured = allFeaturedProducts
            .filter((p) => {
              const isFeatured = p.is_featured || p.featured;
              return isFeatured && !existingIds.has(p._id) && isInStock(p);
            })
            .sort((a, b) => {
              const soldDiff = (b.sold_count || 0) - (a.sold_count || 0);
              if (soldDiff !== 0) return soldDiff;
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            })
            .slice(0, 4 - finalFeaturedProducts.length);
          finalFeaturedProducts = [...finalFeaturedProducts, ...additionalFeatured];
        }
        
        // Chỉ hiển thị tối đa 4 sản phẩm (hoặc số lượng có sẵn nếu ít hơn)
        // KHÔNG thay thế bằng sản phẩm không có is_featured
        finalFeaturedProducts = finalFeaturedProducts.slice(0, 4);

        setAllFeaturedProducts(finalFeaturedProducts);

        // Gộp tất cả sản phẩm bán chạy (foods + accessories) và lấy 4 sản phẩm tốt nhất
        // Ưu tiên sản phẩm còn hàng, nếu thiếu thì lấy thêm từ sản phẩm hết hàng
        const allPopularCombined = [
          ...popularFoods.map((p) => ({ ...productService.formatProduct(p), type: 'food' })),
          ...popularAccessories.map((p) => ({ ...productService.formatProduct(p), type: 'accessory' }))
        ]
          .filter((p) => (p.sold_count || 0) > 0) // Chỉ lấy sản phẩm đã bán được
          .sort((a, b) => {
            // Ưu tiên sản phẩm còn hàng
            const aInStock = isInStock(a);
            const bInStock = isInStock(b);
            if (aInStock !== bInStock) {
              return bInStock ? 1 : -1; // Còn hàng đứng trước
            }
            // Nếu cùng trạng thái tồn kho, sắp xếp theo sold_count
            const soldDiff = (b.sold_count || 0) - (a.sold_count || 0);
            if (soldDiff !== 0) return soldDiff;
            // Cuối cùng sắp xếp theo ngày tạo
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        // Lấy 4 sản phẩm đầu tiên (ưu tiên còn hàng, nhưng nếu thiếu sẽ lấy cả hết hàng)
        const finalPopularProducts = allPopularCombined.slice(0, 4);

        setAllPopularProducts(finalPopularProducts);

        // Lấy sản phẩm mới: CHỈ lấy sản phẩm có thuộc tính isNew/is_New = true
        // Sử dụng dữ liệu từ API call riêng để đảm bảo lấy đủ sản phẩm mới
        const newFoods = newFoodsData
          .map((p) => {
            const formatted = productService.formatProduct({ ...p, type: 'food' });
            // Kiểm tra isNew từ dữ liệu gốc trước khi format
            const originalIsNew = p.isNew || p.is_New || false;
            // Tạo imageUrl đúng với API_BASE động
            let imageUrl = formatted.imageUrl;
            if (p.thumbnail && !imageUrl) {
              imageUrl = `${API_BASE}/uploads/products/foods/${p.thumbnail}`;
            }
            return { 
              ...formatted, 
              type: 'food',
              // Ưu tiên dữ liệu gốc, sau đó mới đến formatted
              isNew: originalIsNew || formatted.isNew || false,
              is_New: originalIsNew || formatted.is_New || false,
              imageUrl: imageUrl || formatted.imageUrl
            };
          })
          .filter((p) => {
            // Kiểm tra cả isNew và is_New, chấp nhận giá trị truthy
            const isNew = p.isNew || p.is_New;
            const result = Boolean(isNew) && isInStock(p);
            return result;
          })
          .sort((a, b) => {
            // Sắp xếp theo createdAt mới nhất
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        const newAccessories = newAccessoriesData
          .map((p) => {
            const formatted = productService.formatProduct({ ...p, type: 'accessory' });
            // Kiểm tra isNew từ dữ liệu gốc - kiểm tra nhiều cách
            const originalIsNew = p.isNew === true || p.isNew === 'true' || p.isNew === 1 || 
                                  p.is_New === true || p.is_New === 'true' || p.is_New === 1 || false;
            // Tạo imageUrl đúng với API_BASE động
            let imageUrl = formatted.imageUrl;
            if (p.thumbnail && !imageUrl) {
              imageUrl = `${API_BASE}/uploads/products/accessory/${p.thumbnail}`;
            }
            return { 
              ...formatted, 
              type: 'accessory',
              // Ưu tiên dữ liệu gốc, sau đó mới đến formatted
              isNew: originalIsNew || formatted.isNew || false,
              is_New: originalIsNew || formatted.is_New || false,
              imageUrl: imageUrl || formatted.imageUrl,
              // Giữ lại dữ liệu gốc để debug
              _originalIsNew: p.isNew,
              _originalIs_New: p.is_New
            };
          })
          .filter((p) => {
            // Kiểm tra cả isNew và is_New, chấp nhận giá trị truthy
            const isNew = p.isNew || p.is_New;
            const result = Boolean(isNew) && isInStock(p);
            // Debug log để kiểm tra
            return result;
          })
          .sort((a, b) => {
            // Sắp xếp theo createdAt mới nhất
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        // Xen kẽ foods và accessories: food, accessory, food, accessory (so le nhau)
        // Mục tiêu: 2 foods và 2 accessories xen kẽ
        const finalNewProducts = [];
        let foodIndex = 0;
        let accessoryIndex = 0;
        
        // Xen kẽ: food, accessory, food, accessory
        for (let i = 0; i < 4; i++) {
          if (i % 2 === 0) {
            // Vị trí chẵn (0, 2): lấy food
            if (foodIndex < newFoods.length) {
              finalNewProducts.push(newFoods[foodIndex]);
              foodIndex++;
            } else if (accessoryIndex < newAccessories.length) {
              // Nếu hết foods, lấy thêm accessories
              finalNewProducts.push(newAccessories[accessoryIndex]);
              accessoryIndex++;
            }
          } else {
            // Vị trí lẻ (1, 3): lấy accessory
            if (accessoryIndex < newAccessories.length) {
              finalNewProducts.push(newAccessories[accessoryIndex]);
              accessoryIndex++;
            } else if (foodIndex < newFoods.length) {
              // Nếu hết accessories, lấy thêm foods
              finalNewProducts.push(newFoods[foodIndex]);
              foodIndex++;
            }
          }
        }


        setNewProducts(finalNewProducts.slice(0, 4));
        setFeaturedServices(
          services.map((s) => productService.formatProduct(s))
        );
      } catch (e) {
        console.error("Fetch products error:", e);
        const errorMessage = e?.message || e?.toString() || "Không thể tải dữ liệu sản phẩm";
        setError(errorMessage);
        // Chỉ hiển thị notification nếu addNotification có sẵn
        try {
          addNotification("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.", "error");
        } catch (notifError) {
          console.error("Notification error:", notifError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [addNotification]);
  const getTypeInfo = (type) => {
    switch (type) {
      case "food":
        return { icon: "🍽️", label: "Đồ ăn", color: "#10b981" };
      case "accessory":
        return { icon: "🎾", label: "Phụ kiện", color: "#f59e0b" };
      default:
        return { icon: "📦", label: "Sản phẩm", color: "#6b7280" };
    }
  };

  const getDetailHref = (product) => {
    if (product.type === "food") return `/foods/${product._id}`;
    if (product.type === "accessory")
      return `/accessories/${product.slug || product._id}`;
    if (product.type === "service")
      return `/services/${product.slug || product._id}`;
    return "#";
  };

  const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN")}₫`;

  const getPricingInfo = (product) => {
    const basePrice = Number(product?.original_price ?? product?.price ?? 0);
    let finalPrice = Number(product?.final_price ?? product?.price ?? 0);
    let discountPercent = Number(product?.discount_percent ?? 0);
    let discountLabel = product?.discount_label || "";
    let hasDiscount = Boolean(product?.has_discount) || finalPrice < basePrice;
    const discount = product?.discount_id;

    if (!hasDiscount && discount && discount.status === "active") {
      const discountValue = Number(discount.value || 0);
      if (discount.type === "percent") {
        discountPercent = discountValue;
        finalPrice = Math.max(0, basePrice * (1 - discountValue / 100));
      } else if (discount.type === "amount") {
        finalPrice = Math.max(0, basePrice - discountValue);
        discountPercent =
          basePrice > 0 ? Math.round((discountValue / basePrice) * 100) : 0;
      }
      hasDiscount = finalPrice < basePrice;
    }

    if (!discountLabel && discountPercent > 0) {
      discountLabel = `-${discountPercent}%`;
    }

    return {
      hasDiscount,
      displayOriginalPrice: hasDiscount ? product?.formattedOriginalPrice || formatCurrency(basePrice) : "",
      displayFinalPrice: product?.formattedPrice || formatCurrency(finalPrice),
      discountBadgeText: discountLabel,
    };
  };

  const getStockInfo = (item) => {
    const sold = Number(item?.sold ?? item?.sold_count ?? 0);
    const quantity = Number(item?.quantity ?? 0);
    const remainingStock = Math.max(0, quantity - sold);
    return {
      sold,
      quantity,
      remainingStock,
      isOutOfStock: remainingStock <= 0,
    };
  };

  // Hàm kiểm tra còn hàng (dùng trong filter)
  const isInStock = (p) => {
    const sold = Number(p?.sold ?? p?.sold_count ?? 0);
    const quantity = Number(p?.quantity ?? 0);
    return Math.max(0, quantity - sold) > 0;
  };

const renderOutOfStockOverlay = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, rgba(15,23,42,0.65), rgba(15,23,42,0.8))",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 700,
      fontSize: "1rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      gap: "0.35rem",
      zIndex: 10,
      pointerEvents: "auto",
      cursor: "not-allowed",
    }}
  >
    <span role="img" aria-label="out-of-stock" style={{ fontSize: "1.8rem" }}>
      🚫
    </span>
    <span>Hết hàng</span>
  </div>
);

  const handleAddToCart = async (item) => {
  try {
    const { remainingStock } = getStockInfo(item);

    // Kiểm tra tồn kho
    if (remainingStock <= 0) {
      addNotification("Sản phẩm đã hết hàng", "warning");
      return;
    }

    // ✅ Tính giá sau giảm giá
    const basePrice = Number(item.price || 0);
    let finalPrice = basePrice;
    let discountPercent = 0;

    if (
      item.discount_id &&
      item.discount_id.value &&
      item.discount_id.status === "active"
    ) {
      const discountValue = item.discount_id.value;
      const discountType = item.discount_id.type;

      if (discountType === "percent") {
        finalPrice = basePrice * (1 - discountValue / 100);
        discountPercent = discountValue;
      } else if (discountType === "amount") {
        finalPrice = Math.max(0, basePrice - discountValue);
        discountPercent = (discountValue / basePrice) * 100;
      }
    }

    const response = await fetch(`${API_BASE}/cart/addCart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        product_id: item._id,
        quantity: 1,
        category_id: item.category_id,
        applied_discount:
          item.discount_id &&
          item.discount_id.value &&
          item.discount_id.status === "active"
            ? true
            : false,
        discount_percent: discountPercent,
        price_after_discount: finalPrice,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      addNotification(
        "Lỗi: " + (data.message || "Không thể thêm sản phẩm vào giỏ hàng"),
        "danger"
      );
      return;
    }

    addNotification("Đã thêm sản phẩm vào giỏ hàng thành công!", "success");

    // Trigger cart update event for Header
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  } catch (error) {
    console.error("Add to cart error:", error);
    addNotification("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng", "error");
  }
};

  // Hiển thị loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error state
  if (error) {
    return (
      <div className="container mt-5 px-3">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Lỗi tải dữ liệu!</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Vui lòng kiểm tra kết nối mạng và thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Banner />
      <div className="container-fluid px-3 px-md-4 mt-3 mt-md-5">
        <div className="text-center mb-4 mb-md-5">
          <h2
            className="fw-bold mb-2 mb-md-3"
            style={{
              color: "#0ea5e9",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            }}
          >
            Các sản phẩm nổi bật
          </h2>
          <p
            className="text-muted"
            style={{ 
              maxWidth: "600px", 
              margin: "0 auto",
              fontSize: "clamp(0.875rem, 3vw, 1.25rem)",
              padding: "0 10px"
            }}
          >
            Khám phá những sản phẩm tốt nhất và được yêu thích nhất cho thú cưng
            của bạn
          </p>
        </div>
        <div
          className="p-3 p-md-4 rounded-3"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Row className="g-3 g-md-4">
            {allFeaturedProducts.length > 0 ? (
              allFeaturedProducts.map((product, idx) => {
                const typeInfo = getTypeInfo(product.type);
                const { isOutOfStock } = getStockInfo(product);
                const {
                  hasDiscount,
                  displayOriginalPrice,
                  displayFinalPrice,
                  discountBadgeText,
                } = getPricingInfo(product);
                return (
                  <Col
                    key={`featured-${product._id}-${idx}`}
                    md={3}
                    sm={6}
                    xs={12}
                    className="mb-2 mb-md-3"
                  >
                    <Card
                      className="h-100 border-0"
                      style={{
                        background:
                          "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                        boxShadow:
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        borderRadius: "20px",
                        border: "1px solid #e5e7eb",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        cursor: isOutOfStock ? "not-allowed" : "default",
                        opacity: isOutOfStock ? 0.7 : 1,
                        pointerEvents: isOutOfStock ? "none" : "auto",
                      }}
                      onMouseEnter={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform =
                          "translateY(-8px) scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.borderColor = "#f2760a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        }
                      }}
                    >
                      <div
                        className="position-relative"
                        style={{ paddingTop: "80%" }}
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition: "transform 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center"
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                            }}
                          >
                            <span style={{ fontSize: 48 }}>
                              {typeInfo.icon}
                            </span>
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%)",
                            transition: "all 0.3s ease",
                          }}
                        />

                        {/* Badge nổi bật - bên trái */}
                        {(product.is_featured || product.featured) && (
                        <Badge
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            border: "2px solid white",
                              fontSize: "0.7rem",
                            fontWeight: "700",
                              padding: "0.4rem 0.6rem",
                            borderRadius: "50px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 5,
                          }}
                        >
                            Nổi bật
                        </Badge>
                        )}
                        {/* Badge giảm giá - góc phải */}
                        {hasDiscount && discountBadgeText && (
                          <Badge
                            style={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              border: "2px solid white",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "50px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 5,
                            }}
                          >
                            {discountBadgeText}
                          </Badge>
                        )}
                        {/* Badge danh mục - xuống dưới */}
                        <Badge
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}dd 100%)`,
                            border: "2px solid white",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "50px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 5,
                          }}
                        >
                          {typeInfo.label}
                        </Badge>
                        {isOutOfStock && (
                          <div style={{ position: "relative", zIndex: 11 }}>
                            {renderOutOfStockOverlay()}
                          </div>
                        )}
                      </div>

                      <Card.Body className="p-3" style={{ position: "relative", zIndex: isOutOfStock ? 1 : "auto" }}>
                        {isOutOfStock ? (
                          <h6
                            className="fw-bold mb-2"
                            style={{
                              color: "#1f2937",
                              fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                              lineHeight: "1.3",
                              cursor: "not-allowed",
                            }}
                          >
                            {product.name}
                          </h6>
                        ) : (
                        <a
                          href={getDetailHref(product)}
                          className="text-decoration-none"
                        >
                          <h6
                              className="fw-bold mb-2"
                            style={{
                              color: "#1f2937",
                                fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                              lineHeight: "1.3",
                            }}
                          >
                            {product.name}
                          </h6>
                        </a>
                        )}

                        <div className="d-flex align-items-center mb-2">
                          <span className="text-warning me-2">
                            {product.formattedRating}
                          </span>
                        </div>

                        {/* Giá và số lượt bán - cùng một dòng */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div>
                          {hasDiscount ? (
                            /* Giá có giảm giá */
                            <div>
                              <div
                                  className="text-decoration-line-through text-muted small mb-0"
                                  style={{ fontSize: "0.8rem" }}
                              >
                                {displayOriginalPrice}
                              </div>
                                <div
                                  className="fw-bold"
                                  style={{
                                    color: "#1f2937",
                                    fontSize: "1.1rem",
                                    background:
                                      "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                  }}
                                >
                                  {displayFinalPrice}
                              </div>
                            </div>
                          ) : (
                            /* Giá thường (không có giảm giá) */
                            <div
                                className="fw-bold"
                              style={{
                                color: "#1f2937",
                                  fontSize: "1.1rem",
                                background:
                                  "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                              }}
                            >
                              {displayFinalPrice}
                              </div>
                            )}
                          </div>
                          {/* Số lượt bán */}
                          {product.sold_count > 0 && (
                            <div className="text-muted small text-end">
                              <div style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                                Đã bán
                              </div>
                              <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                                {product.sold_count.toLocaleString("vi-VN")}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                          style={{
                            background: isOutOfStock
                              ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                              : "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "0.65rem 1rem",
                            fontSize: "clamp(0.875rem, 3vw, 1rem)",
                            boxShadow: isOutOfStock
                              ? "none"
                              : "0 4px 14px 0 rgba(14, 165, 233, 0.4)",
                            transition: "all 0.3s ease",
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            opacity: isOutOfStock ? 0.8 : 1,
                          }}
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          onMouseEnter={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow =
                                "0 6px 20px 0 rgba(14, 165, 233, 0.5)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow =
                                "0 4px 14px 0 rgba(14, 165, 233, 0.4)";
                            }
                          }}
                        >
                          <span>
                            <BsCartPlus />
                          </span>
                          <span>
                            {isOutOfStock ? "Đã hết hàng" : "Thêm vào giỏ"}
                          </span>
                        </button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col xs={12} className="text-center py-5">
                <div className="text-muted">
                  <i
                    className="fas fa-star"
                    style={{ fontSize: "3rem", opacity: 0.3 }}
                  ></i>
                  <h5 className="mt-3">Chưa có sản phẩm nổi bật</h5>
                  <p>Hiện tại chưa có sản phẩm nào được đánh dấu là nổi bật.</p>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>
      {/* Services Section */}
      <div className="container-fluid px-3 px-md-4 mt-3 mt-md-5">
        <div className="text-center mb-4 mb-md-5">
          <h2
            className="fw-bold mb-2 mb-md-3"
            style={{
              color: "#0ea5e9",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            }}
          >
            Dịch vụ chăm sóc thú cưng
          </h2>
          <p
            className="text-muted"
            style={{ 
              maxWidth: "600px", 
              margin: "0 auto",
              fontSize: "clamp(0.875rem, 3vw, 1.25rem)",
              padding: "0 10px"
            }}
          >
            Các dịch vụ chuyên nghiệp để chăm sóc thú cưng của bạn
          </p>
        </div>
        <div
          className="p-3 p-md-4 rounded-3"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Row className="g-3 g-md-4">
            {featuredServices.map((service, idx) => {
              return (
                <Col
                  key={`service-${service._id}-${idx}`}
                  md={3}
                  sm={6}
                  xs={12}
                  className="mb-2 mb-md-3"
                >
                  <Card
                    className="h-100 border-0"
                    style={{
                      background:
                        "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      borderRadius: "20px",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-8px) scale(1.02)";
                      e.currentTarget.style.boxShadow =
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                      e.currentTarget.style.borderColor = "#f59e0b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div
                      className="position-relative"
                      style={{ paddingTop: "70%" }}
                    >
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                          }}
                        >
                          <span style={{ fontSize: 48 }}>🛠️</span>
                        </div>
                      )}

                      <Badge
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          background:
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          border: "2px solid white",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "50px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        Dịch vụ
                      </Badge>
                    </div>

                    <Card.Body className="p-3 p-md-4">
                      <h6
                        className="fw-bold mb-2 mb-md-3"
                        style={{
                          color: "#1f2937",
                          fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                          lineHeight: "1.4",
                        }}
                      >
                        {service.name}
                      </h6>

                      <div className="mb-3">
                        <div
                          className="fw-bold fs-5"
                          style={{
                            color: "#1f2937",
                            background:
                              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {Number(service.price || 0).toLocaleString("vi-VN")}₫
                        </div>
                      </div>

                      <a
                        href={`/services/${service.slug || service._id}`}
                        className="btn btn-warning btn-sm w-100 fw-semibold py-2 d-flex align-items-center justify-content-center gap-2 text-decoration-none"
                        style={{
                          background:
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 4px 14px 0 rgba(245, 158, 11, 0.4)",
                          transition: "all 0.3s ease",
                          color: "white",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 6px 20px 0 rgba(245, 158, 11, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 4px 14px 0 rgba(245, 158, 11, 0.4)";
                        }}
                      >
                        <span>Xem chi tiết</span>
                      </a>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>

      {/* All Featured Products Section */}

      {/* Sản phẩm bán chạy Section (Gộp Foods + Accessories) */}
      <div className="container-fluid px-3 px-md-4 mt-3 mt-md-5">
        <div className="text-center mb-4 mb-md-5">
          <h2
            className="fw-bold mb-2 mb-md-3"
            style={{
              color: "#1f2937",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sản phẩm bán chạy
          </h2>
          <p
            className="text-muted"
            style={{ 
              maxWidth: "600px", 
              margin: "0 auto",
              fontSize: "clamp(0.875rem, 3vw, 1.25rem)",
              padding: "0 10px"
            }}
          >
            Những sản phẩm được khách hàng yêu thích và mua nhiều nhất
          </p>
        </div>
        <div
          className="p-3 p-md-4 rounded-3"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Row className="g-3 g-md-4">
            {allPopularProducts.length > 0 ? (
              allPopularProducts.map((product, index) => {
                const typeInfo = getTypeInfo(product.type);
                const { isOutOfStock } = getStockInfo(product);
                const pricing = getPricingInfo(product);
                return (
                  <Col md={3} sm={6} xs={12} key={index} className="mb-2 mb-md-3">
                    <Card
                      className="h-100 border-0 shadow-sm"
                      style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: isOutOfStock ? "not-allowed" : "pointer",
                        background:
                          "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                        opacity: isOutOfStock ? 0.7 : 1,
                        pointerEvents: isOutOfStock ? "none" : "auto",
                      }}
                      onMouseEnter={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <Card.Img
                          variant="top"
                          src={product.imageUrl}
                          style={{
                            height: "200px",
                            objectFit: "cover",
                            background:
                              "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                          }}
                        />
                        {/* Badge Bán chạy - bên trái */}
                        <Badge
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            background:
                              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "white",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "50px",
                            border: "2px solid white",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 5,
                          }}
                        >
                          Bán chạy
                        </Badge>
                        {/* Badge giảm giá - góc phải */}
                        {pricing.hasDiscount && pricing.discountBadgeText && (
                        <Badge
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              border: "2px solid white",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "50px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 5,
                            }}
                          >
                            {pricing.discountBadgeText}
                          </Badge>
                        )}
                        {/* Badge danh mục - xuống dưới */}
                        <Badge
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "50px",
                            border: "2px solid white",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 5,
                          }}
                        >
                          {typeInfo.label}
                        </Badge>
                        {isOutOfStock && (
                          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}>
                            {renderOutOfStockOverlay()}
                      </div>
                        )}
                      </div>
                      <Card.Body className="p-3" style={{ position: "relative", zIndex: isOutOfStock ? 1 : "auto" }}>
                        {isOutOfStock ? (
                          <h6
                            className="fw-bold mb-2"
                            style={{ color: "#1f2937", fontSize: "1rem", cursor: "not-allowed", lineHeight: "1.3" }}
                          >
                            {product.name}
                          </h6>
                        ) : (
                        <a
                          href={getDetailHref(product)}
                          className="text-decoration-none"
                        >
                          <h6
                            className="fw-bold mb-2"
                            style={{ color: "#1f2937", fontSize: "1rem", lineHeight: "1.3" }}
                          >
                            {product.name}
                          </h6>
                        </a>
                        )}
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-warning me-2">
                            {product.formattedRating}
                          </span>
                        </div>
                        {/* Giá và số lượt bán - cùng một dòng */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div>
                          {pricing.hasDiscount ? (
                            <>
                                <div className="text-muted text-decoration-line-through small mb-0" style={{ fontSize: "0.8rem" }}>
                                {pricing.displayOriginalPrice}
                              </div>
                                <div
                                  className="fw-bold"
                                  style={{ color: "#1f2937", fontSize: "1.1rem" }}
                                >
                                  {pricing.displayFinalPrice}
                              </div>
                            </>
                          ) : (
                            <span
                                className="fw-bold"
                                style={{ color: "#1f2937", fontSize: "1.1rem" }}
                            >
                              {pricing.displayFinalPrice}
                            </span>
                            )}
                          </div>
                          {/* Số lượt bán */}
                          {product.sold_count > 0 && (
                            <div className="text-muted small text-end">
                              <div style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                                Đã bán
                              </div>
                              <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                                {product.sold_count.toLocaleString("vi-VN")}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          className="w-100"
                          style={{
                            background: isOutOfStock
                              ? "linear-gradient(135deg, #94a3b8 0%, #475569 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            boxShadow: isOutOfStock
                              ? "none"
                              : "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                            transition: "all 0.3s ease",
                            opacity: isOutOfStock ? 0.8 : 1,
                          }}
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          onMouseEnter={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow =
                                "0 8px 15px -3px rgba(59, 130, 246, 0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow =
                                "0 4px 6px -1px rgba(59, 130, 246, 0.3)";
                            }
                          }}
                        >
                          <BsCartPlus />{" "}
                          <span>{isOutOfStock ? "Đã hết hàng" : "Thêm vào giỏ"}</span>
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col xs={12} className="text-center py-5">
                <div className="text-muted">
                  <i
                    className="fas fa-fire"
                    style={{ fontSize: "3rem", opacity: 0.3 }}
                  ></i>
                  <h5 className="mt-3">Chưa có sản phẩm bán chạy</h5>
                  <p>Hiện tại chưa có sản phẩm nào được bán ra.</p>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>

      {/* Sản phẩm mới Section */}
      <div className="container-fluid px-3 px-md-4 mt-3 mt-md-5">
        <div className="text-center mb-4 mb-md-5">
          <h2
            className="fw-bold mb-2 mb-md-3"
            style={{
              color: "#1f2937",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sản phẩm mới
          </h2>
          <p
            className="text-muted"
            style={{ 
              maxWidth: "600px", 
              margin: "0 auto",
              fontSize: "clamp(0.875rem, 3vw, 1.25rem)",
              padding: "0 10px"
            }}
          >
            Những sản phẩm mới nhất được thêm vào cửa hàng
          </p>
        </div>
        <div
          className="p-3 p-md-4 rounded-3"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Row className="g-3 g-md-4">
            {newProducts.length > 0 ? (
              newProducts.map((product, index) => {
                const typeInfo = getTypeInfo(product.type);
                const { isOutOfStock } = getStockInfo(product);
                const pricing = getPricingInfo(product);
                return (
                  <Col md={3} sm={6} xs={12} key={index} className="mb-2 mb-md-3">
                    <Card
                      className="h-100 border-0 shadow-sm"
                      style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: isOutOfStock ? "not-allowed" : "pointer",
                        background:
                          "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                        opacity: isOutOfStock ? 0.7 : 1,
                        pointerEvents: isOutOfStock ? "none" : "auto",
                      }}
                      onMouseEnter={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOutOfStock) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <Card.Img
                          variant="top"
                          src={product.imageUrl}
                          style={{
                            height: "200px",
                            objectFit: "cover",
                            background:
                              "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                          }}
                        />
                        {/* Badge Mới - bên trái */}
                        <Badge
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "50px",
                            border: "2px solid white",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 5,
                          }}
                        >
                          ✨ Mới
                        </Badge>
                        {/* Badge giảm giá - góc phải */}
                        {pricing.hasDiscount && pricing.discountBadgeText && (
                        <Badge
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              border: "2px solid white",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "50px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              zIndex: 5,
                            }}
                          >
                            {pricing.discountBadgeText}
                          </Badge>
                        )}
                        {/* Badge danh mục - xuống dưới */}
                        <Badge
                          style={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}dd 100%)`,
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "50px",
                            border: "2px solid white",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            zIndex: 5,
                          }}
                        >
                          {typeInfo.label}
                        </Badge>
                        {isOutOfStock && (
                          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}>
                            {renderOutOfStockOverlay()}
                      </div>
                        )}
                      </div>
                      <Card.Body className="p-3" style={{ position: "relative", zIndex: isOutOfStock ? 1 : "auto" }}>
                        {isOutOfStock ? (
                          <h6
                            className="fw-bold mb-2"
                            style={{ color: "#1f2937", fontSize: "1rem", cursor: "not-allowed", lineHeight: "1.3" }}
                          >
                            {product.name}
                          </h6>
                        ) : (
                        <a
                          href={getDetailHref(product)}
                          className="text-decoration-none"
                        >
                          <h6
                            className="fw-bold mb-2"
                            style={{ color: "#1f2937", fontSize: "1rem", lineHeight: "1.3" }}
                          >
                            {product.name}
                          </h6>
                        </a>
                        )}
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-warning me-2">
                            {product.formattedRating}
                          </span>
                        </div>
                        {/* Giá và số lượt bán - cùng một dòng */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div>
                          {pricing.hasDiscount ? (
                            <>
                                <div className="text-muted text-decoration-line-through small mb-0" style={{ fontSize: "0.8rem" }}>
                                {pricing.displayOriginalPrice}
                              </div>
                                <div
                                  className="fw-bold"
                                  style={{ color: "#1f2937", fontSize: "1.1rem" }}
                                >
                                  {pricing.displayFinalPrice}
                              </div>
                            </>
                          ) : (
                            <span
                                className="fw-bold"
                                style={{ color: "#1f2937", fontSize: "1.1rem" }}
                            >
                              {pricing.displayFinalPrice}
                            </span>
                            )}
                          </div>
                          {/* Số lượt bán */}
                          {product.sold_count > 0 && (
                            <div className="text-muted small text-end">
                              <div style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                                Đã bán
                              </div>
                              <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#10b981" }}>
                                {product.sold_count.toLocaleString("vi-VN")}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          className="w-100"
                          style={{
                            background: isOutOfStock
                              ? "linear-gradient(135deg, #94a3b8 0%, #475569 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            boxShadow: isOutOfStock
                              ? "none"
                              : "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                            transition: "all 0.3s ease",
                            opacity: isOutOfStock ? 0.8 : 1,
                          }}
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          onMouseEnter={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow =
                                "0 8px 15px -3px rgba(59, 130, 246, 0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isOutOfStock) {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow =
                                "0 4px 6px -1px rgba(59, 130, 246, 0.3)";
                            }
                          }}
                        >
                          <BsCartPlus />{" "}
                          <span>{isOutOfStock ? "Đã hết hàng" : "Thêm vào giỏ"}</span>
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col xs={12} className="text-center py-5">
                <div className="text-muted">
                  <i
                    className="fas fa-star"
                    style={{ fontSize: "3rem", opacity: 0.3 }}
                  ></i>
                  <h5 className="mt-3">Chưa có sản phẩm mới</h5>
                  <p>Hiện tại chưa có sản phẩm mới nào được thêm vào.</p>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>

      {/* About section */}
      <div className="container-fluid px-3 px-md-4 mt-5">
        <div
          className="p-4 p-md-5 rounded-3"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          }}
        >
          <div className="row align-items-center g-4">
            <div className="col-md-7">
              <h2 className="fw-bold" style={{ color: "#0f172a" }}>
                Về HaruShop
              </h2>
              <p className="text-muted mb-3" style={{ fontSize: 16 }}>
                HaruShop là điểm đến cho người yêu thú cưng: từ thức ăn dinh
                dưỡng, phụ kiện chất lượng đến dịch vụ chăm sóc tận tâm. Chúng
                tôi cam kết mang đến trải nghiệm mua sắm vui vẻ, nhanh chóng và
                đáng tin cậy cho bạn và thú cưng.
              </p>
              <ul className="text-muted m-0" style={{ fontSize: 15 }}>
                <li>Sản phẩm chính hãng, giá hợp lý</li>
                <li>Tư vấn tận tình, gợi ý theo nhu cầu</li>
                <li>Giao hàng nhanh, hỗ trợ sau bán</li>
              </ul>
            </div>
            <div className="col-md-5">
              <div
                className="rounded-3"
                style={{ background: "#fff", border: "1px solid #e5e7eb" }}
              >
                <div className="p-3 d-flex align-items-center gap-3">
                  <div style={{ fontSize: 36 }}>🐾</div>
                  <div>
                    <div className="fw-bold">5000+ khách hàng tin tưởng</div>
                    <div className="text-muted small">
                      Cộng đồng HaruShop ngày một lớn mạnh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-5 mb-4">
        <h2
          className="fw-bold"
          style={{
            color: "#1f2937",
            fontSize: "2rem",
          }}
        >
          Cảm ơn bạn đã tin tưởng HaruShop!
        </h2>
        <p className="text-muted mt-3">
          Chúng tôi luôn cố gắng mang đến những sản phẩm và dịch vụ tốt nhất cho
          thú cưng của bạn.
        </p>
      </div>
    </div>
  );
}

export default Home;
