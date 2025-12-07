import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CategoryItem from './CategoryItem';

function Categroies() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/categories`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories) {
            // API mới đã trả về danh mục cha, không cần filter nữa
            setCategories(data.categories);
          }
        } else {
          console.error('Failed to fetch categories');
          // Fallback data nếu API không hoạt động
          setCategories([
            {
              _id: '3',
              name: 'Thức ăn',
              slug: 'thuc-an',
              image: 'https://images.unsplash.com/photo-1604908176997-431664c7e1d5?q=80&w=800&auto=format&fit=crop',
              itemsCount: 96,
              description: 'Hạt khô, pate, snack dinh dưỡng'
            },
            {
              _id: '4',
              name: 'Phụ kiện',
              slug: 'phu-kien',
              image: 'https://images.unsplash.com/photo-1601758064135-0c2f77f7d74a?q=80&w=800&auto=format&fit=crop',
              itemsCount: 78,
              description: 'Bát ăn, đồ chơi, balo, chuồng'
            },
            {
              _id: '5',
              name: 'Dịch vụ',
              slug: 'dich-vu',
              image: 'https://images.unsplash.com/photo-1601758064135-0c2f77f7d74a?q=80&w=800&auto=format&fit=crop',
              itemsCount: 45,
              description: 'Chăm sóc, tắm rửa, cắt tỉa lông'
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback data nếu có lỗi
        setCategories([
          {
            _id: '3',
            name: 'Thức ăn',
            slug: 'thuc-an',
            image: 'https://images.unsplash.com/photo-1604908176997-431664c7e1d5?q=80&w=800&auto=format&fit=crop',
            itemsCount: 96,
            description: 'Hạt khô, pate, snack dinh dưỡng'
          },
          {
            _id: '4',
            name: 'Phụ kiện',
            slug: 'phu-kien',
            image: 'https://images.unsplash.com/photo-1601758064135-0c2f77f7d74a?q=80&w=800&auto=format&fit=crop',
            itemsCount: 78,
            description: 'Bát ăn, đồ chơi, balo, chuồng'
          },
          {
            _id: '5',
            name: 'Dịch vụ',
            slug: 'dich-vu',
            image: 'https://images.unsplash.com/photo-1601758064135-0c2f77f7d74a?q=80&w=800&auto=format&fit=crop',
            itemsCount: 45,
            description: 'Chăm sóc, tắm rửa, cắt tỉa lông'
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSelect = (cat) => {
    // Chuyển hướng đến trang danh mục tương ứng
    const categoryName = cat.name?.toLowerCase();
    
    if (categoryName === 'đồ ăn' || categoryName === 'thức ăn' || categoryName === 'food') {
      navigate('/foods');
    } else if (categoryName === 'phụ kiện' || categoryName === 'accessories') {
      navigate('/accessories');
    } else if (categoryName === 'dịch vụ' || categoryName === 'services') {
      navigate('/services');
    } else if (cat.slug) {
      navigate(`/category/${cat.slug}`);
    } else {
    }
  };

  if (loading) {
    return (
      <Container fluid className="my-5 px-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải danh mục...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="my-5 px-4">
      <div className="text-center mb-5">
        <h2 
          className="fw-bold mb-3"
          style={{ 
            color: '#1f2937',
            fontSize: '2.5rem'
          }}
        >
          Danh mục nổi bật
        </h2>
        <p className="text-muted fs-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Khám phá các sản phẩm và dịch vụ tốt nhất cho thú cưng của bạn
        </p>
      </div>
      
      {categories.length > 0 ? (
        <Row className="g-5 justify-content-center">
          {categories.map((cat, index) => (
            <Col key={cat._id || cat.name} xs={12} sm={6} md={6} lg={4} className="d-flex justify-content-center">
              <div 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CategoryItem category={cat} onSelect={handleSelect} />
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <div className="text-muted">
            <i className="fas fa-folder-open" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <h5 className="mt-3">Chưa có danh mục</h5>
            <p>Hiện tại chưa có danh mục nào được tạo.</p>
          </div>
        </div>
      )}
    </Container>
  );
}

export default Categroies;