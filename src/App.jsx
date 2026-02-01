import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardUser from './pages/DashboardUser'; 
import DashboardAdmin from './pages/DashboardAdmin'; 
// 1. IMPORTAMOS EL NUEVO DASHBOARD DE INVITADOS
import DashboardGuest from './pages/DashboardGuest'; 

// --- IMPORTAMOS ANIMACIONES ---
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
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard para Estudiantes y Docentes */}
        <Route path="/dashboard-user" element={<DashboardUser />} /> 
        
        {/* Dashboard para Administrador */}
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        
        {/* 2. NUEVA RUTA PARA INVITADOS */}
        <Route path="/guest" element={<DashboardGuest />} />
        
        <Route path="*" element={<h1 style={{textAlign:'center', marginTop:'100px'}}>404 - No encontrado</h1>} />
      </Routes>
  );
}

export default App;