import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
// 🔥 Agregamos 'getDocs' para poder buscar los datos nosotros mismos
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

    // 🔥 1. ESTADO INDEPENDIENTE (Igual que el invitado)
    // Esto evita que dependamos de si el Contexto cargó rápido o lento
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
                // Buscamos en la colección 'usuarios' quien tenga este email
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // ¡Datos encontrados! Los guardamos en nuestro estado local
                    const data = querySnapshot.docs[0].data();
                    setDocenteData({ ...user, ...data });
                } else {
                    // Si falla, usamos lo básico que tengamos
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

    // 🔥 3. EFECTO DE RESERVAS (Ahora depende de 'docenteData', no de 'user')
    useEffect(() => {
        // Si todavía no tenemos los datos cargados, esperamos
        if (!docenteData?.email) return; 

        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        const qMia = query(collection(db, "reservas"), where("usuario", "==", docenteData.email));
        const unsubMia = onSnapshot(qMia, (s) => {
            setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        
        return () => { unsubMapa(); unsubMia(); };
    }, [reservaForm.fecha, reservaForm.lugar, docenteData]);

    // --- FUNCIONES AUXILIARES (Usan docenteData) ---
    const handleFormChange = (n) => setReservaForm(n);
    const validarTiempoDocente = (h) => h; // (Aquí iría tu lógica de validación de hora)

    const handleReserva = async (e) => {
        e.preventDefault();
        if (misReservas.length >= 4) return Swal.fire('Límite', 'Máximo 4 reservas.', 'warning');
        
        try {
            await addDoc(collection(db, "reservas"), {
                ...reservaForm, 
                // Usamos docenteData que es seguro que tiene los datos
                usuario: docenteData.email, 
                nombre: docenteData.nombre || 'Docente', 
                placa: docenteData.placa || 'PENDIENTE',
                rol: 'docente',
                timestamp: new Date()
            });
            Swal.fire('¡Éxito!', 'Reserva confirmada.', 'success');
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
    // 1. Inicializar el documento
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 160]
    });

    // 2. Definir Colores (Esto evita el error de descarga)
    const azulEPN = "#0a3d62";
    const doradoDetalle = "#f1c40f";
    const grisTexto = "#334155";

    // --- DISEÑO DE MARCO Y BORDES ---
    doc.setDrawColor(azulEPN);
    doc.setLineWidth(2);
    doc.rect(2, 2, 76, 156); 

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(azulEPN);
    doc.text("ESCUELA POLITÉCNICA NACIONAL", 40, 12, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("POLIPARKING - CONTROL DE ACCESO", 40, 17, { align: "center" });

    // Línea divisoria dorada
    doc.setDrawColor(doradoDetalle);
    doc.setLineWidth(0.8);
    doc.line(10, 22, 70, 22);

    // --- TÍTULO CENTRAL ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(azulEPN);
    doc.text("TICKET DOCENTE", 40, 32, { align: "center" });

    // --- ICONO REPRESENTATIVO (DIBUJADO VECTORIAL) ---
    doc.setFillColor("#f8fafc");
    doc.roundedRect(25, 38, 30, 30, 5, 5, "F");

    // Birrete dibujado para evitar fallos de emoji
    doc.setFillColor(azulEPN);
    doc.triangle(40, 42, 52, 48, 40, 54, "F");
    doc.triangle(40, 42, 28, 48, 40, 54, "F");
    doc.rect(34, 52, 12, 4, "F");
    doc.setDrawColor(doradoDetalle);
    doc.setLineWidth(1);
    doc.line(50, 48, 52, 56); 

    // --- BLOQUE DE INFORMACIÓN ---
    doc.setFontSize(10);
    doc.setTextColor(grisTexto);
    let yPos = 80;
    const info = [
        { label: "Docente:", value: data.nombre },
        { label: "Placa:", value: data.placa },
        { label: "Fecha:", value: data.fecha },
        { label: "Hora Ingreso:", value: data.hora || "06:30 AM" },
        { label: "Tiempo:", value: "SIN LÍMITE" }
    ];

    info.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.label, 12, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(item.value), 38, yPos);
        yPos += 8;
    });

// --- CAJA UNIFICADA COMPACTA ---

    doc.setFillColor("#0a3d62");
    doc.rect(10, yPos + 2, 60, 15, "F"); 
    doc.setTextColor("#ffffff");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(data.lugar.toUpperCase(), 40, yPos + 7, { align: "center" });
    doc.setFontSize(13);
    doc.text(`PUESTO: #${data.espacio}`, 40, yPos + 13, { align: "center" });

    // --- PIE DE PÁGINA ---
    doc.setTextColor("#64748b");
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡Gracias por su labor educativa!", 40, 145, { align: "center" });
    doc.setDrawColor("#cbd5e1");
    doc.setLineDash([1, 1], 0);
    doc.line(5, 150, 75, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("COMPROBANTE VÁLIDO DE ESTACIONAMIENTO", 40, 155, { align: "center" });
    doc.save(`Ticket_Docente_${data.placa}.pdf`);
};

    // 🔥 4. PANTALLA DE CARGA (Vital para evitar pantalla blanca)
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
                    <div className={styles.logoContainer}>
                        <span className={styles.logoIcon}>🎓</span>
                        <h1 className={styles.logoText}>POLI<span>PARKING</span></h1>
                    </div>
                    <div className={styles.roleTag}>Docente</div>
                </div>
                <div className={styles.headerCenter}>
                    <span className={styles.dateBadge}>📅 {fechaHoy}</span>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión 🚫</button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    {/* Renderizamos usando los datos seguros */}
                    <UserInfo user={docenteData} />
                    
                    <div className={styles.alertBanner}>🚗 Reservas: Hoy y Mañana</div>

                    {misReservas.length < 4 && (
                        <div className={styles.formCardCompact}>
                            <BookingForm 
                                form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES}
                                esDocente={true} fechas={{ hoy: fechaHoy, max: fechaManana }} onSubmit={handleReserva}
                            >
                                <button 
                                    className={`${styles.btnReservar} ${(!reservaForm.espacio || !reservaForm.hora) ? styles.disabled : ''}`} 
                                    onClick={handleReserva}
                                    disabled={!reservaForm.espacio || !reservaForm.hora}
                                >
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
                    <ParkingMap 
                        lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} 
                        ocupados={reservasTotales} seleccionado={reservaForm.espacio} 
                        onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} columnas={10} 
                    />
                </section>
            </main>
            <ChatFlotante userEmail={docenteData?.email} />
        </div>
    );
};

export default DashboardDocente;