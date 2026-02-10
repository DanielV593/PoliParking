import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config.js'; 

import UserInfo from '../DashboardUser/components/UserInfo';
import ParkingMap from '../DashboardUser/components/ParkingMap';
import BookingForm from '../DashboardUser/components/BookingForm';
import ReservationCard from '../DashboardUser/components/ReservationCard';
import './DashboardGuest.css';

const DashboardGuest = () => {
    const navigate = useNavigate();
    
    // Datos fijos del invitado (Simulados o desde LocalStorage)
    const [userData, setUserData] = useState({ 
        nombre: 'Invitado', 
        placa: 'VISITA', 
        rol: 'invitado' 
    });

    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    // REGLA 1: Solo fecha de HOY
    const today = new Date();
    const fechaHoy = today.toLocaleDateString('en-CA'); 
    
    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', 
        fecha: fechaHoy, // Bloqueado
        hora: "", 
        espacio: null 
    });

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    // --- EFECTOS ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const guestData = JSON.parse(localStorage.getItem('guestData'));
        if (!guestData) {
            Swal.fire({ title: 'Acceso Denegado', text: 'Debes registrarte primero.', icon: 'error', confirmButtonColor: '#0a3d62' });
            navigate('/'); 
        } else {
            setUserData({ ...guestData, rol: 'invitado' });
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        // Monitoreo del mapa general
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        // Monitoreo de MIS reservas (por placa)
        let unsubMias = () => {};
        if (userData.placa) {
            const qMias = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("rol", "==", "invitado"));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, userData.placa]);

    // REGLA 2: Límite de 3 Horas (Temporizador)
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicio = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const fin = inicio + (3 * 60 * 60 * 1000); // 3 Horas exactas
                
                if (ahora >= fin) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Tiempo Terminado', `Tu visita en el puesto #${reserva.espacio} ha finalizado.`, 'info');
                }
            });
        }, 60000); 
        return () => clearInterval(interval);
    }, [misReservas]);

    // REGLA 3: Horario 07:00 - 19:00
    const validarHora = (horaSeleccionada) => {
        if (!horaSeleccionada) return "";
        const [h, m] = horaSeleccionada.split(':').map(Number);
        const horaDecimal = h + m / 60;
        const ahora = new Date();
        const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);

        if (horaDecimal < 7 || horaDecimal >= 19) {
            Swal.fire('Cerrado', 'Atención de 07:00 AM a 07:00 PM.', 'warning'); return ""; 
        }
        // No viajar al pasado (con 15 min gracia)
        if (horaDecimal < (horaActualDecimal - 0.25)) {
            Swal.fire('Hora inválida', 'Esa hora ya pasó.', 'warning'); return "";
        }
        return horaSeleccionada;
    };

    const handleFormChange = (newData) => {
        if (newData.hora !== reservaForm.hora) {
            const horaValidada = validarHora(newData.hora);
            setReservaForm({ ...newData, hora: horaValidada });
        } else {
            setReservaForm({ ...newData, fecha: fechaHoy }); // Fuerza fecha hoy
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: '¿Terminar Visita?', text: 'Se borrarán tus datos.', icon: 'question',
            showCancelButton: true, confirmButtonColor: '#e30613', cancelButtonColor: '#0a3d62', confirmButtonText: 'Sí, salir'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('guestData');
                navigate('/');
            }
        });
    };

    const handleReserva = async (e) => {
        e.preventDefault();
        if (!reservaForm.hora) return Swal.fire('Falta Hora', 'Selecciona una hora válida.', 'warning');
        if (misReservas.length > 0) return Swal.fire('Límite', 'Solo puedes tener 1 visita activa.', 'warning');
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');

        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, 
                usuario: 'guest_' + userData.placa, 
                rol: 'invitado', 
                nombre: userData.nombre, 
                placa: userData.placa,
                timestamp: new Date()
            });
            
            Swal.fire({ title: '¡Reserva Exitosa!', text: 'Tienes 3 horas de parqueo.', icon: 'success', confirmButtonColor: '#0a3d62' });
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta de nuevo.', 'error'); }
    };

    const generarTicketGuest = (reserva) => {
        const docPDF = new jsPDF({ format: [80, 160], unit: 'mm' });
        docPDF.setFontSize(14); docPDF.text("PASE DE VISITANTE", 40, 20, { align: 'center' });
        docPDF.setFontSize(10);
        docPDF.text(`Visita: ${reserva.nombre}`, 10, 40);
        docPDF.text(`Placa: ${reserva.placa}`, 10, 50);
        docPDF.text(`Hora: ${reserva.hora}`, 10, 60);
        docPDF.setFontSize(16); docPDF.text(`PUESTO: ${reserva.espacio}`, 40, 80, { align: 'center' });
        docPDF.save(`Ticket_Visita_${reserva.placa}.pdf`);
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', text: 'Terminarás tu visita.', showCancelButton: true, confirmButtonColor: '#e30613' })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', 'Gracias por tu visita.', 'success');
        }
    };

    if (loading) return <div className="spinner-container">Cargando...</div>;

    return (
        <>
            <div className="fixed-background"></div>
            <div className="dashboard-guest-container">
                <header className="guest-header">
                    <div className="header-left">
                        <div className="logo-container">
                            <span className="logo-icon">🅿️</span>
                            <h1 className="logo-text">POLI<span>PARKING</span></h1>
                        </div>
                        <div className="header-divider"></div>
                        <div className="header-subtitle">Portal de Invitados</div>
                    </div>
                    <div className="header-center">
                        <span className="date-badge">📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <button className="logout-btn-custom" onClick={handleLogout}>
                        <span className="btn-text">Cerrar Sesión</span> <span className="btn-icon">🚫</span>
                    </button>
                </header>

                <div className={`main-container ${isMobile ? 'mobile' : ''}`}>
                    <div className="sidebar" style={{width: isMobile ? '100%' : '350px'}}>
                        
                        {/* Wrapper para el nombre visible (Azul sobre Blanco) */}
                        <div style={{ color: '#0a3d62', marginBottom: '15px' }}>
                            <UserInfo user={userData} />
                        </div>

                        <div className="alert-guest">⚠️ Horario: 07:00 AM - 07:00 PM (Máx 3 Horas)</div>

                        {/* Formulario (Texto Blanco sobre Azul) */}
                        <div>
                            {misReservas.length === 0 ? (
                                <BookingForm 
                                    form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES}
                                    esDocente={false} fechas={{ hoy: fechaHoy, max: fechaHoy }}
                                    onSubmit={handleReserva}
                                >
                                    {/* BOTÓN DE RESERVA MANUAL AÑADIDO */}
                                    <button 
                                        className={`btn-reservar ${!reservaForm.espacio ? 'disabled' : ''}`} 
                                        onClick={handleReserva}
                                        disabled={!reservaForm.espacio}
                                        style={{ marginTop: '15px', width: '100%' }}
                                    >
                                        {!reservaForm.espacio 
                                            ? "👆 Selecciona un puesto en el mapa" 
                                            : `✅ CONFIRMAR RESERVA PUESTO #${reservaForm.espacio}`
                                        }
                                    </button>

                                    {isMobile && <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(prev => ({...prev, espacio: n}))} isMobile={true} />}
                                </BookingForm>
                            ) : (
                                <div className="card" style={{marginTop:'20px'}}>
                                    <h4 className="card-title">Tu Pase Activo</h4>
                                    {misReservas.map(res => (
                                        <ReservationCard key={res.id} reserva={res} onDownload={() => generarTicketGuest(res)} onDelete={() => liberarPuesto(res.id)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {!isMobile && (
                        <div style={{flex:1}}>
                            <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(prev => ({...prev, espacio: n}))} isMobile={false} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DashboardGuest;