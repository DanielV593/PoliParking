import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../../firebase/config";
import { collection, onSnapshot, doc, updateDoc, arrayUnion, setDoc, getDoc, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaUser, FaPaperPlane, FaCircle, FaSearch, FaCar, FaLightbulb, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import styles from './ModuleChatGuardia.module.css';

const ModuleChatGuardia = () => {
    const [chats, setChats] = useState([]);
    const [chatSeleccionado, setChatSeleccionado] = useState(null);
    const [respuesta, setRespuesta] = useState("");
    const [busquedaPlaca, setBusquedaPlaca] = useState("");
    const scrollRef = useRef(null);

    const MENSAJES_RAPIDOS = [
        { text: "💡 Sus luces están encendidas.", icon: <FaLightbulb /> },
        { text: "🚗 Vehículo mal estacionado.", icon: <FaCar /> },
        { text: "⏳ Su tiempo de reserva terminó.", icon: <FaClock /> },
        { text: "👮‍♂️ Favor acercarse a garita.", icon: <FaExclamationTriangle /> }
    ];

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
            setChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatSeleccionado, chats]);

    const buscarYSeleccionar = async (e) => {
        e.preventDefault();
        if (!busquedaPlaca.trim()) return;
        const q = query(collection(db, "usuarios"), where("placa", "==", busquedaPlaca.toUpperCase().trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const u = snap.docs[0].data();
            const emailID = u.email || u.usuario;
            const chatExistente = chats.find(c => c.id === emailID);
            setChatSeleccionado(chatExistente || { id: emailID, mensajes: [], nombreTemporal: u.nombre, placaTemporal: u.placa });
            setBusquedaPlaca("");
        } else { Swal.fire("No encontrado", "No existe usuario con esa placa", "warning"); }
    };

    const enviarMensaje = async (textoAEnviar) => {
        if (!textoAEnviar || !chatSeleccionado) return;
        const chatRef = doc(db, "chats", chatSeleccionado.id);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) await setDoc(chatRef, { mensajes: [] });

        // 1. Guardar en el chat privado (Burbuja)
        await updateDoc(chatRef, {
            mensajes: arrayUnion({ remite: 'guardia', texto: textoAEnviar, fecha: new Date().toISOString() }),
            noLeidoUsuario: true
        });

        // 2. 🔥 ENVIAR NOTIFICACIÓN (Hace sonar la campana roja)
        const placa = chatSeleccionado.placa || chatSeleccionado.placaTemporal;
        if (placa) {
            await addDoc(collection(db, "notificaciones"), {
                paraDestino: placa,
                paraEmail: chatSeleccionado.id,
                mensaje: textoAEnviar,
                leido: false,
                remitente: "Guardia",
                fecha: serverTimestamp(),
                tipo: "privado"
            });
        }
        setRespuesta("");
    };

    const chatVisual = chats.find(c => c.id === chatSeleccionado?.id) || chatSeleccionado;

    return (
        <div className={styles.chatLayout}>
            <div className={styles.sidebarList}>
                <div className={styles.searchBox}>
                    <form onSubmit={buscarYSeleccionar}>
                        <input placeholder="🔍 Buscar placa..." value={busquedaPlaca} onChange={(e) => setBusquedaPlaca(e.target.value)} />
                    </form>
                </div>
                <div className={styles.listContainer}>
                    {chats.map(chat => (
                        <div key={chat.id} className={`${styles.chatItem} ${chatSeleccionado?.id === chat.id ? styles.active : ''}`} onClick={() => setChatSeleccionado(chat)}>
                            <div className={styles.avatar}><FaUser /></div>
                            <div className={styles.info}><strong>{chat.id.split('@')[0]}</strong><p>Chat activo</p></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.chatArea}>
                {chatVisual ? (
                    <>
                        <div className={styles.chatHeader}>Chat con: <strong>{chatVisual.nombreTemporal || chatVisual.id}</strong></div>
                        <div className={styles.messagesBox} ref={scrollRef}>
                            {chatVisual.mensajes?.map((msg, i) => (
                                <div key={i} className={`${styles.bubble} ${msg.remite === 'guardia' ? styles.me : styles.them}`}><p>{msg.texto}</p></div>
                            ))}
                        </div>
                        <div className={styles.footerArea}>
                            <div className={styles.quickChips}>
                                {MENSAJES_RAPIDOS.map((m, i) => <button key={i} onClick={() => enviarMensaje(m.text)}>{m.icon} {m.text}</button>)}
                            </div>
                            <form className={styles.inputArea} onSubmit={(e) => { e.preventDefault(); enviarMensaje(respuesta); }}>
                                <input value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Escribe un mensaje..." />
                                <button type="submit"><FaPaperPlane /></button>
                            </form>
                        </div>
                    </>
                ) : <div className={styles.noSelection}><p>Busca una placa para chatear</p></div>}
            </div>
        </div>
    );
};

export default ModuleChatGuardia;