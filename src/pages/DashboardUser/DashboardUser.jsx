/**
 * PÁGINA PRINCIPAL: DashboardUser
 * PROPÓSITO: "El Cerebro". Orquesta la lógica de negocio, autenticación, conexión a Firebase y estados.
 * POR QUÉ ESTÁ AQUÍ: Importa y coordina los componentes visuales sin saturarse de código HTML.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { signOut } from 'firebase/auth'; 
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config'; 

// --- IMPORTAMOS LOS COMPONENTES ---
import Navbar from './components/Navbar';
import UserInfo from './components/UserInfo';
import ParkingMap from './components/ParkingMap';
import BookingForm from './components/BookingForm';
import ReservationCard from './components/ReservationCard';
import './DashboardUser.css';

const DashboardUser = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [userData, setUserData] = useState({ nombre: '', placa: '', email: '', rol: '' });
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);      
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    // Configuración Fechas
    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const fechaHoy = today.toISOString().split('T')[0];
    const fechaMax = afterTomorrow.toISOString().split('T')[0];
    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', fecha: fechaHoy, hora: "07:00", espacio: null 
    });

    // --- EFECTOS (Lógica de Negocio) ---
    
    // 1. Detección de Móvil
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Autenticación (Estricta para usuarios registrados)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const snap = await getDocs(q);
                if (!snap.empty) setUserData({ ...snap.docs[0].data(), email: user.email });
                setLoading(false);
            } else { navigate('/login'); }
        });
        return () => unsubscribe();
    }, [navigate]);

    // 3. Monitoreo de Firebase (Mapa y Mis Reservas)
    useEffect(() => {
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        let unsubMias = () => {};
        if (userData.email) {
            const qMias = query(collection(db, "reservas"), where("usuario", "==", userData.email));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, userData.email]);

    // 4. Temporizador (Regla de 8 Horas)
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicio = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const fin = inicio + (8 * 60 * 60 * 1000); // 8 horas
                if (ahora >= fin) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Tiempo Terminado', `Reserva #${reserva.espacio} finalizada.`, 'info');
                }
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- HANDLERS (Acciones) ---
    const handleLogout = async () => { await signOut(auth); };

    const handleReserva = async (e) => {
        e.preventDefault();
        
        if (misReservas.length > 0) return Swal.fire('Límite', 'Ya tienes una reserva activa.', 'warning');
        
        const [h, m] = reservaForm.hora.split(':').map(Number);
        const minTotales = h * 60 + m;
        // Validación de horario (06:30 - 20:30)
        if (minTotales < 390 || minTotales > 1230) return Swal.fire('Horario', 'Atención de 06:30 a 20:30', 'error');
        
        // Validación de fecha/hora pasada
        const ahora = new Date();
        const [yy, mm, dd] = reservaForm.fecha.split('-').map(Number);
        const fechaReserva = new Date(yy, mm - 1, dd, h, m);
        if (fechaReserva < ahora) return Swal.fire('Error', 'La fecha u hora ya pasó.', 'error');

        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');
        
        try {
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, 
                usuario: userData.email, 
                rol: userData.rol, 
                nombre: userData.nombre, 
                placa: userData.placa
            });
            
            Swal.fire({
                title: '¡Listo!', 
                text: 'Reserva confirmada.', 
                icon: 'success',
                confirmButtonText: 'Descargar Ticket'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Creamos un objeto temporal combinando form + datos de usuario para el PDF
                    const reservaParaPDF = {
                        ...reservaForm,
                        nombre: userData.nombre,
                        placa: userData.placa,
                        rol: userData.rol
                    };
                    generarTicketPro(reservaParaPDF);
                }
            });
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta de nuevo.', 'error'); }
    };

    const generarTicketPro = (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();
            
            const nombreFinal = (reserva.nombre || "Usuario").toUpperCase();
            const placaFinal = (reserva.placa || "N/A").toUpperCase();
            
            const [horas, minutos] = reserva.hora.split(':').map(Number);
            const fechaFin = new Date();
            fechaFin.setHours(horas + 8, minutos);
            const horaSalida = fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Diseño Básico del Ticket
            docPDF.setFontSize(18); 
            docPDF.text("POLIPARKING", pageWidth / 2, 20, { align: 'center' });
            
            docPDF.setFontSize(10);
            docPDF.text(`Usuario: ${nombreFinal}`, 10, 40);
            docPDF.text(`Placa: ${placaFinal}`, 10, 50);
            docPDF.text(`Fecha: ${reserva.fecha}`, 10, 60);
            docPDF.text(`Hora Entrada: ${reserva.hora}`, 10, 70);
            docPDF.text(`Hora Salida: ${horaSalida}`, 10, 80);
            
            docPDF.setFontSize(14);
            docPDF.text(`PUESTO: ${reserva.espacio}`, pageWidth / 2, 100, { align: 'center' });
            
            docPDF.save(`Ticket_${placaFinal}.pdf`);
        } catch (e) { console.error(e); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', '', 'success');
        }
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><div className="spinner"></div></div>;

    // --- RENDERIZADO PRINCIPAL ---
    return (
        <div className="dashboard-bg">
            <Navbar onLogout={handleLogout} />

            <div className={`main-container ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar" style={{width: isMobile ? '100%' : '350px'}}>
                    
                    <UserInfo user={userData} />

                    <BookingForm 
                        form={reservaForm}
                        setForm={setReservaForm}
                        capacidades={CAPACIDADES}
                        esDocente={userData.rol === 'docente'}
                        fechas={{hoy: fechaHoy, max: fechaMax}}
                        onSubmit={handleReserva}
                    >
                        {/* Si es móvil, inyectamos el mapa dentro del formulario */}
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
                            <h4 className="card-title">Tu Reserva Activa</h4>
                            {misReservas.map(res => (
                                <ReservationCard 
                                    key={res.id} 
                                    reserva={res} 
                                    onDownload={() => generarTicketPro(res)} 
                                    onDelete={liberarPuesto} 
                                />
                            ))}
                        </section>
                    )}
                </div>

                {/* Si es escritorio, el mapa va a la derecha */}
                {!isMobile && (
                    <div style={{flex:1}}>
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

export default DashboardUser;