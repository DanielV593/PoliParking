import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
      console.log("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Navbar Dashboard */}
      <nav style={{ 
        background: '#0a3d62', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        color: 'white' 
      }}>
        <h2>PoliParking <span style={{color: '#feca57'}}>App</span></h2>
        
        {/* Botón funcional de Cerrar Sesión */}
        <button 
            onClick={handleLogout}
            style={{ 
                background: 'transparent', 
                border: '1px solid white', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
        >
            Cerrar Sesión
        </button>
      </nav>

      {/* Contenido Principal */}
      <div className="container" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0a3d62' }}>👋 ¡Hola, Conductor!</h1>
        <p style={{ fontSize: '1.2rem', color: '#555' }}>
            Bienvenido al sistema de reservas.
        </p>

        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem', 
            marginTop: '3rem',
            padding: '0 2rem'
        }}>
            <div style={cardStyle}>
                <h3 style={{color: '#0a3d62'}}>🚗 Reservar Ahora</h3>
                <p>Busca un espacio disponible en tiempo real.</p>
            </div>
            <div style={cardStyle}>
                <h3 style={{color: '#0a3d62'}}>📅 Mis Reservas</h3>
                <p>Revisa tu historial y reservas activas.</p>
            </div>
            <div style={cardStyle}>
                <h3 style={{color: '#0a3d62'}}>👤 Mi Perfil</h3>
                <p>Actualiza tus datos y vehículo.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #e1e1e1',
    backgroundColor: 'white'
};

export default Dashboard;