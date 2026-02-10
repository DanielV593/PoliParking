import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; // 1. Importamos la función de salir
import { db, auth } from '../../firebase/config.js'; // 2. Importamos 'auth'
import { useNavigate } from 'react-router-dom'; // 3. Para redirigir
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

import UserInfo from '../DashboardUser/components/UserInfo.jsx';
import ParkingMap from '../DashboardUser/components/ParkingMap.jsx';
import BookingForm from '../DashboardUser/components/BookingForm.jsx';
import ReservationCard from '../DashboardUser/components/ReservationCard.jsx';

import './DashboardEstudiantes.css'; 

const DashboardEstudiantes = ({ user }) => {
    // Hooks de navegación
    const navigate = useNavigate();

    const LUGARES_PERMITIDOS = ["Edificio CEC"]; 
    const CAPACIDADES = { "Edificio CEC": 100 };
    const HORA_APERTURA = 6.5; 
    const HORA_CIERRE = 20.5;

    const [reservasTotales, setReservasTotales] = useState([]);
    const [miReserva, setMiReserva] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    const fechaHoy = new Date().toLocaleDateString('en-CA'); 

    const [reservaForm, setReservaForm] = useState({
        lugar: LUGARES_PERMITIDOS[0], 
        fecha: fechaHoy,
        hora: "",
        espacio: null
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));

        const qMia = query(collection(db, "reservas"), where("usuario", "==", user.email));
        const unsubMia = onSnapshot(qMia, (s) => {
            setMiReserva(s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() });
        });

        return () => { window.removeEventListener('resize', handleResize); unsubMapa(); unsubMia(); };
    }, [reservaForm.fecha, reservaForm.lugar, user.email]);

    const validarHoraEstudiante = (horaStr) => {
    if (!horaStr) return "";

    const [h, m] = horaStr.split(':').map(Number);
    const horaDecimal = h + m / 60;
    if (horaDecimal < HORA_APERTURA || horaDecimal >= HORA_CIERRE) {
        Swal.fire({
            title: 'Horario no permitido',
            text: 'El parqueadero solo opera de 06:30 AM a 08:30 PM.',
            icon: 'warning',
            confirmButtonColor: '#0a3d62'
        });
        return "";
    }

    const ahora = new Date();
    const hoyISO = ahora.toLocaleDateString('en-CA'); 

    if (reservaForm.fecha === hoyISO) {
        const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);
        

        if (horaDecimal < (horaActualDecimal - 0.08)) {
            Swal.fire({
                title: 'Hora inválida',
                text: 'No puedes reservar en un horario que ya pasó.',
                icon: 'error',
                confirmButtonColor: '#0a3d62'
            });
            return "";
        }
    }

    return horaStr;
};

    const handleFormChange = (newData) => {
    if (newData.hora !== reservaForm.hora) {
        const horaOk = validarHoraDocente(newData.hora);
        setReservaForm({ ...newData, hora: horaOk });
    } else {
        setReservaForm(newData);
    }
};

    const handleReserva = async (e) => {
        e.preventDefault();
        if (miReserva) return Swal.fire('Límite', 'Solo puedes tener 1 reserva activa.', 'warning');
        if (!reservaForm.hora) return Swal.fire('Atención', 'Por favor, selecciona una hora de llegada.', 'info');
        if (!reservaForm.espacio) return Swal.fire('Mapa', 'Selecciona un puesto en el mapa.', 'info');

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
        } catch (error) { Swal.fire('Error', 'No se pudo reservar', 'error'); }
    };

    const generarTicket = (reserva) => {
        const doc = new jsPDF({ format: [80, 160], unit: 'mm' });
        doc.text("POLIPARKING - TICKET", 40, 20, { align: 'center' });
        doc.save("Ticket.pdf");
    };

    const cancelarReserva = async () => {
        if(miReserva) await deleteDoc(doc(db, "reservas", miReserva.id));
    };

    // --- FUNCIÓN DE CERRAR SESIÓN REAL ---
    const handleLogout = () => { 
    Swal.fire({
        title: '¿Cerrar Sesión?',
        text: "¿Estás seguro que deseas salir del sistema?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0a3d62', // Azul Institucional
        cancelButtonColor: '#e30613', // Rojo para el botón cancelar
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        background: '#ffffff', // Fondo de la tarjeta limpio
        // Eliminamos el 'backdrop' azul personalizado
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await signOut(auth);
                navigate('/login');
                
                const Toast = Swal.mixin({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
                });
                Toast.fire({ icon: 'success', title: '¡Hasta pronto!' });

            } catch (error) {
                console.error("Error al salir:", error);
            }
        }
    });
};

return (
        <div className="dashboard-estudiante-container">
            {/* HEADER */}
            <header className="estudiante-header">
                <div className="header-left">
                    <div className="logo-container">
                        <span className="logo-icon">🚗</span>
                        <h1 className="logo-text">POLI<span>PARKING</span></h1>
                    </div>
                </div>

                <div className="header-center">
                    <span className="date-badge">
                        📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>

                <button className="logout-btn-custom" onClick={handleLogout}>
                    Cerrar Sesión 🚫
                </button>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <div className="main-container">
                {/* LADO IZQUIERDO: Perfil y Formulario */}
                <div className="sidebar">
                    <UserInfo user={user} />
                    
                    <div className="alert-estudiante">
                        🎓 <b>Horario:</b> 06:30 AM - 08:30 PM
                    </div>

                    {!miReserva ? (
                        <div className="card">
                            <h3 style={{color:'#0a3d62', marginBottom:'15px'}}>Nueva Reserva</h3>
                            <BookingForm 
                                form={reservaForm} setForm={handleFormChange} capacidades={CAPACIDADES}
                                lugaresPermitidos={LUGARES_PERMITIDOS} onSubmit={handleReserva}
                                fechas={{ hoy: fechaHoy, max: fechaHoy }}
                            >
                                <button 
    className={`btn-reservar ${(!reservaForm.espacio || !reservaForm.hora) ? 'disabled' : ''}`} 
    onClick={handleReserva}
    disabled={!reservaForm.espacio || !reservaForm.hora}
    style={{ marginTop: '15px', width: '100%' }}
>
    {!reservaForm.hora 
        ? "⏰ Seleccione la hora de llegada" 
        : !reservaForm.espacio 
            ? "👆 Seleccione un puesto en el mapa" 
            : `✅ CONFIRMAR PUESTO #${reservaForm.espacio}`
    }
</button>
                            </BookingForm>
                        </div>
                    ) : (
                        <div className="ticket-wrapper">
                            <div className="ticket-header-visual">
                                <h3 className="ticket-title">Reserva Confirmada</h3>
                            </div>
                            <div className="ticket-body" style={{padding: '20px'}}>
                                <ReservationCard 
                                    reserva={miReserva} 
                                    onDownload={() => generarTicket(miReserva)} 
                                    onDelete={cancelarReserva} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* LADO DERECHO: Mapa */}
                <div className="map-container-wrapper">
                    <div className="map-header">
                        <h2 className="card-title">📍 Mapa de Disponibilidad: {reservaForm.lugar}</h2>
                    </div>
                    <ParkingMap 
                        lugar={reservaForm.lugar} 
                        capacidad={CAPACIDADES[reservaForm.lugar]} 
                        ocupados={reservasTotales} 
                        seleccionado={reservaForm.espacio} 
                        onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} 
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardEstudiantes;