/**
 * COMPONENTE: Navbar
 * PROPÓSITO: Muestra la barra de navegación superior con la marca y el botón de salir.
 * POR QUÉ ESTÁ AQUÍ: Para que la cabecera sea reutilizable y no ensucie el código principal.
 */
import React from 'react';
import { FaSignOutAlt, FaParking } from 'react-icons/fa';

const Navbar = ({ onLogout }) => {
    return (
        <nav className="navbar">
            <div className="brand">
                <FaParking color="#ffc107" size={24}/> 
                <span style={{marginLeft:'8px'}}>POLI<span style={{color:'#ffc107'}}>PARKING</span></span>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Cerrar Sesión">
                <FaSignOutAlt size={20}/>
            </button>
        </nav>
    );
};

export default Navbar;