import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { session, dbUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando plataforma...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere roles especificos y ya cargo el perfil dbUser
  if (allowedRoles && dbUser) {
    const userRole = dbUser.roles?.nombre_rol;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />; // Redirigir al inicio comun si no tiene permisos
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
