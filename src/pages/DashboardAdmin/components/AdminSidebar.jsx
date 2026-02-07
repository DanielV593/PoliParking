// src/pages/DashboardAdmin/components/AdminSidebar.jsx
import React from 'react';
import { 
    FaChartBar, FaUsers, FaCar, FaEnvelope, FaHistory, FaTimes, FaDatabase, FaClock 
} from 'react-icons/fa';

const AdminSidebar = ({ 
    isMobile, 
    isMenuOpen, 
    onCloseMenu, 
    moduloActivo, 
    setModuloActivo, 
    currentTime 
}) => {
    
    // Estilo dinámico para el sidebar móvil (slide-in)
    const mobileStyle = isMobile 
        ? { left: isMenuOpen ? '0' : '-100%', position: 'fixed', zIndex: 1000 } 
        : { left: '0', position: 'relative' };

    const menuItems = [
        {id: 'resumen', icon: <FaChartBar/>, label: 'Monitor'}, 
        {id: 'usuarios', icon: <FaUsers/>, label: 'Usuarios'}, 
        {id: 'invitados', icon: <FaCar/>, label: 'Invitados'}, 
        {id: 'mensajes', icon: <FaEnvelope/>, label: 'Mensajes'}, 
        {id: 'historial', icon: <FaHistory/>, label: 'Historial'}
    ];

    return (
        <aside 
            className={`admin-sidebar ${isMobile ? 'mobile' : ''}`} 
            style={{ ...mobileStyle, width: isMobile ? '280px' : '260px' }}
        >
            {/* Botón de cierre solo en móvil */}
            {isMobile && (
                <div style={{ textAlign: 'right', paddingBottom: '10px' }}>
                    <FaTimes 
                        size={20} 
                        color="#0a3d62" 
                        onClick={onCloseMenu} 
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            )}
            
            {/* Menú de navegación */}
            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setModuloActivo(item.id)} 
                        className={`menu-btn ${moduloActivo === item.id ? 'active' : ''}`}
                        style={{
                            color: moduloActivo === item.id ? 'white' : '#0a3d62',
                            // Añade tus estilos base de botón aquí o en el CSS
                        }}
                    >
                        {item.icon} 
                        <span style={{ marginLeft: '10px' }}>{item.label}</span>
                    </button>
                ))}
            </div>
            
            {/* Footer del Sidebar (Info del sistema) */}
            <div style={{ marginTop: 'auto', padding: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#27ae60', fontSize: '0.85rem' }}>
                    <FaDatabase/> <span>Firebase: Online</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0a3d62', fontSize: '0.85rem' }}>
                    <FaClock/> <span>{currentTime.toLocaleTimeString()}</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '15px', textAlign: 'center' }}>
                    PoliParking v2.0 - EPN
                </p>
            </div>
        </aside>
    );
};

export default AdminSidebar;