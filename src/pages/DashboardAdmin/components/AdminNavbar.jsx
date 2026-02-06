import React from 'react';
import { FaSignOutAlt, FaBars } from 'react-icons/fa';

const AdminNavbar = ({ isMobile, onToggleMenu, onLogout }) => {
    return (
        <nav className="nav-admin">
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                {isMobile && <FaBars size={22} color="white" onClick={onToggleMenu} style={{cursor:'pointer'}} />}
                <h2 style={{margin:0, color:'white', fontSize: isMobile ? '1.1rem' : '1.4rem'}}>
                    PoliParking <span style={{color:'#ffc107', fontSize:'0.8rem', border:'1px solid', padding:'2px 5px', borderRadius:'4px', marginLeft:'5px'}}>ADMIN</span>
                </h2>
            </div>
            <button onClick={onLogout} className="btn-logout">
                <FaSignOutAlt/> {!isMobile && 'Salir'}
            </button>
        </nav>
    );
};

export default AdminNavbar;