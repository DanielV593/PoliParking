import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase/config.js';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

import UserInfo from '../../components/shared/UserInfo/UserInfo.jsx';
import BookingForm from '../../components/shared/BookingForm/BookingForm.jsx';
import ParkingMap from "../../components/shared/ParkingMap/ParkingMap.jsx";
import ReservationCard from "../../components/shared/ReservationCard/ReservationCard.jsx";
import ChatFlotante from "../../components/shared/ChatFlotante/ChatFlotante.jsx";
import styles from "./DashboardEstudiantes.module.css";

// --- FUNCIONES DE APOYO ---
const validarHorarioCompleto = (horaStr, fechaElegida) => {
    if (!horaStr) return { valido: false, msg: "" };
    const ahora = new Date();
    const [h, m] = horaStr.split(':').map(Number);
    const horaDecimal = h + m / 60;
    const hoyISO = ahora.toLocaleDateString('en-CA');

    if (horaDecimal < 6.5 || horaDecimal > 20.5) return { valido: false, msg: 'Atención de 6:30 AM a 8:30 PM.' };
    if (fechaElegida === hoyISO) {
        const tRes = new Date(); tRes.setHours(h, m, 0);
        if (tRes < ahora) return { valido: false, msg: 'No puedes reservar en el pasado.' };
    }
    return { valido: true };
};

const generarTicket = (reserva) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });
    const azulEPN = "#0a3d62";
    const dorado = "#f1c40f";

    pdf.setDrawColor(azulEPN); pdf.setLineWidth(2); pdf.rect(2, 2, 76, 156);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(azulEPN);
    pdf.text("ESCUELA POLITÉCNICA NACIONAL", 40, 12, { align: "center" });
    pdf.setDrawColor(dorado); pdf.setLineWidth(0.8); pdf.line(10, 22, 70, 22);
    pdf.setFontSize(14); pdf.text("TICKET ESTUDIANTE", 40, 32, { align: "center" });

    const [h, m] = reserva.hora.split(':').map(Number);
    const horaSalida = `${String((h + 8) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    pdf.setFontSize(9); pdf.setTextColor("#334155");
    let y = 78;
    const info = [
        { l: "Nombre:", v: reserva.nombre }, { l: "Placa:", v: reserva.placa },
        { l: "Fecha:", v: reserva.fecha }, { l: "Entrada:", v: reserva.hora },
        { l: "Salida:", v: horaSalida }, { l: "Estancia:", v: "8 HORAS" }
    ];

    info.forEach(i => {
        pdf.setFont("helvetica", "bold"); pdf.text(i.l, 12, y);
        pdf.setFont("helvetica", "normal"); pdf.text(String(i.v), 35, y);
        y += 6.5;
    });

    pdf.setFillColor(azulEPN); pdf.rect(10, y + 2, 60, 15, "F");
    pdf.setTextColor("#ffffff"); pdf.setFontSize(13);
    pdf.text(`PUESTO: #${reserva.espacio}`, 40, y + 11, { align: "center" });
    pdf.save(`Ticket_Estudiante_${reserva.placa}.pdf`);
};

