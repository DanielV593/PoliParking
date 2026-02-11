import React, { useState, useEffect } from 'react';
import { db } from "../../firebase/config.js";
import { doc, onSnapshot } from 'firebase/firestore';
import { FaBullhorn, FaTimes, FaBell } from 'react-icons/fa';
import './BannerAviso.css';

const BannerAviso = () => {
    const [aviso, setAviso] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "avisos", "global"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.activo) {
                    setAviso(data.mensaje);
                } else {
                    setAviso(null);
                    setIsOpen(false);
                }
            }
        });
        return () => unsub();
    }, []);

    if (!aviso) return null;

    return (
        <div className="aviso-floating-container">
            {/* Botón Flotante (La Campana) */}
            <button 
                className={`aviso-fab ${isOpen ? 'active' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
                title="Ver avisos importantes"
            >
                {isOpen ? <FaTimes /> : <FaBell className="bell-animation" />}
                {!isOpen && <span className="notification-dot"></span>}
            </button>

            {/* Panel Desplegable de Info */}
            <div className={`aviso-panel ${isOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <FaBullhorn /> 
                    <span>Comunicado Oficial</span>
                </div>
                <div className="panel-body">
                    <p>{aviso}</p>
                </div>
                <div className="panel-footer">
                    PoliParking - EPN
                </div>
            </div>
        </div>
    );
};

export default BannerAviso;