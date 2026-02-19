import React, { useState, useEffect, useContext } from 'react';
import { db } from "../../firebase/config.js";
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { UserContext } from "../../context/UserContext";
import { FaBullhorn, FaTimes, FaBell, FaUserShield, FaExclamationCircle, FaInfoCircle, FaCalendarDay } from 'react-icons/fa';
import './BannerAviso.css';

const BannerAviso = ({ user: userProp, placaManual }) => {
    const { user: userContext } = useContext(UserContext);
    const user = userProp || userContext;
    const placaObjetivo = placaManual || user?.placa;

    const [avisosComunidad, setAvisosComunidad] = useState([]); // Ahora es un array
    const [notificacionesPrivadas, setNotificacionesPrivadas] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const getIconoCategoria = (cat) => {
        switch (cat) {
            case 'urgente': return <FaExclamationCircle />;
            case 'dia': return <FaCalendarDay />;
            default: return <FaInfoCircle />;
        }
    };

    useEffect(() => {
        // 📢 1. ESCUCHAR TODOS LOS AVISOS GENERALES (Guardia y Admin si existiera)
        const qAvisos = query(collection(db, "avisos"), where("activo", "==", true));
        const unsubAvisos = onSnapshot(qAvisos, (snapshot) => {
            const ahora = Date.now();
            const listaValida = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(a => !a.expiraEn || ahora < a.expiraEn); // Filtrar expirados en tiempo real
            setAvisosComunidad(listaValida);
        });

        // 🛡️ 2. ESCUCHAR NOTIFICACIONES PRIVADAS
        let unsubPrivado = () => {};
        if (placaObjetivo) {
            const qPrivado = query(
                collection(db, "notificaciones"),
                where("paraDestino", "==", placaObjetivo), 
                orderBy("fecha", "desc")
            );
            unsubPrivado = onSnapshot(qPrivado, (snapshot) => {
                setNotificacionesPrivadas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        }

        return () => { unsubAvisos(); unsubPrivado(); };
    }, [placaObjetivo]); 

    if (avisosComunidad.length === 0 && notificacionesPrivadas.length === 0) return null;

    const tieneNuevas = !isOpen && (avisosComunidad.length > 0 || notificacionesPrivadas.length > 0);

    return (
        <div className="aviso-floating-container">
            <button className={`aviso-fab ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaBell className="bell-animation" />}
                {tieneNuevas && <span className="notification-dot"></span>}
            </button>

            <div className={`aviso-panel ${isOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <FaBullhorn /> <span>Centro de Comunicaciones</span>
                </div>
                
                <div className="panel-body">
                    {/* 🔥 MOSTRAR TODOS LOS AVISOS GENERALES ACTIVOS */}
                    {avisosComunidad.map(aviso => (
                        <div key={aviso.id} className={`msg-card guardia-border cat-${aviso.categoria}`}>
                            <div className="msg-cat-header">
                                {getIconoCategoria(aviso.categoria)}
                                <span>{aviso.autor}</span>
                            </div>
                            <p className="msg-text">{aviso.mensaje}</p>
                        </div>
                    ))}

                    {/* MENSAJES PRIVADOS */}
                    {notificacionesPrivadas.length > 0 && (
                        <div className="seccion-privada">
                            <hr />
                            <h4 className="privado-title"><FaUserShield /> Mensajes para tu Vehículo</h4>
                            {notificacionesPrivadas.map(n => (
                                <div key={n.id} className="notif-item-privada">
                                    <p>{n.mensaje}</p>
                                    <small>{n.fecha?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="panel-footer">PoliParking - EPN</div>
            </div>
        </div>
    );
};

export default BannerAviso;