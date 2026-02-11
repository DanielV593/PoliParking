import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config.js'; 

import UserInfo from '../../components/shared/UserInfo/UserInfo';
import ParkingMap from '../../components/shared/ParkingMap/ParkingMap';
import BookingForm from '../../components/shared/BookingForm/BookingForm';
import ReservationCard from '../../components/shared/ReservationCard/ReservationCard';
import styles from './DashboardGuest.module.css';

const generarTicketPDF = (data, tipoUsuario) => {
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
    doc.text("POLIPARKING - PASE DE VISITANTE", 40, 17, { align: "center" });

    // Línea dorada
    doc.setDrawColor(doradoDetalle);
    doc.setLineWidth(0.8);
    doc.line(10, 22, 70, 22);

    // --- TÍTULO CENTRAL ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(azulEPN);
    doc.text("TICKET INVITADO", 40, 32, { align: "center" });

    // --- ICONO REPRESENTATIVO ---
    doc.setFillColor("#f8fafc");
    doc.roundedRect(25, 38, 30, 30, 5, 5, "F");
    doc.setFillColor(azulEPN);
    doc.circle(40, 48, 4, "F");
    doc.ellipse(40, 58, 8, 5, "F");

// --- BLOQUE DE INFORMACIÓN COMPACTO ---
    doc.setFontSize(9);
    let yPos = 78;

    const [h, m] = data.hora.split(':').map(Number);
    const horaSalida = `${String((h + 3) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const info = [
        { label: "Visita:", value: data.nombre },
        { label: "Placa:", value: data.placa },
        { label: "Fecha:", value: data.fecha },
        { label: "Entrada:", value: data.hora },
        { label: "Salida:", value: horaSalida },
        { label: "Estancia:", value: "3 HORAS" }
    ];

    info.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.label, 12, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.value), 35, yPos);
        yPos += 6.5; 
    });

    // --- CAJA UNIFICADA COMPACTA ---
    doc.setFillColor("#0a3d62");
    doc.rect(10, yPos + 2, 60, 15, "F"); 
    doc.setTextColor("#ffffff");
    doc.setFontSize(8);
    doc.text(data.lugar.toUpperCase(), 40, yPos + 7, { align: "center" });
    doc.setFontSize(13);
    doc.text(`PUESTO: #${data.espacio}`, 40, yPos + 13, { align: "center" });

    // --- PIE DE TICKET ---
    doc.setTextColor("#64748b");
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡Gracias por visitarnos!", 40, 145, { align: "center" });

    doc.setDrawColor("#cbd5e1");
    doc.setLineDash([1, 1], 0);
    doc.line(5, 150, 75, 150);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("COMPROBANTE VÁLIDO DE ESTACIONAMIENTO", 40, 155, { align: "center" });

    doc.save(`Ticket_Invitado_${data.placa}.pdf`);
};

