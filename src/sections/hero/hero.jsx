import React from "react";
import { Link } from 'react-router-dom';
import logoPoli from '../../assets/Logo PoliParking.png';
import campusEpn from '../../assets/campus-epn.jpg';
import './hero.css'

const Hero = () => {
    return (
        <main id="inicio" className="hero-background" data-aos="fade-in">
            <div className="main-container"> 
                <div className="main-content">
                    <h1 className="block-effect" style={{ "--td": "1.2s" }}>
                        <span className="block-reveal blue" style={{ "--bc": "var(--colorPrincipal)", "--d": ".1s" }}>Poli</span>
                        <span className="block-reveal gold" style={{ "--bc": "var(--colorDorado)", "--d": ".5s" }}>Parking</span>
                    </h1>
                    <h2 className="hero-subtitle block-effect subtitle" style={{ "--td": "1s" }}>
                        <span className="block-reveal blue" style={{ "--bc": "rgba(10,61,98,0.2)", "--d": ".2s" }}>Escuela Politécnica Nacional</span>
                    </h2>

                    <p className="main-description">
                        PoliParking es el sistema oficial de gestión de parqueaderos de la Escuela Politécnica Nacional.
                        Permite reservar, gestionar y optimizar el uso de los espacios de estacionamiento dentro del campus.
                    </p>

                    <div className="hero-features">
                        <span>✔ Reserva en segundos</span>
                        <span>✔ Acceso seguro</span>
                        <span>✔ 100% digital</span>
                    </div>

                    <div className="hero-cta-container">
                        <Link to="/login" className="btn-reserva">¡Reserva tu parqueadero!</Link>
                    </div>
                </div>

                <div className="main-image">
                    <img src={campusEpn} alt="Campus EPN" />
                </div>
            </div>
        </main>     
    );
};

export default Hero;