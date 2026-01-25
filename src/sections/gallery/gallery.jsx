import React from "react";
import './gallery.css';

const Gallery = () =>{
    return (    
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
    );
};

export default Gallery;