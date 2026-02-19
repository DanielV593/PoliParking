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


// --- FUNCIONES DE APOYO (Lógica de Tiempo) ---

const validarHorarioCompleto = (horaStr, fechaElegida) => {
    if (!horaStr) return { valido: false, msg: "" };

    const ahora = new Date();
    const [h, m] = horaStr.split(':').map(Number);
    const horaDecimal = h + m / 60;
    const hoyISO = ahora.toLocaleDateString('en-CA');

    // 1. Rango permitido: 06:30 AM a 08:30 PM
    if (horaDecimal < 6.5 || horaDecimal > 20.5) {
        return { valido: false, msg: 'El PoliParking atiende de 6:30 AM a 8:30 PM.' };
    }

    // 2. No viajar al pasado (si reserva para hoy)
    if (fechaElegida === hoyISO) {
        const fechaReserva = new Date();
        fechaReserva.setHours(h, m, 0);
        if (fechaReserva < ahora) {
            return { valido: false, msg: 'No puedes reservar una hora que ya pasó.' };
        }
    }

    return { valido: true };
};

const obtenerAvisoCierre = (horaStr) => {
    const [h, m] = horaStr.split(':').map(Number);
    const totalMin = h * 60 + m;
    const cierreMin = 20 * 60 + 30; // 8:30 PM
    const resta = cierreMin - totalMin;

    if (resta > 0 && resta <= 120) {
        const horas = Math.floor(resta / 60);
        const mins = resta % 60;
        return `⚠️ ¡Atención! Solo te quedan ${horas > 0 ? horas + 'h y ' : ''}${mins}min antes del cierre.`;
    }
    return null;
};

const DashboardEstudiantes = ({ user }) => {
    const navigate = useNavigate();

    // --- CONFIGURACIÓN ---
    const LUGARES_PERMITIDOS = ["Edificio CEC"];
    const CAPACIDADES = { "Edificio CEC": 100 };
    const fechaHoy = new Date().toLocaleDateString('en-CA');

    // --- ESTADOS ---
    const [reservasTotales, setReservasTotales] = useState([]);
    const [miReserva, setMiReserva] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    const [reservaForm, setReservaForm] = useState({
        lugar: LUGARES_PERMITIDOS[0],
        fecha: fechaHoy,
        hora: "",
        espacio: null
    });

    // --- EFECTOS ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);

        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));

        const qMia = query(collection(db, "reservas"), where("usuario", "==", user.email));
        const unsubMia = onSnapshot(qMia, (s) => {
            setMiReserva(s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() });
        });

        return () => { 
            window.removeEventListener('resize', handleResize); 
            unsubMapa(); 
            unsubMia(); 
        };
    }, [reservaForm.fecha, reservaForm.lugar, user.email]);

    // --- HANDLERS ---
    const handleFormChange = (newData) => {
        if (newData.hora !== reservaForm.hora && newData.hora !== "") {
            const chequeo = validarHorarioCompleto(newData.hora, newData.fecha);
            
            if (!chequeo.valido) {
                Swal.fire('Horario no válido', chequeo.msg, 'warning');
                setReservaForm({ ...newData, hora: "" });
            } else {
                setReservaForm(newData);
            }
        } else {
            setReservaForm(newData);
        }
    };

    const handleReserva = async (e) => {
        e.preventDefault();
        if (miReserva) return Swal.fire('Límite', 'Solo puedes tener 1 reserva activa.', 'warning');
        if (!reservaForm.hora) return Swal.fire('Atención', 'Selecciona una hora de llegada.', 'info');
        if (!reservaForm.espacio) return Swal.fire('Mapa', 'Selecciona un puesto en el mapa.', 'info');

        const avisoCierre = obtenerAvisoCierre(reservaForm.hora);

        const confirmacion = await Swal.fire({
            title: '¿Confirmar puesto?',
            html: avisoCierre ? `<p style="color:#e30613; font-weight:bold;">${avisoCierre}</p><p>¿Deseas continuar?</p>` : `Vas a reservar el puesto #${reservaForm.espacio}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            confirmButtonText: 'Sí, reservar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            try {
                await addDoc(collection(db, "reservas"), {
                    ...reservaForm,
                    usuario: user.email,
                    nombre: user.nombre,
                    placa: user.placa,
                    rol: 'estudiante',
                    timestamp: new Date()
                });
                Swal.fire('¡Reserva Exitosa!', `Puesto ${reservaForm.espacio} reservado.`, 'success');
                setReservaForm(prev => ({ ...prev, espacio: null }));
            } catch (error) { 
                Swal.fire('Error', 'No se pudo procesar la reserva.', 'error'); 
            }
        }
    };

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

    const cancelarReserva = async () => {
        const result = await Swal.fire({
            title: '¿Liberar tu puesto?',
            text: `Se cancelará tu reserva en el ${miReserva.lugar}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#e30613',
            confirmButtonText: 'Sí, liberar'
        });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "reservas", miReserva.id));
            Swal.fire('Puesto liberado', '', 'success');
        }
    };

