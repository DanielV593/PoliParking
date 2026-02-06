import React from 'react';
import { FaChartBar, FaUsers, FaCar, FaEnvelope, FaHistory, FaTimes, FaDatabase, FaClock } from 'react-icons/fa';

const AdminSidebar = ({ isMobile, isMenuOpen, onCloseMenu, moduloActivo, setModuloActivo, currentTime }) => {
    // Estilo dinámico para el sidebar móvil
    const mobileStyle = isMobile ? { left: isMenuOpen ? '0' : '-100%', position: 'fixed' } : { left: '0', position: 'relative' };

    const menuItems = [
        {id:'resumen', icon:<FaChartBar/>, l:'Monitor'}, 
        {id:'usuarios', icon:<FaUsers/>, l:'Usuarios'}, 
        {id:'invitados', icon:<FaCar/>, l:'Invitados'}, 
        {id:'mensajes', icon:<FaEnvelope/>, l:'Mensajes'}, 
        {id:'historial', icon:<FaHistory/>, l:'Historial'}
    ];

    return (
        <aside className={`admin-sidebar ${isMobile ? 'mobile' : ''}`} style={{ ...mobileStyle, width: isMobile ? '280px' : '260px' }}>
            {isMobile && <div style={{textAlign:'right', paddingBottom:'10px'}}><FaTimes size={20} color="#0a3d62" onClick={onCloseMenu} /></div>}
            
            {menuItems.map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setModuloActivo(item.id)} 
                    className={`menu-btn ${moduloActivo === item.id ? 'active' : ''}`}
                    style={{color: moduloActivo === item.id ? 'white' : '#0a3d62'}}
                >
                    {item.icon} {item.l}
                </button>
            ))}
            
            <div style={{marginTop: 'auto', padding: '15px', borderTop: '1px solid #eee'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', color: '#27ae60', fontSize:'0.85rem'}}><FaDatabase/> <span>Firebase: Online</span></div>
                <div style={{display:'flex', alignItems:'center', gap:'10px', color: '#0a3d62', fontSize:'0.85rem'}}><FaClock/> <span>{currentTime.toLocaleTimeString()}</span></div>
                <p style={{fontSize:'0.7rem', color:'#999', marginTop:'15px'}}>PoliParking v2.0 - EPN</p>
            </div>
        </aside>
    );
};

export default AdminSidebar;