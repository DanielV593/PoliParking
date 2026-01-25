import React from "react";
import './find.css';
import logoEsfot from '../../assets/Logo ESFOT.png';

const Find = () =>{
    return (
        <section className="find-us" data-aos="fade-up">
            <h2 className="find-us__title">Encuéntranos</h2>
            <article className="container">
                <h4 className="find-us__text">
                    Visítanos en la Asociación de la ESFOT o síguenos en nuestras redes sociales.
                </h4>

                <div className="find-us__container">
                    <div className="location-card card-physical">
                        <div className="card__header">
                            <p className="location__title">Asociación de la ESFOT</p>
                        </div>
                        <div className="card__body">
                            <img src={logoEsfot} alt="Logo ESFOT" className="main-logo-esfot" />
                        
                            <div className="address-block">
                            <div className="address-item">
                                <i className="fas fa-building"></i>
                                <p>Edificio E, Planta Baja — EPN</p>
                            </div>
                            <div className="address-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <p>Av. Ladrón de Guevara E11-253, Quito</p>
                            </div>
                            </div>
                        </div>

                        <div className="card__footer">
                            <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="btn-reserva full-width">Ver en Mapa</a>
                        </div>
                    </div>

                    <div className="location-card card-social">
                    <div className="card__header">
                        <p className="location__title">Nuestras Redes</p>
                    </div>

                    <div className="card__body centered-body">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Escuela_Polit%C3%A9cnica_Nacional.png" alt="EPN Logo" className="main-logo-epns" />
                    
                        <div className="address-block social-text-block">
                        <p className="location__text">
                            Síguenos y entérate de las últimas novedades y eventos oficiales.
                        </p>
                        </div>
                    </div>
                
                    <div className="card__footer">
                        <div className="social-icons prominent-icons">
                        <a href="https://www.facebook.com/" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
                        <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer"><i className="fab fa-tiktok"></i></a>
                        <a href="https://web.whatsapp.com/" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp"></i></a>
                        </div>
                    </div>
                    </div>
                </div>
            </article>
        </section>

    );
};

export default Find;