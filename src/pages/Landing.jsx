import React from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

import logoPoli from '../assets/Logo PoliParking-CMoCI8Fp.jpg';
import campusEpn from '../assets/campus-epn.jpg';
import logoEsfot from '../assets/Logo ESFOT.png';

const Landing = () => {
return (
    <>
    <Header />

    {/* SECCIÓN INICIO - Añadido id="inicio" */}
    <main id="inicio" className="hero-background" data-aos="fade-in">
        <div className="main-container">
            <div className="main-content">
                <img 
                    src={logoPoli} 
                    alt="Logo PoliParking" 
                    className="main-logo-hero" 
                />
                <h1 className="main-title">Sistema <span>PoliParking</span></h1>
                <p className="main-description">
                PoliParking es el sistema oficial de gestión de parqueaderos de la Escuela Politécnica Nacional.
                Permite reservar, gestionar y optimizar el uso de los espacios de estacionamiento dentro del campus.
                </p>
                <a href="#reservar" className="btn-reserva">¡Reserva tu parqueadero!</a>
            </div>
            <div className="main-image">
                <img src={campusEpn} alt="Campus EPN" />
            </div>
        </div>
    </main>

    {/* SECCIÓN SOBRE NOSOTROS - Añadido id="about" */}
    <section id="about" className="about">
        <div className="about__wrapper">
            {/* TARJETA BLANCA */}
            <div className="about__card">
                <h2 className="about__title">Sobre PoliParking</h2>

                <p className="about__text">
                PoliParking es una iniciativa innovadora de la Escuela Politécnica Nacional (EPN) diseñada para revolucionar la experiencia de estacionamiento en el campus mediante un sistema de reservas inteligente y eficiente.
                </p>

                <p className="about__text">
                Nuestro objetivo es transformar la movilidad interna, reducir significativamente la congestión vehicular y ofrecer máxima comodidad a toda la comunidad universitaria.
                </p>

                <p className="about__text">
                Con PoliParking, tu espacio está garantizado antes de que llegues al campus.
                </p>

                <div className="about__stats">
                <div className="stat">
                    <span>500+</span>
                    <small>Espacios</small>
                </div>
                <div className="stat">
                    <span>24/7</span>
                    <small>Disponibilidad</small>
                </div>
                <div className="stat">
                    <span>100%</span>
                    <small>Seguro</small>
                </div>
                </div>
            </div>
            {/* IMAGEN */}
            <div className="about__image">
                <img
                src="https://www.eluniverso.com/resizer/v2/DXSEAS2SXZCHRE55ABQN76TEUM.jpg?auth=e19adbde083f6a0cc42c27b2b17401475a411b603aef08e8080373ec7188cd5a&width=1005&height=670&quality=75&smart=true"
                alt="Sistema moderno de parqueadero EPN"
                loading="lazy"
                />
            </div>
        </div>
    </section>


    {/* SECCIÓN SERVICIOS - Añadido id="services" */}
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

    {/* SECCIÓN APP (Sin cambio de ID necesario) */}
    <section className="container app" data-aos="fade-left">
        <div className="mobile">
        <h2 className="mobile__title">Lleva PoliParking en tu bolsillo</h2>
        <p className="mobile__description">Descarga nuestra aplicación y gestiona tus parqueaderos con total comodidad. Reserva, encuentra y paga desde tu smartphone.</p>
        <div className="mobile__buttons">
            <a href="https://www.apple.com/la/app-store/" target="_blank" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/668/668276.png" alt="Descargar en App Store" loading="lazy" />
            </a>
            <a href="https://play.google.com/store/games?hl=es_419" target="_blank" rel="noreferrer">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRJIOTgCva6nywrmxV-DDoVpyDF2VMSKg12g&s" alt="Descargar en Google Play" loading="lazy" />
            </a>
        </div>
        </div>
        <div className="mobile__img">
        <img src="https://us.as.com/autos/wp-content/uploads/2024/05/5805550_60893-scaled.jpg" alt="Mockup app PoliParking" loading="lazy" />
        </div>
    </section>

    {/* SECCIÓN GALERÍA */}
    <section className="gallery" data-aos="zoom-in">
        <h3 className="gallery__title">Galería PoliParking</h3>
        <p className="gallery__description">Explora el campus de la EPN y nuestros modernos parqueaderos.</p>
        
        <div className="gallery__grid container">
        <div className="gallery__item"><img src="https://webhistorico.epn.edu.ec/wp-content/uploads/2014/08/100_0783.jpg" alt="Parqueadero techado EPN" loading="lazy" /></div>
        <div className="gallery__item"><img src="https://images.unsplash.com/photo-1690204704223-4844fd31e2b4?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Vista aérea EPN" loading="lazy" /></div>
        <div className="gallery__item"><img src="https://images.unsplash.com/photo-1656589604740-781c5fe85451?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Entrada al parqueadero EPN" loading="lazy" /></div>
        <div className="gallery__item"><img src="https://plus.unsplash.com/premium_photo-1682787494783-d0fdba8c5cf8?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Estudiante usando la app" loading="lazy" /></div>
        <div className="gallery__item"><img src="https://images.unsplash.com/photo-1616363088386-31c4a8414858?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Parqueadero subterráneo EPN" loading="lazy" /></div>
        <div className="gallery__item"><img src="https://images.unsplash.com/photo-1663326577034-f8424e12dddb?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Área verde campus EPN" loading="lazy" /></div>
        </div>
    </section>

    {/* SECCIÓN CONTACTO - Añadido id="contact" */}
    <section id="contact" className="container contact" data-aos="fade-up">    
        <h2 className="contact__title">Contáctanos</h2>
        <div className="contact__row">       
        <div className="contact__form">
            <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" name="nombre" placeholder="Nombre" required />
            <input type="email" name="corre0" placeholder="Correo" required />
            <input type="tel" name="celular" placeholder="Celular" required />
            <textarea name="observaciones" placeholder="Observaciones" rows="4"></textarea>
            <label className="checkbox__label">
                <input type="checkbox" required />
                Términos y condiciones
            </label>
            <button type="submit" className="btn button">Enviar</button>
            </form>
        </div>

        <div className="contact__map">
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15959.073379204043!2d-78.4907604!3d-0.2117562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a107f950c41%3A0x6758d4a6549226cb!2sEscuela%20Polit%C3%A9cnica%20Nacional!5e0!3m2!1ses!2sec!4v1700000000000!5m2!1ses!2sec"
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
        </div>
    </section>

    {/* SECCIÓN FIND US */}
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

        <Footer />
    </>
    );
};

export default Landing;