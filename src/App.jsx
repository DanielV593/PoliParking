import React, { useEffect } from 'react';
// BrowserRouter se suele poner en main.jsx, pero si te da error de router, 
// asegúrate de que tu app esté envuelta en <BrowserRouter> en algún lado.
import { Routes, Route } from 'react-router-dom'; 

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardUser from './pages/DashboardUser'; 
import DashboardAdmin from './pages/DashboardAdmin'; 

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
        
        {/* Rutas de usuarios registrados */}
        <Route path="/dashboard-user" element={<DashboardUser />} /> 
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
      
        {/* Redirigimos al invitado al mismo DashboardUser para que vea el mapa */}
       <Route path="/guest" element={<DashboardUser isGuest={true} />} />
        
        {/* Ruta 404 */}
        <Route path="*" element={<h1 style={{textAlign:'center', marginTop:'100px'}}>404 - No encontrado</h1>} />
      </Routes>
  );
}

export default App;