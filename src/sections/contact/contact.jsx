import React from "react";
import './contact.css';

const Contact = () =>{
    return (
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
    );
};

export default Contact;