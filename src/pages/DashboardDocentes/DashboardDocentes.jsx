import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config.js'; 
import { signOut } from 'firebase/auth';

import UserInfo from '../../components/shared/UserInfo/UserInfo';
import ParkingMap from '../../components/shared/ParkingMap/ParkingMap';
import BookingForm from '../../components/shared/BookingForm/BookingForm';
import ReservationCard from '../../components/shared/ReservationCard/ReservationCard';
import ChatFlotante from '../../components/shared/ChatFlotante/ChatFlotante';
import styles from "./DashboardDocentes.module.css";

const DashboardDocente = ({ user }) => {
    const navigate = useNavigate();
    const today = new Date();
    const fechaHoy = today.toLocaleDateString('en-CA');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fechaManana = tomorrow.toLocaleDateString('en-CA');

    // 🔥 1. ESTADO INDEPENDIENTE
    const [docenteData, setDocenteData] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    const [reservaForm, setReservaForm] = useState({
        lugar: 'Edificio CEC', fecha: fechaHoy, hora: "", espacio: null
    });
    
    const [reservasTotales, setReservasTotales] = useState([]);
    const [misReservas, setMisReservas] = useState([]);
    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50, "Zona Docentes": 20 };

    // 🔥 2. EFECTO DE CARGA DE DATOS (Auto-suficiencia)
    useEffect(() => {
        const fetchDatosDocente = async () => {
            if (!user?.email) return;
            try {
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    setDocenteData({ ...user, ...data });
                } else {
                    setDocenteData(user);
                }
            } catch (error) {
                console.error("Error cargando perfil:", error);
                setDocenteData(user);
            } finally {
                setLoadingData(false);
            }
        };
        fetchDatosDocente();
    }, [user]);

    // 🔥 3. EFECTO DE RESERVAS
    useEffect(() => {
        if (!docenteData?.email) return; 

        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        const qMia = query(collection(db, "reservas"), where("usuario", "==", docenteData.email));
        const unsubMia = onSnapshot(qMia, (s) => {
            setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        
        return () => { unsubMapa(); unsubMia(); };
    }, [reservaForm.fecha, reservaForm.lugar, docenteData]);

    // 🔥 4. LÓGICA DE AUTO-LIMPIEZA (Vigencia de 24 Horas)
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(async () => {
            const ahora = new Date();
            for (const res of misReservas) {
                const [anio, mes, dia] = res.fecha.split('-').map(Number);
                const [h, m] = res.hora.split(':').map(Number);
                const tReserva = new Date(anio, mes - 1, dia, h, m);
                // Límite: Hora de reserva + 24 horas
                const tExpiracion = new Date(tReserva.getTime() + (24 * 60 * 60 * 1000));

                if (ahora > tExpiracion) {
                    await deleteDoc(doc(db, "reservas", res.id));
                }
            }
        }, 60000); // Revisa cada minuto
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- FUNCIONES AUXILIARES ---
    const handleFormChange = (n) => {
        if (n.hora) {
            const [h, m] = n.hora.split(':').map(Number);
            const horaDecimal = h + m / 60;
            // Regla: 6:00 AM a 9:00 PM
            if (horaDecimal < 6.0 || horaDecimal > 21.0) {
                Swal.fire('Horario Docente', 'El acceso es permitido únicamente de 6:00 AM a 9:00 PM.', 'warning');
                return setReservaForm({ ...n, hora: "" });
            }
        }
        setReservaForm(n);
    };

    const handleReserva = async (e) => {
        e.preventDefault();
        
        // Regla: 2 hoy y 2 mañana (Total 4)
        const hoyCount = misReservas.filter(r => r.fecha === fechaHoy).length;
        const mananaCount = misReservas.filter(r => r.fecha === fechaManana).length;

        if (reservaForm.fecha === fechaHoy && hoyCount >= 2) {
            return Swal.fire('Límite Diario', 'Ya tienes 2 reservas para el día de hoy.', 'info');
        }
        if (reservaForm.fecha === fechaManana && mananaCount >= 2) {
            return Swal.fire('Límite Diario', 'Ya tienes 2 reservas para el día de mañana.', 'info');
        }
        
        try {
            await addDoc(collection(db, "reservas"), {
                ...reservaForm, 
                usuario: docenteData.email, 
                nombre: docenteData.nombre || 'Docente', 
                placa: docenteData.placa || 'PENDIENTE',
                rol: 'docente',
                timestamp: new Date()
            });
            Swal.fire('¡Éxito!', 'Reserva confirmada por 24 horas.', 'success');
            setReservaForm(prev => ({...prev, espacio: null}));
        } catch (error) { Swal.fire('Error', 'No se pudo reservar.', 'error'); }
    };

    const cancelarReserva = async (id) => {
        const r = await Swal.fire({ title: '¿Liberar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' });
        if (r.isConfirmed) await deleteDoc(doc(db, "reservas", id));
    };

    const handleLogout = () => { 
        Swal.fire({ title: '¿Salir?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' })
            .then(async (r) => { if (r.isConfirmed) { await signOut(auth); navigate('/login'); } });
    };

    const generarTicketDocente = (data) => {
        const docPDF = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });
        const azulEPN = "#0a3d62";
        const doradoDetalle = "#f1c40f";

        docPDF.setDrawColor(azulEPN); docPDF.setLineWidth(2); docPDF.rect(2, 2, 76, 156); 
        docPDF.setFont("helvetica", "bold"); docPDF.setFontSize(10); docPDF.setTextColor(azulEPN);
        docPDF.text("ESCUELA POLITÉCNICA NACIONAL", 40, 12, { align: "center" });
        docPDF.setFontSize(8); docPDF.text("POLIPARKING - CONTROL DE ACCESO", 40, 17, { align: "center" });
        docPDF.setDrawColor(doradoDetalle); docPDF.setLineWidth(0.8); docPDF.line(10, 22, 70, 22);

        docPDF.setFontSize(14); docPDF.text("TICKET DOCENTE", 40, 32, { align: "center" });

        docPDF.setFontSize(10); docPDF.setTextColor("#334155");
        let y = 80;
        docPDF.text(`Docente: ${data.nombre}`, 12, y); y += 8;
        docPDF.text(`Placa: ${data.placa}`, 12, y); y += 8;
        docPDF.text(`Fecha: ${data.fecha}`, 12, y); y += 8;
        docPDF.text(`Hora: ${data.hora}`, 12, y); y += 8;
        docPDF.text(`Vigencia: 24 HORAS`, 12, y); y += 8;

        docPDF.setFillColor("#0a3d62"); docPDF.rect(10, y + 2, 60, 15, "F"); 
        docPDF.setTextColor("#ffffff"); docPDF.setFontSize(13);
        docPDF.text(`PUESTO: #${data.espacio}`, 40, y + 11, { align: "center" });

        docPDF.save(`Ticket_Docente_${data.placa}.pdf`);
    };

    if (loadingData || !docenteData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0a3d62', fontSize: '1.5rem', flexDirection: 'column' }}>
                <p>Cargando perfil docente...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}> 
            <div className={styles.fixedBackground}></div>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoContainer}><span className={styles.logoIcon}>🎓</span><h1 className={styles.logoText}>POLI<span>PARKING</span></h1></div>
                    <div className={styles.roleTag}>Docente</div>
                </div>
                <div className={styles.headerCenter}><span className={styles.dateBadge}>📅 {fechaHoy}</span></div>
                <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión 🚫</button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <UserInfo user={docenteData} />
                    <div className={styles.alertBanner}>🚗 Reservas: 2 Hoy / 2 Mañana</div>
                    {misReservas.length < 4 && (
                        <div className={styles.formCardCompact}>
                            <BookingForm 
                                form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES}
                                esDocente={true} fechas={{ hoy: fechaHoy, max: fechaManana }} onSubmit={handleReserva}
                            >
                                <button className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} onClick={handleReserva} disabled={!reservaForm.espacio || !reservaForm.hora}>
                                    {!reservaForm.hora ? "⏰ Hora" : `✅ Reservar #${reservaForm.espacio}`}
                                </button>
                            </BookingForm>
                        </div>
                    )}
                    <div className={styles.reservationScrollArea}>
                        {misReservas.map(res => (
                            <div key={res.id} className={styles.activeReservation}>
                                <div className={styles.ticketHeader}><h3>Reserva</h3><span>#{res.espacio}</span></div>
                                <div className={styles.ticketContent}>
                                    <ReservationCard 
                                        reserva={res} 
                                        onDownload={() => generarTicketDocente(res)} 
                                        onDelete={() => cancelarReserva(res.id)} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
                <section className={styles.mapArea}>
                    <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} columnas={10} />
                </section>
            </main>
            <ChatFlotante userEmail={docenteData?.email} />
        </div>
    );
};

export default DashboardDocente;