import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requireAdmin = false,
  fallback = null 
}) => {
  const { user, permissions, isAdmin, isLoading, hasPermission, hasAnyPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Đang kiểm tra quyền...</div>
        </div>
      </div>
    );
  }

  // Kiểm tra đăng nhập
  if (!user) {
    return fallback || null;
  }

  // Kiểm tra quyền admin
  if (requireAdmin && !isAdmin) {
    return fallback || null;
  }

  // Kiểm tra quyền cụ thể
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    if (!hasRequiredPermissions) {
      return fallback || null;
    }
  }

  return children;
};

export default ProtectedRoute;