const generarTicket = (reserva) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 160]
    });


    const azulEPN = "#0a3d62";
    const doradoDetalle = "#f1c40f";


    // --- DISEÑO DE MARCO Y BORDES ---
    doc.setDrawColor(azulEPN);
    doc.setLineWidth(2);
    doc.rect(2, 2, 76, 156); // Marco azul institucional



    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(azulEPN);
    doc.text("ESCUELA POLITÉCNICA NACIONAL", 40, 12, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("POLIPARKING - CONTROL DE ACCESO", 40, 17, { align: "center" });



    // Línea dorada debajo del encabezado
    doc.setDrawColor(doradoDetalle);
    doc.setLineWidth(0.8);
    doc.line(10, 22, 70, 22);



    // --- TÍTULO CENTRAL ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(azulEPN);
    doc.text("TICKET ESTUDIANTE", 40, 32, { align: "center" });



    // --- ICONO REPRESENTATIVO ---
    doc.setFillColor("#f8fafc");
    doc.roundedRect(25, 38, 30, 30, 5, 5, "F");
    doc.setFillColor(azulEPN);
    doc.triangle(40, 42, 52, 48, 40, 54, "F");
    doc.triangle(40, 42, 28, 48, 40, 54, "F");
    doc.rect(34, 52, 12, 4, "F");
    doc.setDrawColor("#f1c40f");
    doc.setLineWidth(1);
    doc.line(50, 48, 52, 56);


// --- BLOQUE DE INFORMACIÓN COMPACTO ---
    doc.setFontSize(9); // Bajamos un punto el tamaño para ahorrar espacio
    doc.setTextColor("#334155");
    let yPos = 78; // Subimos la posición inicial
    const [h, m] = reserva.hora.split(':').map(Number);
    const horaSalida = `${String((h + 8) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const info = [
        { label: "Nombre:", value: reserva.nombre },
        { label: "Placa:", value: reserva.placa },
        { label: "Fecha:", value: reserva.fecha },
        { label: "Entrada:", value: reserva.hora },
        { label: "Salida:", value: horaSalida },
        { label: "Estancia:", value: "8 HORAS" }
    ];


    info.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.label, 12, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.value), 35, yPos);
        yPos += 6.5; // Interlineado más apretado (antes 8 o 7)
    });


    // --- CAJA UNIFICADA COMPACTA ---
    doc.setFillColor("#0a3d62");
    doc.rect(10, yPos + 2, 60, 15, "F"); // Altura reducida a 15mm
    doc.setTextColor("#ffffff");
    doc.setFontSize(8);
    doc.text(reserva.lugar.toUpperCase(), 40, yPos + 7, { align: "center" });
    doc.setFontSize(13); // Tamaño de puesto ligeramente menor para que quepa bien
    doc.text(`PUESTO: #${reserva.espacio}`, 40, yPos + 13, { align: "center" });

    // --- PIE DE TICKET ---
    doc.setTextColor("#64748b");
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡La Poli es tu segundo hogar!", 40, 145, { align: "center" });
    doc.setDrawColor("#cbd5e1");
    doc.setLineDash([1, 1], 0);
    doc.line(5, 150, 75, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("VALIDE ESTE TICKET AL INGRESAR", 40, 155, { align: "center" });
    doc.save(`Ticket_Estudiante_${reserva.placa}.pdf`);
};

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.fixedBackground}></div>
            
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
                        📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    Cerrar Sesión <span>🚫</span>
                </button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <UserInfo user={user} />
                    
                    <div className={styles.alertBanner}>
                        🎓 <b>Horario:</b> 06:30 AM - 08:30 PM
                    </div>

                    {!miReserva ? (
                        <div className={styles.formCard}>
                            <BookingForm 
                                form={reservaForm} 
                                setForm={handleFormChange} 
                                capacidades={CAPACIDADES}
                                lugaresPermitidos={LUGARES_PERMITIDOS} 
                                onSubmit={handleReserva}
                                fechas={{ hoy: fechaHoy, max: fechaHoy }}
                            >
                                <button 
                                    className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} 
                                    onClick={handleReserva}
                                    disabled={!reservaForm.espacio || !reservaForm.hora}
                                >
                                    {!reservaForm.hora 
                                        ? "⏰ Seleccione la hora" 
                                        : !reservaForm.espacio 
                                            ? "👆 Elija un puesto" 
                                            : `✅ CONFIRMAR PUESTO #${reservaForm.espacio}`
                                    }
                                </button>
                            </BookingForm>
                        </div>
                    ) : (
                        <div className={styles.activeReservation}>
                            <div className={styles.ticketHeader}>
                                <h3>Reserva Confirmada</h3>
                                <span>PoliParking EPN</span>
                            </div>
                            <div className={styles.ticketContent}>
                                <ReservationCard 
                                    reserva={miReserva} 
                                    onDownload={() => generarTicket(miReserva)} 
                                    onDelete={cancelarReserva} 
                                />
                            </div>
                        </div>
                    )}
                </aside>

                <section className={styles.mapArea}>
                    <ParkingMap 
                        lugar={reservaForm.lugar} 
                        capacidad={CAPACIDADES[reservaForm.lugar]} 
                        ocupados={reservasTotales} 
                        seleccionado={reservaForm.espacio} 
                        onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} 
                        columnas={10} 
                    />
                </section>
            </main>
            <ChatFlotante userEmail={user.email} />
        </div>
    );
};

export default DashboardEstudiantes;