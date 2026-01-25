import React from "react";
import './services.css';

const Services = () =>{
    return (  
        <section id="services" className="services" data-aos="fade-up">    
            <h2 className="services__title">Nuestros Servicios</h2>
            <article className="container">
                <h4 className="services__text">Descubre cómo PoliParking transforma tu experiencia de estacionamiento en la EPN.</h4>
                <div className="services__container">
                    <div className="service-card">
                    <img src="https://static.vecteezy.com/system/resources/previews/021/267/752/non_2x/reservation-icon-style-free-vector.jpg" alt="Reserva rápida" loading="lazy" />
                    <p className="service-card__title">Reserva tu espacio en segundos</p>
                    <p className="service-card__description">Encuentra y asegura tu parqueadero disponible antes de llegar al campus. Olvídate de buscar por horas.</p>
                    </div>
                    <div className="service-card">
                    <img src="https://cdn-icons-png.flaticon.com/512/854/854980.png" alt="Mapa interactivo" loading="lazy" />
                    <p className="service-card__title">Mapa interactivo de parqueaderos</p>
                    <p className="service-card__description">Visualiza la disponibilidad en tiempo real y navega fácilmente hacia tu espacio reservado o libre.</p>
                    </div>
                    <div className="service-card">
                    <img src="https://static.vecteezy.com/system/resources/previews/003/542/730/non_2x/line-icon-for-notifications-vector.jpg" alt="Notificaciones" loading="lazy" />
                    <p className="service-card__title">Notificaciones y recordatorios</p>
                    <p className="service-card__description">Recibe alertas sobre tu reserva, tiempo restante y promociones exclusivas para usuarios de PoliParking.</p>
                    </div>
                    <div className="service-card">
                    <img src="https://cdn-icons-png.flaticon.com/512/1163/1163480.png" alt="Seguridad" loading="lazy" />
                    <p className="service-card__title">Seguridad 24/7</p>
                    <p className="service-card__description">Vigilancia constante para la tranquilidad de tu vehículo dentro del campus.</p>
                    </div>
                </div>
            </article>
        </section>
    );
};

export default Services;