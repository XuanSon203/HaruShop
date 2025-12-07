import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaSignInAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ContactAuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);
const API_BASE = `http://${window.location.hostname}:8080`;
  const checkAuth = async () => {
    try {
      // Kiểm tra xem có tokenUser trong cookies không
      const response = await fetch(`${API_BASE}/contact/user-contacts`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra...</span>
        </div>
        <p className="mt-2 text-muted">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-5">
        <FaUser className="text-muted mb-3" style={{ fontSize: '4rem' }} />
        <h5 className="text-muted mb-3">Vui lòng đăng nhập để xem liên hệ</h5>
        <p className="text-muted mb-4">
          Bạn cần đăng nhập để có thể xem lịch sử liên hệ và phản hồi từ chúng tôi.
        </p>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => navigate('/login')}
        >
          <FaSignInAlt className="me-2" />
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return children;
};

export default ContactAuthGuard;
