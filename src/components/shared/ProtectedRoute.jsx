import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const ProtectedRoute = ({ roleRequired, children }) => {
    const { user, loading } = useContext(UserContext);

    if (loading) return <div className="loading-screen">Verificando...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (roleRequired && user.rol !== roleRequired) {
        if (user.rol === 'admin') return <Navigate to="/admin" replace />;
        if (user.rol === 'docente') return <Navigate to="/docente" replace />;
        return <Navigate to="/dashboard" replace />; // Estudiantes
    }

    return children;
};

export default ProtectedRoute;