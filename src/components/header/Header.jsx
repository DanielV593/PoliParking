import React, { useState } from 'react';
import { Link } from "react-router-dom";
// CAMBIO 1: Importamos HashLink en lugar de NavHashLink
import { HashLink } from 'react-router-hash-link';
import './header.css';

// IMPORTACIÓN DE IMÁGENES
import logoPoliParking from '../../assets/Logo Poliparking.png';
import logoEsfot from '../../assets/Logo ESFOT.png';
import logoEpn from '../../assets/EPN.png';

const Header = () => {
    const [menuActive, setMenuActive] = useState(false);
    const toggleMenu = () => setMenuActive(!menuActive);
    const closeMenu = () => setMenuActive(false);

    return (
        <header className="header">
            <div className="header__content">
                
                {/* === ZONA IZQUIERDA === */}
                <div className="header-left">
                    
                    {/* 1. SOLO LOGO (GRANDE) */}
                    <Link to="/" onClick={closeMenu} className="brand-link">
                        <img 
                            src={logoPoliParking} 
                            alt="PoliParking" 
                            className="logo-main" 
                        />
                    </Link>

                    {/* Separador */}
                    <div className="separator"></div>

                    {/* 2. CRÉDITOS (LETRAS NEGRAS) */}
                    <div className="credits-container">
                        <span className="credits-label">ELABORADO POR:</span>
                        
                        <div className="logos-row">
                            {/* ESFOT */}
                            <div className="inst-item">
                                <span className="inst-name">ESFOT</span>
                                <img src={logoEsfot} alt="ESFOT" className="logo-inst" />
                            </div>
                            
                            <span className="connector">X</span>
                            
                            {/* EPN */}
                            <div className="inst-item">
                                <span className="inst-name">EPN</span>
                                <img src={logoEpn} alt="EPN" className="logo-inst logo-epn-fix" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === DERECHA: MENÚ === */}
                <div className="header__hamburger" onClick={toggleMenu}>
                    <i className={menuActive ? "fas fa-times" : "fas fa-bars"}></i>
                </div>

                <nav className={`navbar__container ${menuActive ? "active" : ""}`}>
                    <ul>
                        {/* CAMBIO 2: Usamos <HashLink> para evitar el error de "isActive" */}
                        <li><HashLink smooth to="/#inicio" onClick={closeMenu}>Inicio</HashLink></li>
                        <li><HashLink smooth to="/#nosotros" onClick={closeMenu}>Nosotros</HashLink></li>
                        <li><HashLink smooth to="/#servicios" onClick={closeMenu}>Servicios</HashLink></li>
                        <li><HashLink smooth to="/#contacto" onClick={closeMenu}>Contacto</HashLink></li>

                        <li className="auth-item">
                            <Link to="/login" className="btn-login" onClick={closeMenu}>Login</Link>
                        </li>
                        <li className="auth-item">
                            <Link to="/register" className="btn-register" onClick={closeMenu}>Registro</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;