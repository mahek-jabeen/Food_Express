import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'restaurant') {
      return <Navigate to="/restaurant/dashboard" />;
    } else if (user.role === 'delivery') {
      return <Navigate to="/delivery/dashboard" />;
    } else {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default RoleBasedRoute;
