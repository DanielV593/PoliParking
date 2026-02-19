import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, serverTimestamp, addDoc, orderBy, deleteDoc, doc } from 'firebase/firestore'; 
import { db, auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
    FaCar, FaBullhorn, FaComments, FaCalendarDay, FaExclamationCircle, 
    FaInfoCircle, FaUserShield, FaSignOutAlt, FaHistory, FaPaperPlane, FaTrash 
} from 'react-icons/fa';
import styles from './DashboardGuardia.module.css';
import ModuleChatGuardia from './ModuleChatGuardia'; 

const DashboardGuardia = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('inicio'); 
    const [mensajeGeneral, setMensajeGeneral] = useState('');
    const [categoriaGeneral, setCategoriaGeneral] = useState('info'); 
    const [stats, setStats] = useState({ hoy: 0 });
    const [avisosActivos, setAvisosActivos] = useState([]); 
    const fechaHoy = new Date().toLocaleDateString('en-CA');

    const CATEGORIAS_GENERALES = [
        { id: 'info', label: 'Informativo', icon: <FaInfoCircle />, color: '#339af0', desc: 'Dura 3 días.' },
        { id: 'urgente', label: 'Urgente', icon: <FaExclamationCircle />, color: '#e30613', desc: 'Dura 7 días.' },
        { id: 'dia', label: 'Aviso del Día', icon: <FaCalendarDay />, color: '#0a3d62', desc: 'Dura 24 horas.' }
    ];

    useEffect(() => {
        // 1. Estadísticas de ocupación
        const qReservas = query(collection(db, "reservas"), where("fecha", "==", fechaHoy));
        const unsubRes = onSnapshot(qReservas, (snapshot) => { setStats({ hoy: snapshot.size }); });

        // 2. Escuchar colección de avisos para el historial
        const qAvisos = query(collection(db, "avisos"), where("activo", "==", true), orderBy("fecha", "desc"));
        const unsubAvisos = onSnapshot(qAvisos, (snapshot) => {
            setAvisosActivos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubAvisos(); };
    }, [fechaHoy]);

    const calcularRestante = (expiraEn) => {
        const diff = expiraEn - Date.now();
        if (diff <= 0) return "Expirado";
        const horasTotal = Math.floor(diff / (1000 * 60 * 60));
        const dias = Math.floor(horasTotal / 24);
        const horas = horasTotal % 24;
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        return dias > 0 ? `${dias}d ${horas}h` : `${horas}h ${mins}m`;
    };

    const publicarAvisoGeneral = async () => {
        if (!mensajeGeneral.trim()) return Swal.fire('Atención', 'Escribe el contenido del aviso.', 'warning');

        let duracionMs = 0;
        if (categoriaGeneral === 'info') duracionMs = 3 * 24 * 60 * 60 * 1000;
        if (categoriaGeneral === 'urgente') duracionMs = 7 * 24 * 60 * 60 * 1000;
        if (categoriaGeneral === 'dia') duracionMs = 24 * 60 * 60 * 1000;

        try {
            await addDoc(collection(db, "avisos"), {
                mensaje: mensajeGeneral,
                categoria: categoriaGeneral,
                activo: true,
                fecha: serverTimestamp(),
                expiraEn: Date.now() + duracionMs,
                autor: "Guardia: " + (user?.nombre || "Oficial")
            });
            
            Swal.fire('¡Publicado!', 'Aviso añadido al tablero general.', 'success');
            setMensajeGeneral('');
        } catch (e) { 
            console.error(e);
            Swal.fire('Error', 'No se pudo publicar.', 'error'); 
        }
    };

    const eliminarAviso = async (id) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar aviso?',
            text: "Desaparecerá del banner de todos los usuarios.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e30613'
        });
        if (confirm.isConfirmed) {
            await deleteDoc(doc(db, "avisos", id));
            Swal.fire('Eliminado', 'El aviso fue retirado.', 'success');
        }
    };

    const handleLogout = async () => {
        if ((await Swal.fire({ title: '¿Cerrar Sesión?', showCancelButton: true, confirmButtonColor: '#e30613' })).isConfirmed) {
            await signOut(auth); navigate('/login');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.navHeader}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.logoTitle}>PoliParking <span className={styles.guardiaBadge}>GUARDIA</span></h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.userName}>{user?.nombre}</span>
                    <button className={styles.logoutBtn} onClick={handleLogout}><FaSignOutAlt /> Salir</button>
                </div>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <button className={`${styles.menuItem} ${activeTab === 'inicio' ? styles.active : ''}`} onClick={() => setActiveTab('inicio')}><FaUserShield /> Inicio</button>
                    <button className={`${styles.menuItem} ${activeTab === 'avisos' ? styles.active : ''}`} onClick={() => setActiveTab('avisos')}><FaBullhorn /> Avisos Generales</button>
                    <button className={`${styles.menuItem} ${activeTab === 'chats' ? styles.active : ''}`} onClick={() => setActiveTab('chats')}><FaComments /> Chats Privados</button>
                    <button className={`${styles.menuItem} ${activeTab === 'historial' ? styles.active : ''}`} onClick={() => setActiveTab('historial')}><FaHistory /> Actividad</button>
                </aside>

                <section className={styles.contentArea}>
                    {activeTab === 'inicio' && (
                        <div className={styles.dashboardGrid}>
                            <div className={styles.statCard}><FaCar className={styles.statIcon} /><h3>{stats.hoy}</h3><p>Vehículos en Campus</p></div>
                            <div className={styles.statCard} onClick={() => setActiveTab('avisos')}><FaBullhorn className={styles.statIcon} /><h3>Anunciar</h3><p>Publicar Aviso</p></div>
                            <div className={styles.statCard} onClick={() => setActiveTab('chats')}><FaComments className={styles.statIcon} /><h3>Chat</h3><p>Mensajería Privada</p></div>
                        </div>
                    )}

                    {activeTab === 'avisos' && (
                        <div className={styles.avisosControlPanel}>
                            <div className={styles.avisosContainer}>
                                <h2>📢 Tablón de Anuncios General</h2>
                                <div className={styles.categoryGrid}>
                                    {CATEGORIAS_GENERALES.map(cat => (
                                        <div key={cat.id} className={`${styles.catCard} ${categoriaGeneral === cat.id ? styles.catActive : ''}`}
                                             onClick={() => setCategoriaGeneral(cat.id)} style={{borderColor: categoriaGeneral === cat.id ? cat.color : 'transparent'}}>
                                            <div className={styles.catIcon} style={{color: cat.color}}>{cat.icon}</div>
                                            <h4>{cat.label}</h4>
                                        </div>
                                    ))}
                                </div>
                                <textarea className={styles.textAreaGeneral} value={mensajeGeneral} onChange={(e) => setMensajeGeneral(e.target.value)} placeholder="Escriba el comunicado para la comunidad..." />
                                <button className={styles.btnPublicar} onClick={publicarAvisoGeneral} style={{backgroundColor: CATEGORIAS_GENERALES.find(c=>c.id === categoriaGeneral)?.color}}>
                                    <FaPaperPlane /> Publicar Aviso Ahora
                                </button>
                            </div>

                            <div className={styles.historialAvisos}>
                                <h3>📋 Avisos Activos en el Sistema</h3>
                                <div className={styles.avisosGridList}>
                                    {avisosActivos.map(a => {
                                        const colorCat = CATEGORIAS_GENERALES.find(c => c.id === a.categoria)?.color || '#0a3d62';
                                        return (
                                            <div key={a.id} className={styles.avisoMiniCard} style={{ borderLeftColor: colorCat }}>
                                                <div className={styles.avisoMiniInfo}>
                                                    <strong style={{ color: colorCat, backgroundColor: colorCat + '15' }}>
                                                        {a.categoria?.toUpperCase() || 'AVISO'}
                                                    </strong>
                                                    <p>{a.mensaje}</p>
                                                    <small>⏱️ Expira en: {calcularRestante(a.expiraEn)}</small>
                                                </div>
                                                <button onClick={() => eliminarAviso(a.id)} className={styles.btnTrash}><FaTrash /></button>
                                            </div>
                                        );
                                    })}
                                    {avisosActivos.length === 0 && <p className={styles.emptyMsg}>No hay avisos publicados actualmente.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chats' && <div style={{height: '100%'}}><ModuleChatGuardia /></div>}
                </section>
            </main>
        </div>
    );
};

export default DashboardGuardia;