const DashboardGuest = () => {
    const navigate = useNavigate();
    const HORA_APERTURA = 7.0; // 07:00 AM
    const HORA_CIERRE = 18.0;  // 06:00 PM
    const [userData, setUserData] = useState(null);
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const fechaHoy = new Date().toLocaleDateString('en-CA'); 
    
    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', fecha: fechaHoy, hora: "", espacio: null 
    });

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    // 🔥 VALIDACIÓN DE TIEMPO (Lógica principal)
    const validarTiempoInvitado = (horaStr) => {
        if (!horaStr) return "";
        const [h, m] = horaStr.split(':').map(Number);
        const horaDecimal = h + m / 60;
        
        const ahora = new Date();
        const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);

        // 1. No viajar al pasado
        if (horaDecimal < (horaActualDecimal - 0.05)) {
            Swal.fire('Hora inválida', 'No puedes reservar en una hora que ya pasó.', 'error');
            return "";
        }

        // 2. Horario funcional Invitados (7am - 6pm)
        if (horaDecimal < HORA_APERTURA || horaDecimal >= HORA_CIERRE) {
            Swal.fire('Horario de Visitas', 'El acceso para invitados es de 07:00 AM a 06:00 PM.', 'warning');
            return "";
        }

        // 3. Aviso de cierre próximo
        const tiempoRestante = HORA_CIERRE - horaDecimal;
        if (tiempoRestante > 0 && tiempoRestante <= 1.5) { // 90 min antes
            const min = Math.round(tiempoRestante * 60);
            Swal.fire({
                title: 'Tiempo de Visita Limitado',
                html: `La universidad cierra en <b>${min} min</b>.<br/>Recuerda que solo tienes 3 horas máximo.`,
                icon: 'warning',
                confirmButtonColor: '#0a3d62'
            });
        }
        return horaStr;
    };

    const handleFormChange = (newData) => {
        // Validamos la hora antes de permitir que se guarde en el estado
        if (newData.hora !== reservaForm.hora) {
            const horaOk = validarTiempoInvitado(newData.hora);
            setReservaForm({ ...newData, hora: horaOk, fecha: fechaHoy });
        } else {
            setReservaForm({ ...newData, fecha: fechaHoy });
        }
    };

    // --- MANEJO DE SESIÓN Y FIREBASE ---
    useEffect(() => {
        try {
            const guestData = JSON.parse(localStorage.getItem('guestData'));
            // También revisamos si viene del login unificado (userRole)
            const role = localStorage.getItem('userRole');

            if (guestData || role === 'invitado') {
                // Si hay datos, los usamos. Si no, usamos unos por defecto o pedimos login
                setUserData(guestData || { nombre: 'Invitado', placa: 'VISITA', rol: 'invitado' });
            } else {
                // Si no hay rastro de invitado, al login
                navigate('/login');
            }
        } catch (error) {
            console.error(error);
            navigate('/login');
        } finally {
            setLoading(false); // Siempre terminamos de cargar
        }
    }, [navigate]);

    useEffect(() => {
    // 🔥 ESTA ES LA CURA MÁGICA: El signo de interrogación (?.)
    // Le dice a React: "Si userData es null, NO intentes leer la placa y detente".
    if (!userData?.placa) return; 
    
    const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
    const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
    
    // Aquí también usamos userData.placa con seguridad
    const qMias = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("rol", "==", "invitado"));
    const unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsubMapa(); unsubMias(); };
    
}, [reservaForm.fecha, reservaForm.lugar, userData]);
    const handleReserva = async (e) => {
        e.preventDefault();
        
        // 1. Una sola reserva al día (verificación en DB)
        const qExistente = query(collection(db, "reservas"), 
            where("placa", "==", userData.placa), 
            where("fecha", "==", fechaHoy)
        );
        const docExistente = await getDocs(qExistente);
        
        if (!docExistente.empty) {
            return Swal.fire('Límite Diario', 'Solo se permite una reserva por día para invitados.', 'info');
        }

        if (!reservaForm.hora) return Swal.fire('Aviso', 'Primero elige la hora de tu visita.', 'info');
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');

        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, usuario: 'guest_' + userData.placa, rol: 'invitado', 
                nombre: userData.nombre, placa: userData.placa, timestamp: new Date()
            });
            Swal.fire({ title: '¡Reserva Exitosa!', text: 'Recuerda: Tienes un máximo de 3 horas.', icon: 'success', confirmButtonColor: '#0a3d62' });
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta de nuevo.', 'error'); }
    };

    const handleLogout = () => { 
        Swal.fire({
            title: '¿Terminar Visita?',
            text: "Se borrarán tus datos temporales.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#e30613',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('guestData');
                navigate('/');
            }
        });
    };

    const liberarPuesto = async (id) => {
        const result = await Swal.fire({ 
            title: '¿Liberar Puesto?', 
            text: 'Tu lugar quedará disponible para otros invitados.', 
            icon: 'warning',
            showCancelButton: true, 
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#e30613',
            confirmButtonText: 'Sí, liberar',
            cancelButtonText: 'Mantener',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('¡Listo!', 'Espacio liberado.', 'success');
        }
    };

    if (loading || !userData) {
    return <div className="loading-screen">Cargando datos de invitado...</div>;
}
if (!userData) return null;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.fixedBackground}></div>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoContainer}>
                        <span className={styles.logoIcon}>🅿️</span>
                        <h1 className={styles.logoText}>POLI<span>PARKING</span></h1>
                    </div>
                    <div className={styles.roleTag}>Invitado</div>
                </div>
                <div className={styles.headerCenter}>
                    <span className={styles.dateBadge}>
                        📅 {new Date().toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                    })}
                    </span>
                </div>
                
                <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión 🚫</button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <UserInfo user={userData} />
                    <div className={styles.alertBanner}>🕒 Estancia Máxima: 3 Horas</div>
                    
                    {!misReservas.length ? (
                        <div className={styles.formCard}>
                            <BookingForm 
                                form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES} 
                                esDocente={false} fechas={{ hoy: fechaHoy, max: fechaHoy }} onSubmit={handleReserva}
                            >
                                <button 
                                    className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} 
                                    onClick={handleReserva} 
                                    disabled={!reservaForm.espacio || !reservaForm.hora}
                                >
                                    {!reservaForm.hora ? "⏰ Elija la hora" : !reservaForm.espacio ? "👆 Seleccione puesto" : `✅ CONFIRMAR #${reservaForm.espacio}`}
                                </button>
                            </BookingForm>
                        </div>
                    ) : (
                        <div className={styles.activeReservation}>
                            <div className={styles.ticketHeader}><h3>Pase de Invitado</h3></div>
                            {misReservas.map(res => (
                                <ReservationCard 
                                    key={res.id} 
                                    reserva={res} 
                                    onDownload={() => generarTicketPDF(res, 'invitado')} 
                                    onDelete={() => liberarPuesto(res.id)} 
                                />
                        ))}
                        </div>
                    )}
                </aside>
                <section className={styles.mapArea}>
                    <ParkingMap 
                        lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} 
                        ocupados={reservasTotales} seleccionado={reservaForm.espacio} 
                        onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} columnas={10} 
                    />
                </section>
            </main>
        </div>
    );
};

export default DashboardGuest;