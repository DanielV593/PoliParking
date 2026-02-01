import React from "react";
import './gallery.css';

// IMPORTACIÓN DE IMÁGENES (CORREGIDO SEGÚN TU CARPETA)
import img1 from '../../assets/estacionamiento1.jpg';   // .jpg
import img2 from '../../assets/estacionamiento2.jpg';   // .jpg
import img3 from '../../assets/estacionamiento3.jpeg';  // .jpeg (¡OJO AQUÍ!)
import img4 from '../../assets/estacionamiento4.jpg';   // .jpg
import img5 from '../../assets/estacionamiento5.jpeg';  // .jpeg (¡OJO AQUÍ!)
import img6 from '../../assets/estacionamiento6.jpeg';  // .jpeg (¡OJO AQUÍ!)

const Gallery = () =>{
    return (    
        <section className="gallery" data-aos="zoom-in">
            <h3 className="gallery__title">Galería PoliParking</h3>
            <p className="gallery__description">Explora el campus de la EPN y nuestros modernos parqueaderos.</p>
            
            <div className="gallery__grid container">
                
                <div className="gallery__item">
                    <img src={img1} alt="Estacionamiento EPN 1" loading="lazy" />
                </div>
                
                <div className="gallery__item">
                    <img src={img2} alt="Estacionamiento EPN 2" loading="lazy" />
                </div>
                
                <div className="gallery__item">
                    <img src={img3} alt="Estacionamiento EPN 3" loading="lazy" />
                </div>
                
                <div className="gallery__item">
                    <img src={img4} alt="Estacionamiento EPN 4" loading="lazy" />
                </div>
                
                <div className="gallery__item">
                    <img src={img5} alt="Estacionamiento EPN 5" loading="lazy" />
                </div>
                
                <div className="gallery__item">
                    <img src={img6} alt="Estacionamiento EPN 6" loading="lazy" />
                </div>

            </div>
        </section>
    );
};

export default Gallery;