import React from "react";
import './app.css';

const App = () =>{
    return (
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
    );
};
export default App;