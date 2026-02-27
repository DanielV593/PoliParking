import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from "../../../firebase/config";
import { FaCar, FaBullhorn, FaComments } from 'react-icons/fa';
import styles from './ModuleInicioGuardia.module.css';

const ModuleInicioGuardia = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ hoy: 0 });
    const fechaHoy = new Date().toLocaleDateString('en-CA');

    useEffect(() => {
        const q = query(collection(db, "reservas"), where("fecha", "==", fechaHoy));
        const unsub = onSnapshot(q, (snapshot) => { setStats({ hoy: snapshot.size }); });
        return () => unsub();
    }, [fechaHoy]);

    return (
        <div className={styles.dashboardGrid}>
            <div className={styles.statCard}>
                <FaCar className={styles.statIcon} />
                <h3>{stats.hoy}</h3>
                <p>Vehículos en Campus</p>
            </div>
            <div className={styles.statCard} onClick={() => setActiveTab('avisos')}>
                <FaBullhorn className={styles.statIcon} />
                <h3>Anunciar</h3>
                <p>Publicar Aviso General</p>
            </div>
            <div className={styles.statCard} onClick={() => setActiveTab('chats')}>
                <FaComments className={styles.statIcon} />
                <h3>Incidencias</h3>
                <p>Chats y Alertas Privadas</p>
            </div>
        </div>
    );
};

export default ModuleInicioGuardia;