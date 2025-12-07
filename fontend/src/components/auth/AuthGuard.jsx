import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { useNotification } from '../nofication/Nofication';

const AuthGuard = ({ children, requiredPermissions = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    checkAuthAndPermissions();
  }, [location.pathname]);

  const checkAuthAndPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Kiểm tra token trong cookie
      const token = Cookies.get('token');
      if (!token) {
        handleUnauthorized('Bạn chưa đăng nhập');
        return;
      }

      // Gọi API để kiểm tra token và lấy thông tin user
      const response = await fetch(`http://localhost:8080/admin/auth/verify`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized(data.message || 'Token không hợp lệ hoặc đã hết hạn');
        } else if (response.status === 403) {
          handleForbidden(data.message || 'Bạn không có quyền truy cập trang này');
        } else {
          handleUnauthorized('Lỗi xác thực');
        }
        return;
      }

      // Lưu thông tin user
      setUserInfo(data.account);
      setIsAuthenticated(true);

      // Kiểm tra quyền nếu có yêu cầu
      if (requiredPermissions.length > 0) {
        const userPermissions = data.role?.permissions || [];
        const hasRequiredPermissions = requiredPermissions.every(permission => 
          userPermissions.includes(permission) || data.role?.roleName === 'admin'
        );
        
        if (!hasRequiredPermissions) {
          handleForbidden('Bạn không có quyền truy cập chức năng này');
          return;
        }
      }

      setHasPermission(true);
    } catch (error) {
      console.error('Auth check error:', error);
      handleUnauthorized('Lỗi kiểm tra quyền truy cập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnauthorized = (message) => {
    setIsAuthenticated(false);
    setHasPermission(false);
    setIsLoading(false);
    
    // Lưu URL hiện tại để redirect sau khi login
    const currentPath = location.pathname + location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    
    addNotification(message, 'error');
    navigate('/admin/auth/login', { replace: true });
  };

  const handleForbidden = (message) => {
    setIsAuthenticated(false);
    setHasPermission(false);
    setIsLoading(false);
    
    addNotification(message, 'error');
    navigate('/admin/unauthorized', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Đang kiểm tra quyền truy cập...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasPermission) {
    return null;
  }

  return children;
};

export default AuthGuard;

