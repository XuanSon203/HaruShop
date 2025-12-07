import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';

function CategoryItem({ category, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  const fallbackCategory = {
    name: 'Danh mục',
    image: 'https://via.placeholder.com/400x260?text=Category',
    itemsCount: 0,
    description: ''
  };
const API_BASE = `http://${window.location.hostname}:8080`;
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x260?text=Category';
    
    // Nếu đã là URL đầy đủ
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Nếu là đường dẫn relative, thêm base URL
    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE}${imagePath}`;
    }
    
    // Nếu chỉ là tên file, thêm đường dẫn uploads
    return `${API_BASE}/uploads/${imagePath}`;
  };

  const data = category || fallbackCategory;

  const handleClick = () => {
    if (onSelect) onSelect(data);
  };

  return (
    <Card
      className="border-0 h-100 animate-fade-in"
      style={{
        cursor: 'pointer',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onClick={handleClick}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Card.Img
          variant="top"
          src={getImageUrl(data.image)}
          alt={data.name}
          style={{ 
            objectFit: 'cover', 
            height: 280,
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        {/* Gradient overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isHovered 
              ? 'linear-gradient(135deg, rgba(242, 118, 10, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%)',
            transition: 'all 0.3s ease'
          }}
        />
        {Number.isFinite(data.itemsCount) && (
          <Badge 
            className="position-absolute" 
            style={{ 
              right: 16, 
              top: 16,
              background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
              border: '2px solid white',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0.6rem 1rem',
              borderRadius: '50px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {data.itemsCount} sản phẩm
          </Badge>
        )}
      </div>
      <Card.Body className="p-5">
        <Card.Title 
          as="h5" 
          className="mb-3 fw-bold"
          style={{ 
            color: '#1f2937',
            fontSize: '1.4rem',
            lineHeight: '1.4'
          }}
        >
          {data.name}
        </Card.Title>
        {/* Hover indicator */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: isHovered 
              ? 'linear-gradient(90deg, #f2760a 0%, #0ea5e9 100%)'
              : 'transparent',
            transition: 'all 0.3s ease'
          }}
        />
      </Card.Body>
    </Card>
  );
}

export default CategoryItem;