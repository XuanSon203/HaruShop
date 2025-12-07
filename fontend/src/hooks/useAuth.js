import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useNotification } from '../components/nofication/Nofication';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      
      if (!token) {
        setUser(null);
        setPermissions([]);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/admin/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.account);
        setPermissions(data.role?.permissions || []);
        setIsAdmin(data.role?.roleName === 'admin');
      } else {
        // Token không hợp lệ, xóa cookie
        Cookies.remove('token');
        setUser(null);
        setPermissions([]);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setPermissions([]);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!permission) return false;
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (!Array.isArray(permissionList)) return false;
    if (isAdmin) return true;
    return permissionList.some(permission => permissions.includes(permission));
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8080/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      setUser(null);
      setPermissions([]);
      setIsAdmin(false);
      addNotification('Đã đăng xuất thành công', 'success');
      navigate('/admin/auth/login');
    }
  };

  const requireAuth = () => {
    if (!user) {
      addNotification('Bạn cần đăng nhập để truy cập trang này', 'error');
      navigate('/admin/auth/login');
      return false;
    }
    return true;
  };

  const requirePermission = (permission) => {
    if (!requireAuth()) return false;
    
    if (!hasPermission(permission)) {
      addNotification('Bạn không có quyền truy cập chức năng này', 'error');
      navigate('/admin/unauthorized');
      return false;
    }
    return true;
  };

  return {
    user,
    permissions,
    isLoading,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    logout,
    requireAuth,
    requirePermission,
    checkAuth,
  };
};

