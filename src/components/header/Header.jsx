import React from 'react';
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <header className="header">
            {/* Esta caja contenedora es la clave para la alineación correcta */}
            <div className="header__content">
                
                {/* IZQUIERDA: Logo */}
                <div className="header-left">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/5/51/Escuela_Polit%C3%A9cnica_Nacional.png" 
                        alt="Logo EPN" 
                        className="logo" 
                    />
                    <h1 className="header-title">Escuela Politécnica Nacional</h1>
                </div>

                {/* DERECHA: Menú y Botones */}
                <nav className="navbar__container">
                    <ul>
                        <li><Link to="/">Inicio</Link></li>
                        <li><a href="#about">Nosotros</a></li>
                        <li><a href="#services">Servicios</a></li>
                        <li><a href="#contact">Contacto</a></li>
                        
                        {/* Botones */}
                        <li><Link to="/login" className="btn-login">Login</Link></li>
                        <li><Link to="/register" className="btn-register">Registro</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;