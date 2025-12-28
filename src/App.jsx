import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // <--- IMPORTA ESTO

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* <--- NUEVA RUTA */}
        
        <Route path="*" element={<h1 style={{textAlign:'center', marginTop:'100px'}}>404 - No encontrado</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;