const DashboardEstudiantes = ({ user }) => {
    const navigate = useNavigate();
    const LUGARES = ["Edificio CEC"];
    const CAPACIDADES = { "Edificio CEC": 100 };
    const fechaHoy = new Date().toLocaleDateString('en-CA');

    const [reservasTotales, setReservasTotales] = useState([]);
    const [miReserva, setMiReserva] = useState(null);
    const [reservaForm, setReservaForm] = useState({ lugar: LUGARES[0], fecha: fechaHoy, hora: "", espacio: null });

    // 🔥 1. AUTO-LIMPIEZA (8 HORAS)
    useEffect(() => {
        if (!miReserva) return;
        const interval = setInterval(async () => {
            const ahora = new Date();
            const [h, m] = miReserva.hora.split(':').map(Number);
            const [anio, mes, dia] = miReserva.fecha.split('-').map(Number);
            const tExpiracion = new Date(anio, mes - 1, dia, h + 8, m);

            if (ahora > tExpiracion) {
                await deleteDoc(doc(db, "reservas", miReserva.id));
                Swal.fire('Estancia Finalizada', 'Tu tiempo de 8 horas terminó y el puesto se liberó.', 'info');
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [miReserva]);

    // 🔥 2. ESCUCHA DE FIREBASE
    useEffect(() => {
        const unsubMapa = onSnapshot(query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar)), (s) => setReservasTotales(s.docs.map(d => d.data())));
        const unsubMia = onSnapshot(query(collection(db, "reservas"), where("usuario", "==", user.email)), (s) => {
            setMiReserva(s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() });
        });
        return () => { unsubMapa(); unsubMia(); };
    }, [reservaForm.fecha, reservaForm.lugar, user.email]);

    // 🔥 3. FUNCIÓN DE SALIDA (LA QUE FALTABA)
    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: "¿Estás seguro que deseas salir del sistema?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#e30613',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                navigate('/login');
            }
        });
    };

    const handleFormChange = (newData) => {
        if (newData.hora && newData.hora !== reservaForm.hora) {
            const check = validarHorarioCompleto(newData.hora, newData.fecha);
            if (!check.valido) { Swal.fire('Error', check.msg, 'warning'); setReservaForm({ ...newData, hora: "" }); }
            else setReservaForm(newData);
        } else setReservaForm(newData);
    };

    const handleReserva = async (e) => {
        e.preventDefault();
        if (miReserva) return Swal.fire('Límite', 'Ya tienes una reserva activa.', 'warning');
        if (!reservaForm.hora || !reservaForm.espacio) return Swal.fire('Aviso', 'Completa los datos.', 'info');

        if ((await Swal.fire({ title: '¿Reservar?', text: `Puesto #${reservaForm.espacio}`, icon: 'question', showCancelButton: true })).isConfirmed) {
            try {
                await addDoc(collection(db, "reservas"), { ...reservaForm, usuario: user.email, nombre: user.nombre, placa: user.placa, rol: 'estudiante', timestamp: new Date() });
                Swal.fire('¡Éxito!', 'Puesto reservado.', 'success');
                setReservaForm(prev => ({ ...prev, espacio: null }));
            } catch (e) { Swal.fire('Error', 'No se pudo reservar.', 'error'); }
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.fixedBackground}></div>
            
            {/* --- HEADER PREMIUM CENTRADO --- */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoContainer}>
                        <span className={styles.logoIcon}>🏎️</span>
                        <h1 className={styles.logoText}>POLI<span>PARKING</span></h1>
                    </div>
                    <div className={styles.roleTag}>Estudiante</div>
                </div>

                <div className={styles.headerCenter}>
                    <span className={styles.dateBadge}>
                        📅 {new Date().toISOString().split('T')[0]}
                    </span>
                </div>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    Cerrar Sesión 🚫
                </button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <UserInfo user={user} />
                    <div className={styles.alertBanner}>🎓 Horario: 06:30 AM - 08:30 PM</div>
                    {!miReserva ? (
                        <div className={styles.formCard}>
                            <BookingForm form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES} lugaresPermitidos={LUGARES} onSubmit={handleReserva} fechas={{ hoy: fechaHoy, max: fechaHoy }}>
                                <button className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} disabled={!reservaForm.espacio || !reservaForm.hora}>
                                    {!reservaForm.hora ? "⏰ Elige Hora" : `✅ Reservar #${reservaForm.espacio}`}
                                </button>
                            </BookingForm>
                        </div>
                    ) : (
                        <div className={styles.activeReservation}>
                            <div className={styles.ticketHeader}><h3>Reserva</h3><span>#{miReserva.espacio}</span></div>
                            <ReservationCard reserva={miReserva} onDownload={() => generarTicket(miReserva)} onDelete={async () => { if ((await Swal.fire({ title: '¿Liberar?', showCancelButton: true })).isConfirmed) await deleteDoc(doc(db, "reservas", miReserva.id)); }} />
                        </div>
                    )}
                </aside>
                <section className={styles.mapArea}>
                    <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} columnas={10} />
                </section>
            </main>
            <ChatFlotante userEmail={user.email} />
        </div>
    );
};

export default DashboardEstudiantes;