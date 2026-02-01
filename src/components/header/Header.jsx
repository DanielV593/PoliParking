import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { NavHashLink } from 'react-router-hash-link';
import './header.css';

const Header = () => {
    const [menuActive, setMenuActive] = useState(false);

    const toggleMenu = () => setMenuActive(!menuActive);
    const closeMenu = () => setMenuActive(false);

    return (
        <header className="header">
            <div className="header__content">
                
                {/* LADO IZQUIERDO */}
                <div className="header-left">
                    <img 
                        src="https://media.istockphoto.com/id/1349223345/vector/car-parking-vector-icon-parking-sign.jpg?s=612x612&w=0&k=20&c=vU7b48VYPukuwPhEvwOm8pKfizX3XLi3EGOrWMiYg2g=" 
                        alt="Logo PoliParking" 
                        className="logo" 
                    />
                    {/* Título más corto para que no rompa el diseño en móviles */}
                    <h1 className="header-title">PoliParking</h1>
                </div>

                {/* LADO DERECHO (Hamburguesa para móvil) */}
                <div className="header__hamburger" onClick={toggleMenu}>
                    <i className={menuActive ? "fas fa-times" : "fas fa-bars"}></i>
                </div>

                {/* MENÚ DESPLEGABLE */}
                <nav className={`navbar__container ${menuActive ? "active" : ""}`}>
                    <ul>
                        <li>
                            <NavHashLink smooth to="/#inicio" onClick={closeMenu}>
                                Inicio
                            </NavHashLink>
                        </li>
                        
                        <li>
                            <NavHashLink smooth to="/#nosotros" onClick={closeMenu}>
                                Nosotros
                            </NavHashLink>
                        </li>
                        
                        <li>
                            <NavHashLink smooth to="/#servicios" onClick={closeMenu}>
                                Servicios
                            </NavHashLink>
                        </li>

                        <li>
                            <NavHashLink smooth to="/#contacto" onClick={closeMenu}>
                                Contacto
                            </NavHashLink>
                        </li>

                        {/* BOTONES DE ACCESO */}
                        <li className="auth-item">
                            <Link to="/login" className="btn-login" onClick={closeMenu}>
                                Login
                            </Link>
                        </li>
                        
                        <li className="auth-item">
                            <Link to="/register" className="btn-register" onClick={closeMenu}>
                                Registro
                            </Link>
                        </li>
                    </ul>
                </nav>
                
            </div>
        </header>
    );
};

export default Header;