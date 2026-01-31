import React, { useState } from "react";
import { collection, addDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config';
import Swal from 'sweetalert2';
import './contact.css';

const Contact = () =>{
    const [form, setForm] = useState({ nombre: '', email: '', celular: '', mensaje: '' });

    const enviarMensaje = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "mensajes_contacto"), {
                nombre: form.nombre,
                email: form.email,
                celular: form.celular,
                mensaje: form.mensaje,
                fecha: new Date()
            });
            Swal.fire('Enviado', 'Tu mensaje ha sido recibido por el administrador.', 'success');
            setForm({ nombre: '', email: '', celular: '', mensaje: '' }); // Limpiar form
        } catch (error) {
            Swal.fire('Error', 'No se pudo enviar el mensaje', 'error');
        }
    };

    return (
        <section id="contact" className="container contact" data-aos="fade-up">    
            <h2 className="contact__title">Contáctanos</h2>
            <div className="contact__row">       
                <div className="contact__form">
                    <form onSubmit={enviarMensaje}>
                        <input type="text" placeholder="Nombre" required value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
                        <input type="email" placeholder="Correo" required value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
                        <input type="tel" placeholder="Celular" required value={form.celular} onChange={e=>setForm({...form, celular: e.target.value})} />
                        <textarea placeholder="Observaciones / Comentarios" rows="4" required value={form.mensaje} onChange={e=>setForm({...form, mensaje: e.target.value})}></textarea>
                        
                        <label className="checkbox__label">
                            <input type="checkbox" required />
                            Términos y condiciones
                        </label>
                        <button type="submit" className="btn button">Enviar</button>
                    </form>
                </div>
                <div className="contact__map">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1994.8967664883498!2d-78.49132174668504!3d-0.21045934571991012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a10787b2801%3A0xe543e49339a31e84!2sEscuela%20Polit%C3%A9cnica%20Nacional!5e0!3m2!1ses!2sec!4v1714521876483!5m2!1ses!2sec"
                        style={{ border: 0, width:'100%', height:'100%' }} 
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