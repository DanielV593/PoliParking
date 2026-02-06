import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 

// --- IMPORTAMOS LAS PÁGINAS (Rutas actualizadas a la nueva estructura) ---
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

// Importamos los 3 Dashboards independientes
import DashboardUser from './pages/DashboardUser/DashboardUser'; 
import DashboardAdmin from './pages/DashboardAdmin/DashboardAdmin';
import DashboardGuest from './pages/DashboardGuest/DashboardGuest';

// --- ANIMACIONES Y ESTILOS GLOBALES ---
import AOS from 'aos';
import 'aos/dist/aos.css'; 
import './css/styles.css'; 

function App() {
  
  useEffect(() => {
    AOS.init({
      duration: 1000, 
      once: false,     
      mirror: true,   
      offset: 100     
    });
  }, []);

  return (
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Ruta: Estudiantes y Docentes */}
        <Route path="/dashboard" element={<DashboardUser />} /> 
        
        {/* Ruta: Administrador */}
        <Route path="/admin" element={<DashboardAdmin />} />
      
        {/* Ruta: Invitados */}
        <Route path="/guest" element={<DashboardGuest />} />
        
        {/* Ruta 404: Si se pierden, los mandamos al inicio o mostramos error */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;