import React, { useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserContext, UserProvider } from './context/UserContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

// --- IMPORTACIONES CORREGIDAS A SINGULAR ---
// Usamos el nombre que tus archivos exportan por defecto
import DashboardEstudiantes from './pages/DashboardEstudiantes/DashboardEstudiantes'; 
import DashboardDocente from './pages/DashboardDocentes/DashboardDocentes';
import DashboardAdmin from './pages/DashboardAdmin/DashboardAdmin';
import DashboardGuest from './pages/DashboardGuest/DashboardGuest';
import BannerAviso from "./components/BannerAviso/BannerAviso";
import DashboardGuardia from './pages/DashboardGuardia/DashboardGuardia';

import AOS from 'aos';
import 'aos/dist/aos.css'; 
import './css/styles.css'; 

function AppContent() {
  const { user, loading } = useContext(UserContext); 

  useEffect(() => {
    AOS.init({ duration: 1000, once: false, mirror: true, offset: 100 });
  }, []);

  if (loading) return <div className="loading-screen">Cargando PoliParking...</div>;

  return (
    <>
      <BannerAviso />    
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- RUTAS PROTEGIDAS --- */}

        <Route path="/dashboard" element={
          <ProtectedRoute user={user} roleRequired="estudiante">
            <DashboardEstudiantes user={user} /> 
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute user={user} roleRequired="admin">
            <DashboardAdmin user={user} />
          </ProtectedRoute>
        } />

        <Route path="/docente" element={<DashboardDocente user={user} />} />

        {/* --- RUTA PARA EL GUARDIA --- */}
      <Route path="/guardia" element={
        <ProtectedRoute user={user} roleRequired="guardia">
          <DashboardGuardia user={user} />
        </ProtectedRoute>
      } />

        <Route path="/guest" element={<DashboardGuest />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;