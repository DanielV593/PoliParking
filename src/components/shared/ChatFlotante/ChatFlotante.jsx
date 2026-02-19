import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../../firebase/config";
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { FaComments, FaTimes, FaPaperPlane, FaUserShield } from 'react-icons/fa';
import './ChatFlotante.css';

const ChatFlotante = ({ userEmail }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [tieneNuevos, setTieneNuevos] = useState(false);
    const scrollRef = useRef(null);

    // 🤖 RESPUESTAS RÁPIDAS (El usuario solo puede usar estas)
    const OPCIONES_RESPUESTA = [
        "✅ Entendido, gracias.",
        "🏃‍♂️ Voy saliendo en 5 min.",
        "🚗 Ya estoy en el auto.",
        "🎓 Estoy en clases, salgo pronto.",
        "👮‍♂️ Necesito ayuda en mi puesto."
    ];

    useEffect(() => {
        if (!userEmail) return;

        // Escuchamos el documento del chat personal
        const chatRef = doc(db, "chats", userEmail);
        const unsub = onSnapshot(chatRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMensajes(data.mensajes || []);
                
                // Si el último mensaje es del guardia y el chat está cerrado, avisar
                const ultimo = data.mensajes[data.mensajes.length - 1];
                if (ultimo?.remite === 'guardia' && !isOpen) {
                    setTieneNuevos(true);
                }
            }
        });
        return () => unsub();
    }, [userEmail, isOpen]);

    // Auto-scroll al abrir o recibir mensajes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [mensajes, isOpen]);

    const enviarRespuesta = async (texto) => {
        const chatRef = doc(db, "chats", userEmail);
        await updateDoc(chatRef, {
            mensajes: arrayUnion({
                remite: 'usuario',
                texto: texto,
                fecha: new Date().toISOString()
            }),
            noLeidoGuardia: true // Bandera para que el guardia sepa que respondiste
        });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setTieneNuevos(false);
    };

    if (!userEmail) return null;

    return (
        <div className="chat-widget-wrapper">
            {/* VENTANA DEL CHAT */}
            <div className={`chat-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="header-info">
                        <FaUserShield /> <span>Guardia de Turno</span>
                    </div>
                    <button onClick={toggleChat}><FaTimes /></button>
                </div>

                <div className="chat-body" ref={scrollRef}>
                    {mensajes.length === 0 && (
                        <p className="chat-empty">No hay historial de mensajes.</p>
                    )}
                    {mensajes.map((msg, i) => (
                        <div key={i} className={`bubble ${msg.remite === 'guardia' ? 'received' : 'sent'}`}>
                            <p>{msg.texto}</p>
                            <span className="time">
                                {new Date(msg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="chat-footer">
                    <p className="quick-title">Respuestas Rápidas:</p>
                    <div className="quick-options">
                        {OPCIONES_RESPUESTA.map((op, i) => (
                            <button key={i} onClick={() => enviarRespuesta(op)}>
                                {op}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTÓN FLOTANTE (BURBUJA) */}
            <button className={`chat-fab ${tieneNuevos ? 'pulse' : ''}`} onClick={toggleChat}>
                {isOpen ? <FaTimes /> : <FaComments className="bell-animation" />}
                {tieneNuevos && <span className="badge-new"></span>}
            </button>
        </div>
    );
};

export default ChatFlotante;