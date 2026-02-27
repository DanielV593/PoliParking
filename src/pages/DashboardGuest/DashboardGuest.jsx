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
import ChatFlotante from '../../components/shared/ChatFlotante/ChatFlotante';
import styles from './DashboardGuest.module.css';

const generarTicketPDF = (data) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });
    const azulEPN = "#0a3d62";
    const doradoDetalle = "#f1c40f";

    doc.setDrawColor(azulEPN);
    doc.setLineWidth(2);
    doc.rect(2, 2, 76, 156); 

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(azulEPN);
    doc.text("ESCUELA POLITÉCNICA NACIONAL", 40, 12, { align: "center" });
    
    doc.setFontSize(8);
    doc.text("POLIPARKING - PASE DE VISITANTE", 40, 17, { align: "center" });

    doc.setDrawColor(doradoDetalle);
    doc.setLineWidth(0.8);
    doc.line(10, 22, 70, 22);

    doc.setFontSize(14);
    doc.text("TICKET INVITADO", 40, 32, { align: "center" });

    // Cálculo de hora de salida para el PDF
    const [h, m] = data.hora.split(':').map(Number);
    const horaSalida = `${String((h + 3) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    doc.setFontSize(9);
    doc.setTextColor("#334155");
    let yPos = 78;
    const info = [
        { label: "Visita:", value: data.nombre },
        { label: "Placa:", value: data.placa },
        { label: "Fecha:", value: data.fecha },
        { label: "Entrada:", value: data.hora },
        { label: "Salida Máx:", value: horaSalida },
        { label: "Estancia:", value: "3 HORAS" }
    ];

    info.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.label, 12, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.value), 35, yPos);
        yPos += 6.5; 
    });

    doc.setFillColor("#0a3d62");
    doc.rect(10, yPos + 2, 60, 15, "F"); 
    doc.setTextColor("#ffffff");
    doc.text(`PUESTO: #${data.espacio}`, 40, yPos + 11, { align: "center" });

    doc.save(`Ticket_Invitado_${data.placa}.pdf`);
};

const DashboardGuest = () => {
    const navigate = useNavigate();
    const HORA_APERTURA = 7.0;
    const HORA_CIERRE = 18.0;
    const [userData, setUserData] = useState(null);
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const fechaHoy = new Date().toLocaleDateString('en-CA'); 
    
    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', fecha: fechaHoy, hora: "", espacio: null 
    });

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    // 🔥 NUEVA FUNCIÓN: Liberación automática tras 3 horas
    useEffect(() => {
        if (misReservas.length === 0) return;

        const interval = setInterval(async () => {
            const ahora = new Date();
            for (const res of misReservas) {
                const [h, m] = res.hora.split(':').map(Number);
                const tReserva = new Date();
                tReserva.setHours(h, m, 0);
                
                // Tiempo límite = Hora de entrada + 3 horas
                const tExpiracion = new Date(tReserva.getTime() + (3 * 60 * 60 * 1000));

                if (ahora > tExpiracion) {
                    await deleteDoc(doc(db, "reservas", res.id));
                    Swal.fire('Sesión Expirada', 'Su tiempo de 3 horas ha terminado. El puesto ha sido liberado.', 'info');
                }
            }
        }, 60000); // Revisa cada minuto

        return () => clearInterval(interval);
    }, [misReservas]);

    const validarTiempoInvitado = (horaStr) => {
        if (!horaStr) return "";
        const [h, m] = horaStr.split(':').map(Number);
        const horaDecimal = h + m / 60;
        const ahora = new Date();
        const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);

        if (horaDecimal < (horaActualDecimal - 0.05)) {
            Swal.fire('Error', 'No puedes reservar en el pasado.', 'error');
            return "";
        }
        if (horaDecimal < HORA_APERTURA || horaDecimal >= HORA_CIERRE) {
            Swal.fire('Cerrado', 'El horario es de 07:00 AM a 06:00 PM.', 'warning');
            return "";
        }
        return horaStr;
    };

    const handleFormChange = (newData) => {
        if (newData.hora !== reservaForm.hora) {
            const horaOk = validarTiempoInvitado(newData.hora);
            setReservaForm({ ...newData, hora: horaOk, fecha: fechaHoy });
        } else {
            setReservaForm({ ...newData, fecha: fechaHoy });
        }
    };

    useEffect(() => {
        const guest = JSON.parse(localStorage.getItem('guestData'));
        if (guest || localStorage.getItem('userRole') === 'invitado') {
            setUserData(guest || { nombre: 'Invitado', placa: 'VISITA', rol: 'invitado' });
        } else {
            navigate('/login');
        }
        setLoading(false);
    }, [navigate]);

    useEffect(() => {
        if (!userData?.placa) return; 
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", fechaHoy), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        const qMias = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("rol", "==", "invitado"));
        const unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.lugar, userData, fechaHoy]);

    const handleReserva = async (e) => {
        e.preventDefault();
        const q = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("fecha", "==", fechaHoy));
        const existe = await getDocs(q);
        
        if (!existe.empty) return Swal.fire('Atención', 'Solo una reserva diaria para invitados.', 'info');
        if (!reservaForm.hora || !reservaForm.espacio) return Swal.fire('Aviso', 'Completa los datos.', 'info');

        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, usuario: 'guest_' + userData.placa, rol: 'invitado', 
                nombre: userData.nombre, placa: userData.placa, timestamp: new Date()
            });
            Swal.fire('¡Éxito!', 'Tienes un máximo de 3 horas.', 'success');
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta de nuevo.', 'error'); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('¡Hecho!', 'Espacio libre.', 'success');
        }
    };

    if (loading || !userData) return <div className="loading">Cargando...</div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.fixedBackground}></div>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoContainer}><span className={styles.logoIcon}>🅿️</span><h1 className={styles.logoText}>POLI<span>PARKING</span></h1></div>
                    <div className={styles.roleTag}>Invitado</div>
                </div>
                <button className={styles.logoutBtn} onClick={() => { localStorage.removeItem('guestData'); navigate('/'); }}>Salir 🚫</button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <UserInfo user={userData} />
                    <div className={styles.alertBanner}>🕒 Estancia Máxima: 3 Horas</div>
                    {!misReservas.length ? (
                        <div className={styles.formCard}>
                            <BookingForm form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES} fechas={{ hoy: fechaHoy, max: fechaHoy }} onSubmit={handleReserva}>
                                <button className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} onClick={handleReserva} disabled={!reservaForm.espacio || !reservaForm.hora}>
                                    {!reservaForm.hora ? "⏰ Elija la hora" : `✅ CONFIRMAR #${reservaForm.espacio}`}
                                </button>
                            </BookingForm>
                        </div>
                    ) : (
                        <div className={styles.activeReservation}>
                            {misReservas.map(res => <ReservationCard key={res.id} reserva={res} onDownload={() => generarTicketPDF(res)} onDelete={() => liberarPuesto(res.id)} />)}
                        </div>
                    )}
                </aside>
                <section className={styles.mapArea}>
                    <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} columnas={10} />
                </section>
            </main>
            <ChatFlotante userEmail={userData.email || ('guest_' + userData.placa)} />
        </div>
    );
};

export default DashboardGuest;