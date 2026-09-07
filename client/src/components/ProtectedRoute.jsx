import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosathi-parchment">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-cosathi-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-cosathi-muted">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not allowed, redirect to user's assigned portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    let fallbackPath = '/';
    if (user.role === 'customer') fallbackPath = '/customer/home';
    else if (user.role === 'worker') fallbackPath = '/worker/dashboard';
    else if (user.role === 'cooperative_admin') fallbackPath = '/cooperative/dashboard';

    return <Navigate to={fallbackPath} state={{ unauthorizedAttempt: true }} replace />;
  }

  return children;
};
