import React from "react";
import './about.css';

const About = () =>{
    return (
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
    
    );    
};
export default About; 