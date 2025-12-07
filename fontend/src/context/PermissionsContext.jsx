import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const PermissionsContext = createContext({ permissions: [], loading: true, has: () => false, hasAny: () => false });

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/admin/auth/verify", { credentials: "include" });
        const data = await res.json();
        if (mounted && res.ok && data.success && Array.isArray(data?.role?.permissions)) {
          setPermissions(data.role.permissions);
        } else if (mounted) {
          setPermissions([]);
        }
      } catch (_) {
        if (mounted) setPermissions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => ({
    permissions,
    loading,
    has: (perm) => permissions.includes(perm),
    hasAny: (...perms) => perms.some((p) => permissions.includes(p)),
  }), [permissions, loading]);

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

