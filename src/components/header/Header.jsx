import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { NavHashLink } from 'react-router-hash-link';
import './header.css'

const Header = () => {
    const [menuActive, setMenuActive] = useState(false);

    const toggleMenu = () => setMenuActive(!menuActive);
    const closeMenu = () => setMenuActive(false);

    return (
        <header className="header">
            {/* Este contenedor DEBE tener display: flex y justify-content: space-between */}
            <div className="header__content">
                
                {/* LADO IZQUIERDO */}
                <div className="header-left">
                    <img 
                        src="https://media.istockphoto.com/id/1349223345/vector/car-parking-vector-icon-parking-sign.jpg?s=612x612&w=0&k=20&c=vU7b48VYPukuwPhEvwOm8pKfizX3XLi3EGOrWMiYg2g=" 
                        alt="Logo EPN" 
                        className="logo" 
                    />
                    <h1 className="header-title">Gestión Inteligente de Parqueaderos</h1>
                </div>

                {/* LADO DERECHO (Solo la hamburguesa en móvil) */}
                <div className="header__hamburger" onClick={toggleMenu}>
                    <i className={menuActive ? "fas fa-times" : "fas fa-bars"}></i>
                </div>

                {/* MENÚ DESPLEGABLE */}
                <nav className={`navbar__container ${menuActive ? "active" : ""}`}>
                    <ul>
                        <li><NavHashLink smooth to="/#inicio" onClick={closeMenu}>Inicio</NavHashLink></li>
                        <li><NavHashLink smooth to="/#about" onClick={closeMenu}>Nosotros</NavHashLink></li>
                        <li><NavHashLink smooth to="/#services" onClick={closeMenu}>Servicios</NavHashLink></li>
                        <li><NavHashLink smooth to="/#contact" onClick={closeMenu}>Contacto</NavHashLink></li>
                        <li><Link to="/login" className="btn-login" onClick={closeMenu}>Login</Link></li>
                        <li><Link to="/register" className="btn-register" onClick={closeMenu}>Registro</Link></li>
                    </ul>
                </nav>
                
            </div>
        </header>
        
    );
};

export default Header;