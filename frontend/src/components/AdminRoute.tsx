import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for zustand persist to hydrate
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show nothing while hydrating to prevent flash of redirect
  if (!isHydrated) {
    return null;
  }

  // Check localStorage directly as fallback for persisted auth
  const accessToken = localStorage.getItem('access_token');
  const authStorage = localStorage.getItem('auth-storage');
  let persistedUser = null;
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      persistedUser = parsed.state?.user;
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check role from zustand state or persisted state
  const userRole = user?.role || persistedUser?.role;

  // Redirect to home if not admin
  if (userRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
