import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Food() {
  const [categoryFood, setCategoryFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/category/food`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (res.ok) {
          // Tạo cây: cha + các con
          const tree = [
            {
              ...data.parent,
              children: data.children || [],
            },
          ];
          setCategoryFoods(tree);
        } else {
          console.error('❌ API Error:', data.message);
        }
      } catch (err) {
        console.error('❌ Fetch foods error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  const handleCategoryClick = (categoryId, categoryName) => {
    // Điều hướng đến trang foods với categoryId
    navigate(`/foods?categoryId=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

  const renderCategory = (cat, level = 0) => (
    <div key={cat._id} className="mb-2">
      <div 
        className={`p-2 rounded border ${level === 0 ? 'bg-primary text-white' : 'bg-light'} ${level > 0 ? 'cursor-pointer' : ''}`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={level > 0 ? () => handleCategoryClick(cat._id, cat.name) : undefined}
        role={level > 0 ? "button" : undefined}
        tabIndex={level > 0 ? 0 : undefined}
        onKeyDown={level > 0 ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCategoryClick(cat._id, cat.name);
          }
        } : undefined}
      >
        <strong>{cat.name}</strong>
        {cat.description && (
          <small className="d-block text-muted">{cat.description}</small>
        )}
        {level > 0 && (
          <small className="d-block text-info">
            <i className="fas fa-mouse-pointer me-1"></i>
            Click để xem sản phẩm
          </small>
        )}
      </div>
      {cat.children && cat.children.length > 0 && (
        <div className="mt-2">
          {cat.children.map((child) => renderCategory(child, level + 1))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="text-center p-4">Đang tải danh mục...</div>;

  return (
    <div className="mb-4">
      <h4 className="mb-3">Danh mục đồ ăn</h4>
      {categoryFood.length === 0 ? (
        <div className="text-muted">Không có danh mục</div>
      ) : (
        categoryFood.map((cat) => renderCategory(cat))
      )}
    </div>
  );
}

export default Food;
