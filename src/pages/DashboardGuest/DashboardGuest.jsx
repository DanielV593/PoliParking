/**
 * PÁGINA: DashboardGuest
 * PROPÓSITO: Panel exclusivo para invitados.
 * REGLAS DE NEGOCIO: 
 * 1. Solo pueden reservar para el día actual.
 * 2. Horario de atención: 07:00 AM - 07:00 PM (19:00).
 * 3. Tiempo máximo: 3 Horas o hasta el cierre.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config.js'; 

// --- IMPORTAMOS LOS COMPONENTES ---
// (Nota: Ya no importamos Navbar porque creamos uno personalizado aquí mismo)
import UserInfo from '../DashboardUser/components/UserInfo';
import ParkingMap from '../DashboardUser/components/ParkingMap';
import BookingForm from '../DashboardUser/components/BookingForm';
import ReservationCard from '../DashboardUser/components/ReservationCard';
import './DashboardGuest.css';

const DashboardGuest = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [userData, setUserData] = useState({ nombre: 'Invitado', placa: 'VISITA', rol: 'invitado' });
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    // CONFIGURACIÓN DE FECHA (SOLO HOY)
    const today = new Date();
    const fechaHoy = today.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
    
    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', 
        fecha: fechaHoy, // Bloqueado en hoy
        hora: "", // Obligamos a elegir
        espacio: null 
    });

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    // --- EFECTOS ---

    // 1. Detección Móvil
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Auth "Light" (LocalStorage)
    useEffect(() => {
        const guestData = JSON.parse(localStorage.getItem('guestData'));
        if (!guestData) {
            Swal.fire({
                title: 'Acceso Denegado',
                text: 'Debes registrarte como invitado primero.',
                icon: 'error',
                confirmButtonColor: '#0a3d62'
            });
            navigate('/'); 
        } else {
            setUserData({ ...guestData, rol: 'invitado' });
            setLoading(false);
        }
    }, [navigate]);

    // 3. Monitoreo Firebase
    useEffect(() => {
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        let unsubMias = () => {};
        if (userData.placa) {
            const qMias = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("rol", "==", "invitado"));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, userData.placa]);

    // 4. Temporizador (REGLA: 3 HORAS O CIERRE)
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicio = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const fin = inicio + (3 * 60 * 60 * 1000); // 3 Horas
                
                if (ahora >= fin) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Tiempo Terminado', `Tu visita en el puesto #${reserva.espacio} ha finalizado.`, 'info');
                }
            });
        }, 60000); 
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- LÓGICA DE TIEMPO INTELIGENTE 🧠 ---
    const validarHora = (horaSeleccionada) => {
        if (!horaSeleccionada) return "";

        const [h, m] = horaSeleccionada.split(':').map(Number);
        const horaDecimal = h + m / 60;
        
        // Obtenemos hora actual
        const ahora = new Date();
        const horaActualDecimal = ahora.getHours() + (ahora.getMinutes() / 60);

        // 1. REGLA: Horario de Atención (7 AM - 7 PM)
        if (horaDecimal < 7 || horaDecimal >= 19) {
            Swal.fire('Cerrado', 'El parqueadero atiende de 07:00 AM a 07:00 PM.', 'warning');
            return ""; 
        }

        // 2. REGLA: No viajar al pasado (con 15 min de gracia)
        if (horaDecimal < (horaActualDecimal - 0.15)) {
            Swal.fire('Hora inválida', 'Esa hora ya pasó.', 'warning');
            return "";
        }

        // 3. REGLA: Aviso de Cierre Próximo
        const tiempoRestante = 19 - horaDecimal;
        if (tiempoRestante < 3) {
            const horasQuedan = Math.floor(tiempoRestante);
            const minsQuedan = Math.round((tiempoRestante - horasQuedan) * 60);
            
            Swal.fire({
                title: '⚠️ Cierre Próximo',
                text: `El campus cierra a las 19:00. Solo tendrás ${horasQuedan}h ${minsQuedan}m de servicio.`,
                icon: 'info',
                confirmButtonColor: '#e30613'
            });
        }

        return horaSeleccionada;
    };

    const handleFormChange = (newData) => {
        // Si cambia la hora, validamos
        if (newData.hora !== reservaForm.hora) {
            const horaValidada = validarHora(newData.hora);
            setReservaForm({ ...newData, hora: horaValidada });
        } else {
            // Si intenta cambiar la fecha, la forzamos a HOY
            setReservaForm({ ...newData, fecha: fechaHoy });
        }
    };

    // --- ACCIONES ---

    const handleLogout = () => {
        Swal.fire({
            title: '¿Salir?',
            text: 'Se borrarán tus datos de sesión.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e30613',
            cancelButtonColor: '#0a3d62',
            confirmButtonText: 'Sí, salir'
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
        if (misReservas.length > 0) return Swal.fire('Límite', 'Solo puedes tener una reserva activa.', 'warning');
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');
        if (reservaForm.fecha !== fechaHoy) return Swal.fire('Error', 'Solo puedes reservar para hoy.', 'error');

        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, 
                usuario: 'guest_' + userData.placa, 
                rol: 'invitado', 
                nombre: userData.nombre, 
                placa: userData.placa
            });
            
            Swal.fire({
                title: '¡Reserva Exitosa!', 
                text: 'Tienes parqueo garantizado.', 
                icon: 'success',
                confirmButtonColor: '#0a3d62',
                confirmButtonText: 'Ticket'
            }).then((r) => {
                if(r.isConfirmed) generarTicketGuest({ ...reservaForm, ...userData });
            });
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta de nuevo.', 'error'); }
    };

    const generarTicketGuest = (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();
            
            const [horas, minutos] = reserva.hora.split(':').map(Number);
            
            // Calculamos salida: Mínimo entre (Hora+3) y (19:00)
            let horaSalidaNum = horas + (minutos/60) + 3;
            if (horaSalidaNum > 19) horaSalidaNum = 19; 
            
            const hSalida = Math.floor(horaSalidaNum);
            const mSalida = Math.round((horaSalidaNum - hSalida) * 60);
            const horaSalidaStr = `${hSalida.toString().padStart(2, '0')}:${mSalida.toString().padStart(2, '0')}`;

            docPDF.setFontSize(18); 
            docPDF.text("POLIPARKING", pageWidth / 2, 20, { align: 'center' });
            docPDF.setFontSize(10);
            docPDF.text("-- PASE DE INVITADO --", pageWidth / 2, 30, { align: 'center' });
            
            docPDF.text(`Visita: ${reserva.nombre}`, 10, 45);
            docPDF.text(`Placa: ${reserva.placa}`, 10, 55);
            docPDF.text(`Válido hasta: ${horaSalidaStr}`, 10, 75);
            docPDF.setTextColor(200, 0, 0);
            docPDF.text(horaSalidaNum >= 19 ? "(Cierre del Campus)" : "(Máximo 3 Horas)", 10, 80);
            
            docPDF.setFontSize(16);
            docPDF.setTextColor(0, 0, 0);
            docPDF.text(`PUESTO: ${reserva.espacio}`, pageWidth / 2, 100, { align: 'center' });
            
            docPDF.save(`Pase_Invitado_${reserva.placa}.pdf`);
        } catch (e) { console.error(e); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', text: 'Terminarás tu visita.', showCancelButton: true, confirmButtonColor: '#e30613' })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', 'Gracias por tu visita.', 'success');
        }
    };

    if (loading) return <div className="spinner-container">Verificando acceso...</div>;

    return (
        <div className="dashboard-guest-bg">
            
            {/* --- NUEVO HEADER PREMIUM --- */}
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
                    <span className="date-badge">
                        📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>

                <button className="logout-btn-custom" onClick={handleLogout}>
                    <span className="btn-text">Cerrar Sesión</span> 
                    <span className="btn-icon">🚫</span>
                </button>
            </header>

            <div className={`main-container ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar" style={{width: isMobile ? '100%' : '350px'}}>
                    
                    <UserInfo user={userData} />

                    <div className="alert-guest">
                        ⚠️ Horario: 07:00 AM - 07:00 PM
                    </div>

                    <BookingForm 
                        form={reservaForm}
                        setForm={handleFormChange} 
                        capacidades={CAPACIDADES}
                        esDocente={false}
                        fechas={{ hoy: fechaHoy, max: fechaHoy }}
                        onSubmit={handleReserva}
                    >
                        {isMobile && (
                            <ParkingMap 
                                lugar={reservaForm.lugar}
                                capacidad={CAPACIDADES[reservaForm.lugar]}
                                ocupados={reservasTotales}
                                seleccionado={reservaForm.espacio}
                                onSelect={(n) => setReservaForm(prev => ({...prev, espacio: n}))}
                                isMobile={true}
                            />
                        )}
                    </BookingForm>

                    {misReservas.length > 0 && (
                        <section className="card">
                            <h4 className="card-title">Tu Pase Activo</h4>
                            {misReservas.map(res => (
                                <ReservationCard 
                                    key={res.id} 
                                    reserva={res} 
                                    onDownload={() => generarTicketGuest(res)} 
                                    onDelete={() => liberarPuesto(res.id)} 
                                />
                            ))}
                        </section>
                    )}
                </div>

                {!isMobile && (
                    <div style={{flex:1}}>
                        <ParkingMap 
                            lugar={reservaForm.lugar}
                            capacidad={CAPACIDADES[reservaForm.lugar]}
                            ocupados={reservasTotales}
                            seleccionado={reservaForm.espacio}
                            onSelect={(n) => setReservaForm(prev => ({...prev, espacio: n}))}
                            isMobile={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardGuest;