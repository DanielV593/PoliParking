import React from 'react';
import { FaSignOutAlt, FaBars } from 'react-icons/fa';
import RoleBadge from '../../../components/shared/RoleBadge/RoleBadge';

const AdminNavbar = ({ isMobile, onToggleMenu, onLogout }) => {
    return (
        <nav className="nav-admin">
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                {isMobile && <FaBars size={22} color="white" onClick={onToggleMenu} style={{cursor:'pointer'}} />}
                <h2 style={{margin:0, color:'white', fontSize: isMobile ? '1.1rem' : '1.4rem', display:'flex', alignItems:'center', gap:'10px'}}>
                    PoliParking <RoleBadge role="Admin" accent="admin" />
                </h2>
            </div>
            <button onClick={onLogout} className="btn-logout">
                <FaSignOutAlt/> {!isMobile && 'Salir'}
            </button>
        </nav>
    );
};

export default AdminNavbar;