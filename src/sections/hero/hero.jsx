import React from "react";
import { Link } from 'react-router-dom';
import campusEpn from '../../assets/campus-epn.jpg';
import './hero.css';

const Hero = () => {
    return (
        <main id="inicio" className="hero-background" data-aos="fade-in">
            <div className="hero-wrapper"> 
                {/* Lado Izquierdo: Información */}
                <div className="hero-text-container">
                    <h1 className="hero-title">
                        <span className="reveal b-blue">Poli</span>
                        <span className="reveal b-gold">Parking</span>
                    </h1>
                    
                    <h2 className="hero-subtitle">
                        Escuela Politécnica Nacional
                    </h2>

                    <p className="hero-description">
                        PoliParking es el sistema oficial de gestión de parqueaderos de la Escuela Politécnica Nacional. 
                        Permite reservar, gestionar y optimizar el uso de los espacios dentro del campus.
                    </p>

                    <div className="hero-badges">
                        <span>✔ Reserva en segundos</span>
                        <span>✔ Acceso seguro</span>
                        <span>✔ 100% digital</span>
                    </div>

                    <div className="hero-cta">
                        <Link to="/login" className="btn-reserva-final">¡Reserva tu parqueadero!</Link>
                    </div>
                </div>

                {/* Lado Derecho: Imagen */}
                <div className="hero-image-container">
                    <img src={campusEpn} alt="Campus EPN" />
                </div>
            </div>
        </main>     
    );
};

export default Hero;