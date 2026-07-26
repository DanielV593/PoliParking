import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const ProtectedRoute = ({ roleRequired, children }) => {
    const { user, loading } = useContext(UserContext);

    if (loading) return <div className="loading-screen">Verificando...</div>;

    if (!user) return <Navigate to="/login" replace />;

    // roleRequired puede ser un string ("admin") o un array (["admin", "admin_secundario"])
    const rolesPermitidos = Array.isArray(roleRequired) ? roleRequired : [roleRequired];

    if (roleRequired && !rolesPermitidos.includes(user.rol)) {
        if (user.rol === 'admin' || user.rol === 'admin_secundario') return <Navigate to="/admin" replace />;
        if (user.rol === 'docente' || user.rol === 'administrativo') return <Navigate to="/docente" replace />;
        if (user.rol === 'guardia') return <Navigate to="/guardia" replace />;
        return <Navigate to="/dashboard" replace />; // Estudiantes
    }

    return children;
};

export default ProtectedRoute;