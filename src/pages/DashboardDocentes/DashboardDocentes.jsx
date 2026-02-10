import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config.js'; 
import { signOut } from 'firebase/auth';

import UserInfo from '../DashboardUser/components/UserInfo.jsx';
import ParkingMap from '../DashboardUser/components/ParkingMap.jsx';
import BookingForm from '../DashboardUser/components/BookingForm.jsx';
import ReservationCard from '../DashboardUser/components/ReservationCard.jsx';
import './DashboardDocentes.css';

const DashboardDocente = ({ user }) => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    
    // REGLA 1: Docente reserva toda la semana
    const today = new Date();
    const fechaHoy = today.toLocaleDateString('en-CA');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fechaManana = tomorrow.toLocaleDateString('en-CA');

    const [reservaForm, setReservaForm] = useState({
        lugar: 'Edificio CEC', 
        fecha: fechaHoy, 
        hora: "", 
        espacio: null
    });
    

    const validarHoraDocente = (horaStr) => {
        if (!horaStr) return "";
        const [h, m] = horaStr.split(':').map(Number);
        const horaDecimal = h + m / 60;

        if (horaDecimal < 6.5 || horaDecimal >= 20.5) {
            Swal.fire('Horario Institucional', 'El parqueadero solo opera de 06:30 AM a 08:30 PM.', 'warning');
            return "";
        }

    const ahora = new Date();
        if (reservaForm.fecha === ahora.toLocaleDateString('en-CA')) {
            const ahoraDec = ahora.getHours() + (ahora.getMinutes() / 60);
            if (horaDecimal < ahoraDec) {
                Swal.fire('Error', 'No puede reservar en una hora que ya pasó.', 'error');
                return "";
            }
        }
        return horaStr;
    };


    const [reservasTotales, setReservasTotales] = useState([]);
    const [misReservas, setMisReservas] = useState([]);

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50, "Zona Docentes": 20 };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        const qMia = query(collection(db, "reservas"), where("usuario", "==", user.email));
        const unsubMia = onSnapshot(qMia, (s) => {
            setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubMapa(); unsubMia(); };
    }, [reservaForm.fecha, reservaForm.lugar, user.email]);

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?', text: '¡Gracias por su labor docente!', icon: 'question',
            showCancelButton: true, confirmButtonColor: '#e30613', cancelButtonColor: '#0a3d62', confirmButtonText: 'Sí, salir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                navigate('/login');
            }
        });
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
        // REGLA: Máximo 2 reservaciones
        if (misReservas.length >= 2) {
            return Swal.fire('Límite Alcanzado', 'Como docente, puede tener hasta 2 reservas activas (Hoy/Mañana).', 'info');
        }
        if (!reservaForm.hora) return Swal.fire('Atención', 'Seleccione la hora de llegada.', 'info');
        if (!reservaForm.espacio) return Swal.fire('Mapa', 'Seleccione un puesto.', 'warning');
        
        try {
            await addDoc(collection(db, "reservas"), {
                ...reservaForm, 
                usuario: user.email, 
                nombre: user.nombre, 
                placa: user.placa, 
                rol: 'docente',
                timestamp: new Date()
            });
            Swal.fire('¡Éxito!', 'Reserva confirmada. No tiene límite de tiempo dentro del horario laboral.', 'success');
            setReservaForm(prev => ({...prev, espacio: null}));
        } catch (error) { Swal.fire('Error', 'No se pudo completar la reserva.', 'error'); }
    };

    const cancelarReserva = async (id) => {
        if((await Swal.fire({ title: '¿Liberar Puesto?', text: 'Quedará disponible para otros colegas.', showCancelButton: true, confirmButtonColor: '#e30613' })).isConfirmed){
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', 'Puesto disponible.', 'success');
        }
    };

    const generarTicketDocente = (data) => {
        const docPDF = new jsPDF({ format: [80, 160], unit: 'mm' });
        docPDF.setFontSize(16); docPDF.text("POLIPARKING", 40, 20, { align: 'center' });
        docPDF.setFontSize(10); docPDF.text("DOCENTE / PERSONAL", 40, 30, { align: 'center' });
        docPDF.text(`Docente: ${data.nombre}`, 10, 50);
        docPDF.text(`Fecha: ${data.fecha}`, 10, 60);
        docPDF.setFontSize(14); docPDF.text(`PUESTO: ${data.espacio}`, 40, 80, { align: 'center' });
        docPDF.save(`Ticket_Docente_${data.fecha}.pdf`);
    };

    return (
    <>
        <div className="fixed-background-docente"></div>
        <div className="dashboard-docente-container">
            <header className="docente-header">
                <div className="header-left">
                    <div className="logo-container">
                        <span className="logo-icon">🅿️</span>
                        <h1 className="logo-text">POLI<span>PARKING</span></h1>
                    </div>
                    <div className="header-divider"></div>
                    <div className="header-subtitle">Portal Docente</div>
                </div>
                <div className="header-center">
                    <span className="date-badge">🎓 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <button className="logout-btn-custom" onClick={handleLogout}>
                    <span className="btn-text">Cerrar Sesión</span> <span className="btn-icon">🚫</span>
                </button>
            </header>

            <div className={`main-container ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar" style={{width: isMobile ? '100%' : '350px'}}>
                    
                    <UserInfo user={user} />
                    
                    <div className="alert-docente">🌟 Reservas Hoy y Mañana (Máx. 2)</div>

                    {/* Mostramos el formulario solo si el docente tiene menos de 2 reservas */}
                    {misReservas.length < 2 ? (
                        <div className="card">
                            <BookingForm 
                                form={reservaForm} 
                                setForm={handleFormChange} 
                                capacidades={CAPACIDADES}
                                esDocente={true} 
                                fechas={{ hoy: fechaHoy, max: fechaManana }} // 🔥 Solo Hoy y Mañana
                                onSubmit={handleReserva}
                            >
                                <button 
                                    className={`btn-reservar ${(!reservaForm.espacio || !reservaForm.hora) ? 'disabled' : ''}`} 
                                    onClick={handleReserva}
                                    disabled={!reservaForm.espacio || !reservaForm.hora}
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    {!reservaForm.hora 
                                        ? "⏰ Elija la hora" 
                                        : !reservaForm.espacio 
                                            ? "🅿️ Elija puesto en el mapa" 
                                            : `✅ CONFIRMAR PUESTO #${reservaForm.espacio}`
                                    }
                                </button>
                                {isMobile && <ParkingMap lugar={reservaForm.lugar} capacidad={CAPACIDADES[reservaForm.lugar]} ocupados={reservasTotales} seleccionado={reservaForm.espacio} onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} isMobile={true} />}
                            </BookingForm>
                        </div>
                    ) : (
                        <div className="card" style={{textAlign: 'center', background: '#fff3cd', color: '#856404'}}>
                            ⚠️ Ha alcanzado el límite de 2 reservas permitidas.
                        </div>
                    )}

                    {/* 🔥 Listado de Reservas Activas (Hoy/Mañana) */}
                    {misReservas.length > 0 && (
    <div className="reservation-list-container" style={{marginTop: '20px'}}>
        <h4 style={{color: '#0a3d62', marginBottom: '10px', fontSize: '1.1rem'}}>
            Mis Reservas Activas:
        </h4>
        {misReservas.map(reserva => (
            <div key={reserva.id} className="reservation-card-custom">
                <ReservationCard 
                    reserva={reserva} 
                    onDownload={() => generarTicketDocente(reserva)} 
                    onDelete={() => cancelarReserva(reserva.id)} 
                />
            </div>
        ))}
    </div>
)}
                </div>

                {!isMobile && (
                    <div style={{flex:1}}>
                        <ParkingMap 
                            lugar={reservaForm.lugar} 
                            capacidad={CAPACIDADES[reservaForm.lugar]} 
                            ocupados={reservasTotales} 
                            seleccionado={reservaForm.espacio} 
                            onSelect={(n) => setReservaForm(p => ({...p, espacio: n}))} 
                            isMobile={false} 
                        />
                    </div>
                )}
            </div>
        </div>
    </>
);
}
export default DashboardDocente;