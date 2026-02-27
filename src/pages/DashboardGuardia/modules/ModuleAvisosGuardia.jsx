import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, serverTimestamp, addDoc, orderBy, deleteDoc, doc } from 'firebase/firestore'; 
import { db } from "../../../firebase/config";
import Swal from 'sweetalert2';
import { FaInfoCircle, FaExclamationCircle, FaCalendarDay, FaPaperPlane, FaTrash } from 'react-icons/fa';
import styles from './ModuleAvisosGuardia.module.css';

const ModuleAvisosGuardia = ({ user }) => {
    const [mensajeGeneral, setMensajeGeneral] = useState('');
    const [categoriaGeneral, setCategoriaGeneral] = useState('info'); 
    const [avisosActivos, setAvisosActivos] = useState([]); 

    const CATEGORIAS = [
        { id: 'info', label: 'Informativo', icon: <FaInfoCircle />, color: '#339af0' },
        { id: 'urgente', label: 'Urgente', icon: <FaExclamationCircle />, color: '#e30613' },
        { id: 'dia', label: 'Aviso del Día', icon: <FaCalendarDay />, color: '#0a3d62' }
    ];

    useEffect(() => {
        const q = query(collection(db, "avisos"), where("activo", "==", true), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setAvisosActivos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const calcularRestante = (expiraEn) => {
        const diff = expiraEn - Date.now();
        if (diff <= 0) return "Expirado";
        const horasTotal = Math.floor(diff / (1000 * 60 * 60));
        const dias = Math.floor(horasTotal / 24);
        const horas = horasTotal % 24;
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        return dias > 0 ? `${dias}d ${horas}h` : `${horas}h ${mins}m`;
    };

    const publicar = async () => {
        if (!mensajeGeneral.trim()) return Swal.fire('Atención', 'Escribe el aviso.', 'warning');
        let duracionMs = categoriaGeneral === 'dia' ? 86400000 : (categoriaGeneral === 'info' ? 259200000 : 604800000);
        
        await addDoc(collection(db, "avisos"), {
            mensaje: mensajeGeneral,
            categoria: categoriaGeneral,
            activo: true,
            fecha: serverTimestamp(),
            expiraEn: Date.now() + duracionMs,
            autor: "Guardia: " + (user?.nombre || "Oficial")
        });
        setMensajeGeneral('');
        Swal.fire('¡Éxito!', 'Aviso publicado.', 'success');
    };

    const eliminar = async (id) => {
        if ((await Swal.fire({ title: '¿Eliminar?', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "avisos", id));
        }
    };

    return (
        <div className={styles.panel}>
            <div className={styles.formCard}>
                <h2>📢 Tablón de Anuncios</h2>
                <div className={styles.catGrid}>
                    {CATEGORIAS.map(cat => (
                        <div key={cat.id} className={`${styles.catCard} ${categoriaGeneral === cat.id ? styles.active : ''}`}
                            onClick={() => setCategoriaGeneral(cat.id)} style={{borderColor: categoriaGeneral === cat.id ? cat.color : 'transparent'}}>
                            <div style={{color: cat.color}} className={styles.icon}>{cat.icon}</div>
                            <h4>{cat.label}</h4>
                        </div>
                    ))}
                </div>
                <textarea className={styles.input} value={mensajeGeneral} onChange={(e) => setMensajeGeneral(e.target.value)} placeholder="Comunicado..." />
                <button className={styles.btn} onClick={publicar} style={{backgroundColor: CATEGORIAS.find(c=>c.id === categoriaGeneral)?.color}}>
                    <FaPaperPlane /> Publicar Ahora
                </button>
            </div>

            <div className={styles.history}>
                <h3>📋 Avisos Activos</h3>
                <div className={styles.grid}>
                    {avisosActivos.map(a => {
                        const c = CATEGORIAS.find(cat => cat.id === a.categoria) || CATEGORIAS[0];
                        return (
                            <div key={a.id} className={styles.card} style={{ borderLeftColor: c.color }}>
                                <strong style={{ color: c.color }}>{a.categoria?.toUpperCase()}</strong>
                                <p>{a.mensaje}</p>
                                <small>⏳ {calcularRestante(a.expiraEn)}</small>
                                <button onClick={() => eliminar(a.id)} className={styles.trash}><FaTrash /></button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ModuleAvisosGuardia;