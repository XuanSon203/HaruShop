import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import FoodItem from "./FoodItem";

function Foods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");

  // Xác định tiêu đề và mô tả dựa trên category được chọn
  const title = categoryName ? `Đồ ăn cho ${categoryName}` : "Đồ ăn thú cưng";
  const description = categoryName 
    ? `Khám phá các loại thức ăn ${categoryName.toLowerCase()} dinh dưỡng và ngon miệng cho thú cưng của bạn`
    : "Khám phá các loại thức ăn dinh dưỡng và ngon miệng cho thú cưng của bạn";

  if (loading)
    return <div className="container my-5">Đang tải sản phẩm...</div>;
  if (error) return <div className="container my-5 text-danger">{error}</div>;

  return (
    <div className="container-fluid px-3 px-md-4 my-5">
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
          {title}
        </h2>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {description}
        </p>
      </div>
      
      <div className="row g-0">
        {/* Cột sản phẩm */}
        <div className="col-12">
          <div 
            className="p-3 p-md-4 rounded-3"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <FoodItem />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Foods;
