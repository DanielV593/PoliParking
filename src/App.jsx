import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Quitamos BrowserRouter de aquí

// --- CONTEXTO (La Energía) ---
import { UserProvider } from './context/UserContext';

// --- PÁGINAS ---
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

import DashboardUser from './pages/DashboardUser/DashboardUser'; 
import DashboardAdmin from './pages/DashboardAdmin/DashboardAdmin';
import DashboardGuest from './pages/DashboardGuest/DashboardGuest';

import AOS from 'aos';
import 'aos/dist/aos.css'; 
import './css/styles.css'; 

function App() {
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: false, mirror: true, offset: 100 });
  }, []);

  return (
    <UserProvider>
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* --- RUTAS PRIVADAS --- */}
          <Route path="/dashboard" element={<DashboardUser />} /> 
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/guest" element={<DashboardGuest />} />
          
          {/* --- 404 --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </UserProvider>
  );
}

export default App;