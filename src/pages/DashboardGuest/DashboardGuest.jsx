/**
 * PÁGINA: DashboardGuest
 * PROPÓSITO: Panel exclusivo para invitados.
 * REGLAS DE NEGOCIO: 
 * 1. Solo pueden reservar para el día actual.
 * 2. Tiempo máximo de reserva: 3 Horas.
 * 3. Datos persistentes vía localStorage (no Firebase Auth).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Ajusta la ruta si es necesario

// --- IMPORTAMOS LOS COMPONENTES (RECICLAMOS CÓDIGO) ---
// Usamos los mismos componentes visuales del usuario para mantener consistencia
import Navbar from '../DashboardUser/components/Navbar';
import UserInfo from '../DashboardUser/components/UserInfo';
import ParkingMap from '../DashboardUser/components/ParkingMap';
import BookingForm from '../DashboardUser/components/BookingForm';
import ReservationCard from '../DashboardUser/components/ReservationCard';
import './DashboardGuest.css';

const DashboardGuest = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    // El invitado no tiene login real, simulamos un perfil básico
    const [userData, setUserData] = useState({ nombre: 'Invitado', placa: 'VISITA', rol: 'invitado' });
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    // CONFIGURACIÓN DE FECHAS (REGLA: SOLO HOY)
    const today = new Date();
    const fechaHoy = today.toISOString().split('T')[0];
    
    // Estado del formulario
    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', 
        fecha: fechaHoy, // Forzamos que sea hoy
        hora: "07:00", 
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

    // 2. Auth "Light" (Verificar si existe data en localStorage)
    useEffect(() => {
        const guestData = JSON.parse(localStorage.getItem('guestData'));
        if (!guestData) {
            Swal.fire('Acceso Denegado', 'Debes registrarte como invitado primero.', 'error');
            navigate('/'); // Regresar al Landing si no hay datos
        } else {
            setUserData({ ...guestData, rol: 'invitado' });
            setLoading(false);
        }
    }, [navigate]);

    // 3. Monitoreo Firebase
    useEffect(() => {
        // Ver mapa de ocupación
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        let unsubMias = () => {};
        // Ver mis reservas (Usamos la placa o nombre almacenado en localStorage como identificador)
        if (userData.placa) {
            // NOTA: Para invitados usamos "placa" o "nombre" para filtrar sus reservas, ya que no tienen UID
            const qMias = query(collection(db, "reservas"), where("placa", "==", userData.placa), where("rol", "==", "invitado"));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, userData.placa]);

    // 4. Temporizador (REGLA: 3 HORAS MÁXIMO)
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicio = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const fin = inicio + (3 * 60 * 60 * 1000); // <--- AQUÍ ESTÁ EL CAMBIO (3 HORAS)
                
                if (ahora >= fin) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Tiempo Terminado', `Tu visita de 3 horas en el puesto #${reserva.espacio} ha finalizado.`, 'info');
                }
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- ACCIONES ---

    const handleLogout = () => {
        localStorage.removeItem('guestData'); // Limpiamos rastro del invitado
        navigate('/');
    };

    const handleReserva = async (e) => {
        e.preventDefault();
        
        if (misReservas.length > 0) return Swal.fire('Límite', 'Solo puedes tener una reserva activa.', 'warning');
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');
        
        // Validación extra de fecha (Aunque el input esté bloqueado)
        if (reservaForm.fecha !== fechaHoy) return Swal.fire('Error', 'Los invitados solo pueden reservar para hoy.', 'error');

        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, 
                usuario: 'guest_' + userData.placa, // Identificador simulado
                rol: 'invitado', 
                nombre: userData.nombre, 
                placa: userData.placa
            });
            
            Swal.fire({
                title: '¡Reserva Exitosa!', 
                text: 'Tienes 3 horas de parqueo.', 
                icon: 'success',
                confirmButtonText: 'Descargar Ticket'
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
            const fechaFin = new Date();
            fechaFin.setHours(horas + 3, minutos); // <--- CÁLCULO DE 3 HORAS PARA PDF
            const horaSalida = fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Diseño Ticket Invitado
            docPDF.setFontSize(18); 
            docPDF.text("POLIPARKING", pageWidth / 2, 20, { align: 'center' });
            docPDF.setFontSize(10);
            docPDF.text("-- PASE DE INVITADO --", pageWidth / 2, 30, { align: 'center' });
            
            docPDF.text(`Visita: ${reserva.nombre}`, 10, 45);
            docPDF.text(`Placa: ${reserva.placa}`, 10, 55);
            docPDF.text(`Válido hasta: ${horaSalida}`, 10, 75);
            docPDF.setTextColor(200, 0, 0);
            docPDF.text("(Máximo 3 Horas)", 10, 80);
            
            docPDF.setFontSize(16);
            docPDF.setTextColor(0, 0, 0);
            docPDF.text(`PUESTO: ${reserva.espacio}`, pageWidth / 2, 100, { align: 'center' });
            
            docPDF.save(`Pase_Invitado_${reserva.placa}.pdf`);
        } catch (e) { console.error(e); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', text: 'Terminarás tu visita.', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', 'Gracias por tu visita.', 'success');
        }
    };

    if (loading) return <div className="spinner">Verificando acceso...</div>;

    return (
        <div className="dashboard-guest-bg">
            {/* Reutilizamos el Navbar */}
            <Navbar onLogout={handleLogout} />

            <div className={`main-container ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar" style={{width: isMobile ? '100%' : '350px'}}>
                    
                    {/* Reutilizamos UserInfo */}
                    <UserInfo user={userData} />

                    <div className="alert-guest">
                        ⚠️ Modo Invitado: Máximo 3 horas por día.
                    </div>

                    {/* Reutilizamos BookingForm (Configurado para Guests) */}
                    <BookingForm 
                        form={reservaForm}
                        setForm={setReservaForm}
                        capacidades={CAPACIDADES}
                        esDocente={false} // Invitado no puede elegir lugar (se queda con CEC por defecto o lo que elijas)
                        fechas={{ hoy: fechaHoy, max: fechaHoy }} // <--- REGLA: MIN y MAX son HOY
                        onSubmit={handleReserva}
                    >
                        {isMobile && (
                            <ParkingMap 
                                lugar={reservaForm.lugar}
                                capacidad={CAPACIDADES[reservaForm.lugar]}
                                ocupados={reservasTotales}
                                seleccionado={reservaForm.espacio}
                                onSelect={(n) => setReservaForm({...reservaForm, espacio: n})}
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
                                    onDelete={liberarPuesto} 
                                />
                            ))}
                        </section>
                    )}
                </div>

                {!isMobile && (
                    <div style={{flex:1}}>
                        {/* Reutilizamos ParkingMap */}
                        <ParkingMap 
                            lugar={reservaForm.lugar}
                            capacidad={CAPACIDADES[reservaForm.lugar]}
                            ocupados={reservasTotales}
                            seleccionado={reservaForm.espacio}
                            onSelect={(n) => setReservaForm({...reservaForm, espacio: n})}
                            isMobile={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardGuest;