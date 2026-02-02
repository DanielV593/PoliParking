import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { signOut } from 'firebase/auth'; 
import { FaDownload, FaSignOutAlt, FaParking, FaTrashAlt, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import jsPDF from 'jspdf';

const DashboardUser = ({ isGuest = false }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ nombre: '', placa: '', email: '' });
    const [reservasTotales, setReservasTotales] = useState([]);
    const [misReservas, setMisReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapVisible, setMapVisible] = useState(false); 
    const [isMobile, setIsMobile] = useState(false);

    // Referencia para mantener el ID del invitado durante la sesión sin que cambie
    const guestIdRef = useRef('guest_' + Math.floor(Math.random() * 100000));

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const fechaHoy = today.toISOString().split('T')[0];
    const fechaMax = afterTomorrow.toISOString().split('T')[0];

    const [reservaForm, setReservaForm] = useState({ 
        lugar: 'Edificio CEC', 
        fecha: fechaHoy, 
        hora: "07:00", 
        espacio: null 
    });

    const CAPACIDADES = { "Edificio CEC": 100 };

    // --- LOGICA DE EXPIRACIÓN (ACTUALIZADA: 3 HORAS INVITADO / 8 HORAS ESTUDIANTE) ---
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicioReserva = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                
                // CAMBIO: Definir duración según el rol
                const horasDuracion = reserva.rol === 'invitado' ? 3 : 8;
                
                const finReserva = inicioReserva + (horasDuracion * 60 * 60 * 1000);
                const tiempoRestanteMin = Math.floor((finReserva - ahora) / (60 * 1000));
                
                if (ahora >= finReserva) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Reserva Expirada', `Tu tiempo de ${horasDuracion} horas en el puesto #${reserva.espacio} terminó.`, 'info');
                } else if ([30, 20, 10].includes(tiempoRestanteMin)) {
                    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000 }).fire({
                        icon: 'warning', title: `Tu reserva #${reserva.espacio} vence en ${tiempoRestanteMin} min.`
                    });
                }
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    const generarTicketPro = async (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();
            docPDF.setDrawColor(10, 61, 98); docPDF.setLineWidth(1); docPDF.circle(pageWidth / 2, 18, 10, 'S'); 
            docPDF.setFontSize(22); docPDF.setFont("helvetica", "bold"); docPDF.text("P", pageWidth / 2, 21.5, { align: 'center' });
            docPDF.setFontSize(18); docPDF.text("POLIPARKING", pageWidth / 2, 38, { align: 'center' });
            docPDF.setFontSize(8); docPDF.setFont("helvetica", "normal"); docPDF.text("Comprobante de Reserva - EPN", pageWidth / 2, 43, { align: 'center' });
            docPDF.setLineWidth(0.5); docPDF.line(10, 48, 70, 48);
            docPDF.setFontSize(12); docPDF.setFont("helvetica", "bold"); docPDF.text("DETALLES DEL TICKET", pageWidth / 2, 55, { align: 'center' });
            const xPos = 12;
            docPDF.setFontSize(9); docPDF.text("USUARIO:", xPos, 65);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.nombre || userData.nombre || "Usuario").toUpperCase(), xPos, 69);
            docPDF.setFont("helvetica", "bold"); docPDF.text("PLACA:", xPos, 77);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.placa || userData.placa || "N/A").toUpperCase(), xPos, 81);
            docPDF.setFont("helvetica", "bold"); docPDF.text("UBICACIÓN:", xPos, 89);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.lugar || "CEC").toUpperCase(), xPos, 93);
            docPDF.setDrawColor(200); docPDF.line(10, 98, 70, 98);
            docPDF.setFontSize(10); 
            docPDF.setFont("helvetica", "bold"); docPDF.text("FECHA:", xPos, 105);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.fecha, 45, 105);
            docPDF.setFont("helvetica", "bold"); docPDF.text("HORA:", xPos, 110);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.hora, 45, 110);
            
            // CAMBIO: Mostrar validez dinámica en el PDF
            const textoValidez = reserva.rol === 'invitado' ? "3 HORAS (INVITADO)" : "8 HORAS";
            
            docPDF.setFont("helvetica", "bold"); docPDF.text("VALIDEZ:", xPos, 115);
            docPDF.setFont("helvetica", "normal"); docPDF.text(textoValidez, 45, 115);
            
            docPDF.setDrawColor(0); docPDF.setLineWidth(0.7); docPDF.rect(15, 125, 50, 15); 
            docPDF.setFontSize(16); docPDF.setFont("helvetica", "bold"); docPDF.text(`PUESTO: ${reserva.espacio || '?'}`, pageWidth / 2, 135, { align: 'center' });
            docPDF.save(`Ticket_${reserva.placa || 'invitado'}.pdf`);
        } catch (e) { console.error(e); }
    };

    // --- LOGICA DE USUARIO ---
    useEffect(() => {
        if (isGuest) {
            // Asignamos una identidad temporal al invitado para esta sesión
            setUserData({ 
                nombre: 'Invitado', 
                placa: 'VISITA', 
                email: guestIdRef.current 
            });
            setLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const snap = await getDocs(q);
                if (!snap.empty) setUserData({ ...snap.docs[0].data(), email: user.email });
            } else {
                navigate('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate, isGuest]);

    useEffect(() => {
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        // Consultar mis reservas (funciona para guest usando su ID temporal o usuario logueado)
        const currentUserEmail = isGuest ? guestIdRef.current : auth.currentUser?.email;
        
        let unsubMias = () => {};
        if (currentUserEmail) {
            const qMias = query(collection(db, "reservas"), where("usuario", "==", currentUserEmail));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }

        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, isGuest]);

    const handleReserva = async (e) => {
        e.preventDefault();

        // --- CAMBIO: VALIDACIONES ESPECÍFICAS PARA INVITADO ---
        if (isGuest) {
            // Restricción: Solo pueden reservar para hoy
            if (reservaForm.fecha !== fechaHoy) {
                return Swal.fire({
                    title: 'Restricción de Invitado',
                    text: 'Los invitados solo pueden reservar espacios para el día de hoy.',
                    icon: 'warning'
                });
            }
            // (Opcional) Restricción: Solo una reserva activa
            if (misReservas.length > 0) {
                 return Swal.fire('Límite', 'Como invitado solo puedes tener una reserva activa.', 'warning');
            }
        }
        
        if (!reservaForm.espacio && isMobile) {
            setMapVisible(true);
            setTimeout(() => {
                document.querySelector('.map-section-mobile')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
            return Swal.fire('Info', 'Por favor, selecciona un espacio del mapa.', 'info');
        }
        
        // Validar que no sea hora pasada (solo si es hoy)
        if (reservaForm.fecha === fechaHoy) {
            const ahora = new Date();
            const [hRes, mRes] = reservaForm.hora.split(':');
            const tiempoReserva = new Date();
            tiempoReserva.setHours(parseInt(hRes), parseInt(mRes), 0);
            if (tiempoReserva < ahora) return Swal.fire('Error', 'No puedes reservar en una hora que ya pasó.', 'error');
        }
        
        const hr = parseInt(reservaForm.hora.split(':')[0]);
        if (hr < 7 || hr >= 20) return Swal.fire('Error', 'Horario de atención: 07:00 AM - 08:00 PM', 'error');
        
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa', 'info');

        // Texto dinámico para la confirmación
        const duracionTexto = isGuest ? "3 horas" : "8 horas";

        const res = await Swal.fire({ 
            title: '¿Confirmar reserva?', 
            html: `Puesto <b>#${reservaForm.espacio}</b><br>Fecha: ${reservaForm.fecha}<br>Hora: ${reservaForm.hora}<br>Duración: <b>${duracionTexto}</b>`, 
            icon: 'question', 
            showCancelButton: true 
        });
        
        if (res.isConfirmed) {
            try {
                // Validación de duplicados
                const q = query(collection(db, "reservas"), where("usuario", "==", userData.email), where("fecha", "==", reservaForm.fecha));
                const snap = await getDocs(q);
                if (!snap.empty) return Swal.fire('Límite', 'Ya tienes una reserva para este día.', 'warning');
                
                // CAMBIO: Guardamos el rol correcto (invitado o estudiante)
                await addDoc(collection(db, "reservas"), { 
                    ...reservaForm, 
                    usuario: userData.email, // Será el email real o el ID temporal del guest
                    rol: isGuest ? 'invitado' : 'estudiante', // IMPORTANTE PARA LA LÓGICA DE TIEMPO
                    nombre: userData.nombre,
                    placa: userData.placa
                });
                
                Swal.fire({ 
                    title: '¡Reserva Exitosa!', 
                    text: `Reserva activa por ${duracionTexto}.`, 
                    icon: 'success', 
                    showCancelButton: true, 
                    confirmButtonText: 'Descargar Ticket',
                    cancelButtonText: 'Cerrar'
                }).then((r) => { 
                    // Pasamos datos simulados al generador si es necesario
                    const datosReserva = {
                        ...reservaForm,
                        nombre: userData.nombre,
                        placa: userData.placa,
                        rol: isGuest ? 'invitado' : 'estudiante'
                    };
                    if(r.isConfirmed) generarTicketPro(datosReserva); 
                });
                
                setReservaForm({ ...reservaForm, espacio: null });
                setMapVisible(false);
                
            } catch (e) { 
                console.error(e); 
                Swal.fire('Error', 'No se pudo realizar la reserva. Intenta nuevamente.', 'error');
            }
        }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar puesto?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Puesto Liberado', '', 'success');
        }
    };

    const handleLogout = async () => { 
        if (isGuest) {
            navigate('/');
            return;
        }
        if ((await Swal.fire({ title: '¿Cerrar sesión?', showCancelButton: true })).isConfirmed) { 
            await signOut(auth); 
            navigate('/login'); 
        } 
    };

    const handleSpaceSelection = (num) => {
        const estaOcupado = reservasTotales.some(r => r.espacio === num);
        if (estaOcupado) {
            Swal.fire('Espacio Ocupado', 'Este espacio ya está reservado. Selecciona otro.', 'warning');
            return;
        }
        
        setReservaForm({...reservaForm, espacio: num});
        
        if (isMobile) {
            setTimeout(() => {
                setMapVisible(false);
                document.querySelector('.reserva-section')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 500);
            
            Swal.fire({
                title: '¡Espacio Seleccionado!',
                text: `Has seleccionado el espacio #${num}.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    if (loading) return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            background: '#f4f7f6',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <h2 style={{color:'#0a3d62'}}>Cargando PoliParking...</h2>
            <div style={{
                width: '50px',
                height: '50px',
                border: '5px solid #f0f0f0',
                borderTop: '5px solid #0a3d62',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
        </div>
    );

    return (
        <div style={bgStyle}>
            {/* HEADER */}
            <nav style={navStyle}>
                <div style={brandStyle}>
                    <FaParking color="#ffc107" size={22}/> 
                    <span style={{marginLeft: '8px'}}>
                        POLI<span style={{color:'#ffc107'}}>PARKING</span>
                    </span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    {!isMobile && (
                        <div style={{textAlign:'right', lineHeight:'1.4'}}>
                            <div style={{fontWeight:'bold', color:'#0a3d62', fontSize:'1rem'}}>
                                {/* Si es invitado mostramos "Invitado" */}
                                ¡Bienvenido/a, {userData.nombre?.split(' ')[0] || 'Usuario'}!
                            </div>
                            <div style={{fontSize:'0.85rem', color:'#666', fontWeight:'500'}}>
                                Rol: <span style={{color: isGuest ? '#e30613' : '#ffc107', fontWeight:'bold'}}>
                                    {isGuest ? 'INVITADO (3h Max)' : 'ESTUDIANTE'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div style={avatarStyle}>
                        {userData.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button onClick={handleLogout} style={logoutBtn} title={isGuest ? "Salir" : "Cerrar sesión"}>
                        <FaSignOutAlt/>
                    </button>
                </div>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <div style={styles.mainContainer}>
                {/* COLUMNA IZQUIERDA (Desktop) o FLUJO COMPLETO (Mobile) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    width: isMobile ? '100%' : '350px',
                    flexShrink: 0
                }}>
                    {/* CAJA NUEVA RESERVA */}
                    <section className="reserva-section" style={styles.cardStyle}>
                        <h3 style={styles.titleStyle}>
                            <FaParking style={{marginRight: '8px', color: '#ffc107'}}/>
                            Nueva Reserva
                        </h3>
                        
                        {/* AVISO PARA INVITADOS */}
                        {isGuest && (
                            <div style={{
                                background: '#fff3cd', 
                                color: '#856404', 
                                padding: '10px', 
                                borderRadius: '8px',
                                marginBottom: '15px',
                                fontSize: '0.85rem',
                                border: '1px solid #ffeeba'
                            }}>
                                ⚠️ <strong>Modo Invitado:</strong> Solo puedes reservar para <strong>HOY</strong> con una duración máxima de <strong>3 horas</strong>.
                            </div>
                        )}

                        <form onSubmit={handleReserva}>
                            <div style={styles.formGroup}>
                                <label style={styles.labelStyle}>
                                    <FaParking size={12} style={{marginRight: '5px'}}/>
                                    Ubicación:
                                </label>
                                <div style={{position: 'relative'}}>
                                    <input 
                                        style={{
                                            ...styles.inputStyle, 
                                            background: '#f8f9fa', 
                                            cursor: 'not-allowed',
                                            paddingLeft: '35px'
                                        }} 
                                        value="Edificio CEC" 
                                        disabled 
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#666'
                                    }}>
                                        🏢
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelStyle}>
                                    <FaClock size={12} style={{marginRight: '5px'}}/>
                                    Fecha:
                                </label>
                                <input 
                                    type="date" 
                                    style={styles.inputStyle} 
                                    value={reservaForm.fecha} 
                                    // CAMBIO: Si es invitado, min y max son HOY
                                    min={isGuest ? fechaHoy : fechaHoy} 
                                    max={isGuest ? fechaHoy : fechaMax} 
                                    onKeyDown={e => e.preventDefault()} 
                                    onChange={e => {
                                        setReservaForm({...reservaForm, fecha: e.target.value, espacio: null});
                                        setMapVisible(false);
                                    }} 
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.labelStyle}>
                                    <FaClock size={12} style={{marginRight: '5px'}}/>
                                    Hora inicio:
                                </label>
                                <input 
                                    type="time" 
                                    style={styles.inputStyle} 
                                    value={reservaForm.hora} 
                                    onChange={e => setReservaForm({...reservaForm, hora: e.target.value})} 
                                />
                            </div>
                            
                            {/* ESPACIO SELECCIONADO */}
                            {reservaForm.espacio && (
                                <div style={styles.selectedSpaceStyle}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <FaCheckCircle color="#22c55e"/>
                                        <span>Espacio seleccionado: <strong style={{color: '#0a3d62'}}>#{reservaForm.espacio}</strong></span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setReservaForm({...reservaForm, espacio: null})}
                                        style={styles.clearSelectionBtn}
                                        title="Cambiar espacio"
                                    >
                                        <FaTimes/>
                                    </button>
                                </div>
                            )}
                            
                            {/* BOTÓN DE RESERVA / SELECCIÓN */}
                            <button 
                                type="submit" 
                                style={{
                                    ...styles.mainBtn, 
                                    backgroundColor: reservaForm.espacio ? '#0a3d62' : '#3b82f6',
                                    marginTop: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {reservaForm.espacio 
                                    ? `🎯 Reservar Espacio #${reservaForm.espacio}`
                                    : "🗺️ Seleccione en el mapa"}
                            </button>
                        </form>
                    </section>

                    {/* MAPA EN MÓVILES */}
                    {isMobile && mapVisible && (
                        <section 
                            className="map-section-mobile"
                            style={{
                                ...styles.mapCardStyle,
                                animation: 'slideIn 0.3s ease-out'
                            }}
                        >
                            <div style={styles.mapHeader}>
                                <h3 style={styles.titleStyle}>
                                    🗺️ Mapa de Espacios ({reservaForm.fecha})
                                </h3>
                                <button 
                                    onClick={() => setMapVisible(false)}
                                    style={styles.closeMapBtn}
                                >
                                    <FaTimes/> Cerrar
                                </button>
                            </div>
                            
                            <div style={styles.legend}>
                                <div style={styles.legendItem}>
                                    <div style={styles.legendBoxFree}></div>
                                    <span>Libre</span>
                                </div>
                                <div style={styles.legendItem}>
                                    <div style={styles.legendBoxOccupied}></div>
                                    <span>Ocupado</span>
                                </div>
                                <div style={styles.legendItem}>
                                    <div style={styles.legendBoxSelected}></div>
                                    <span>Seleccionado</span>
                                </div>
                            </div>
                            
                            <div style={styles.mapGridMobile}>
                                {[...Array(CAPACIDADES[reservaForm.lugar] || 100)].map((_, i) => {
                                    const num = i + 1; 
                                    const estaOcupado = reservasTotales.some(r => r.espacio === num); 
                                    const estaSeleccionado = reservaForm.espacio === num;
                                    
                                    return (
                                        <button
                                            key={num}
                                            onClick={() => handleSpaceSelection(num)}
                                            disabled={estaOcupado}
                                            style={{
                                                ...styles.spotStyleMobile,
                                                background: estaOcupado ? '#dfe6e9' : 
                                                          (estaSeleccionado ? '#0a3d62' : '#fff'),
                                                color: estaOcupado ? '#b2bec3' : 
                                                      (estaSeleccionado ? '#fff' : '#333'),
                                                border: estaSeleccionado ? '2px solid #ffc107' : 
                                                       (estaOcupado ? '1px solid #b2bec3' : '1px solid #ddd'),
                                                cursor: estaOcupado ? 'not-allowed' : 'pointer',
                                                transform: estaSeleccionado ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                            title={estaOcupado ? `Espacio ${num} ocupado` : `Seleccionar espacio ${num}`}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* CAJA MIS RESERVAS ACTIVAS (Visible para todos ahora) */}
                    <section style={styles.cardStyle}>
                        <div style={styles.sectionHeader}>
                            <h4 style={styles.titleStyle}>
                                <FaCheckCircle style={{marginRight: '8px', color: '#22c55e'}}/>
                                Mis Reservas {isGuest ? '(Invitado)' : ''}
                            </h4>
                            {misReservas.length > 0 && (
                                <span style={styles.badge}>
                                    {misReservas.length}
                                </span>
                            )}
                        </div>
                        {misReservas.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={{fontSize: '2rem', marginBottom: '10px'}}>🚗</div>
                                <p style={{fontSize:'0.9rem', color:'#999', textAlign:'center'}}>
                                    No tienes reservas activas en este momento.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.reservasList}>
                                {misReservas.map(res => (
                                    <div key={res.id} style={styles.reservaItem}>
                                        <div style={{flex: 1}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                                                <div style={styles.spaceNumber}>#{res.espacio}</div>
                                                <div style={styles.locationBadge}>{res.lugar}</div>
                                                {/* Badge de Rol en la reserva */}
                                                {res.rol === 'invitado' && (
                                                    <div style={{fontSize:'0.65rem', background:'#ffeeba', color:'#856404', padding:'2px 6px', borderRadius:'4px'}}>3H</div>
                                                )}
                                            </div>
                                            <div style={{fontSize:'0.75rem', color:'#888', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <span>📅 {res.fecha}</span>
                                                <span style={{margin: '0 5px'}}>•</span>
                                                <span>🕒 {res.hora}</span>
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:'8px'}}>
                                            <button 
                                                onClick={() => generarTicketPro(res)} 
                                                style={styles.iconBtn}
                                                title="Descargar ticket"
                                            >
                                                <FaDownload/>
                                            </button>
                                            <button 
                                                onClick={() => liberarPuesto(res.id)} 
                                                style={{...styles.iconBtn, background: '#dcfce7', color: '#22c55e'}}
                                                title="Liberar puesto"
                                            >
                                                <FaCheckCircle/>
                                            </button>
                                            <button 
                                                onClick={async () => { 
                                                    if((await Swal.fire({
                                                        title:'¿Cancelar reserva?', 
                                                        text: 'Esta acción no se puede deshacer',
                                                        icon:'warning', 
                                                        showCancelButton:true
                                                    })).isConfirmed) {
                                                            deleteDoc(doc(db,"reservas",res.id));
                                                            Swal.fire('Reserva Cancelada', '', 'success');
                                                        }
                                                }} 
                                                style={{...styles.iconBtn, color:'#e30613', background:'#fee2e2'}}
                                                title="Eliminar reserva"
                                            >
                                                <FaTrashAlt/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* MAPA EN DESKTOP */}
                {!isMobile && (
                    <section style={styles.mapSectionDesktop}>
                        <div style={styles.mapCardStyle}>
                            <div style={styles.mapHeader}>
                                <h3 style={styles.titleStyle}>
                                    🗺️ Mapa de Espacios ({reservaForm.fecha})
                                </h3>
                                <div style={styles.legend}>
                                    <div style={styles.legendItem}>
                                        <div style={styles.legendBoxFree}></div>
                                        <span>Libre</span>
                                    </div>
                                    <div style={styles.legendItem}>
                                        <div style={styles.legendBoxOccupied}></div>
                                        <span>Ocupado</span>
                                    </div>
                                    <div style={styles.legendItem}>
                                        <div style={styles.legendBoxSelected}></div>
                                        <span>Seleccionado</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={styles.mapGrid}>
                                {[...Array(CAPACIDADES[reservaForm.lugar] || 100)].map((_, i) => {
                                    const num = i + 1; 
                                    const estaOcupado = reservasTotales.some(r => r.espacio === num); 
                                    const estaSeleccionado = reservaForm.espacio === num;
                                    
                                    return (
                                        <button
                                            key={num}
                                            onClick={() => handleSpaceSelection(num)}
                                            disabled={estaOcupado}
                                            style={{
                                                ...styles.spotStyle,
                                                background: estaOcupado ? '#dfe6e9' : 
                                                          (estaSeleccionado ? '#0a3d62' : '#fff'),
                                                color: estaOcupado ? '#b2bec3' : 
                                                      (estaSeleccionado ? '#fff' : '#333'),
                                                border: estaSeleccionado ? '2px solid #ffc107' : 
                                                       (estaOcupado ? '1px solid #b2bec3' : '1px solid #ddd'),
                                                cursor: estaOcupado ? 'not-allowed' : 'pointer',
                                                transform: estaSeleccionado ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                            title={estaOcupado ? `Espacio ${num} ocupado` : `Seleccionar espacio ${num}`}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

// ESTILOS (IGUAL QUE ANTES)
const styles = {
    mainContainer: {
        display: 'flex',
        gap: '20px',
        '@media (max-width: 900px)': {
            flexDirection: 'column',
            gap: '15px'
        }
    },
    
    cardStyle: { 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease'
    },
    
    mapCardStyle: {
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '15px'
    },
    
    titleStyle: { 
        marginTop: 0, 
        color: '#0a3d62', 
        fontSize:'1.1rem', 
        marginBottom:'15px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center'
    },
    
    formGroup: {
        marginBottom: '15px'
    },
    
    labelStyle: { 
        fontSize:'0.8rem', 
        color:'#666', 
        fontWeight:'600',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '6px'
    },
    
    inputStyle: { 
        width: '100%', 
        padding: '11px 15px', 
        borderRadius: '8px', 
        border:'1px solid #e0e0e0', 
        outline: 'none',
        fontSize: '0.9rem',
        boxSizing: 'border-box',
        transition: 'border 0.2s',
        ':focus': {
            borderColor: '#0a3d62',
            boxShadow: '0 0 0 2px rgba(10, 61, 98, 0.1)'
        }
    },
    
    mainBtn: { 
        width: '100%', 
        padding: '13px', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '8px', 
        fontWeight:'600', 
        cursor: 'pointer',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
        ':active': {
            transform: 'translateY(0)'
        }
    },
    
    selectedSpaceStyle: {
        padding: '12px 15px',
        margin: '15px 0',
        background: '#e8f4fd',
        borderRadius: '8px',
        border: '1px solid #bae6fd',
        color: '#0a3d62',
        fontSize: '0.9rem',
        fontWeight: '500',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        animation: 'fadeIn 0.3s ease'
    },
    
    clearSelectionBtn: {
        background: 'transparent',
        border: 'none',
        color: '#666',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        ':hover': {
            background: '#f0f0f0',
            color: '#e30613'
        }
    },
    
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
    },
    
    badge: {
        background: '#ffc107',
        color: '#333',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        minWidth: '25px',
        textAlign: 'center'
    },
    
    emptyState: {
        textAlign: 'center',
        padding: '30px 20px'
    },
    
    reservasList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    
    reservaItem: { 
        display:'flex', 
        justifyContent:'space-between', 
        alignItems:'center', 
        padding:'14px', 
        background:'#f8f9fa', 
        borderRadius:'10px', 
        borderLeft:'4px solid #ffc107',
        transition: 'all 0.2s',
        ':hover': {
            background: '#f0f5ff',
            transform: 'translateX(3px)'
        }
    },
    
    spaceNumber: {
        fontWeight:'bold', 
        color:'#0a3d62', 
        fontSize:'0.95rem',
        background: '#e8f4fd',
        padding: '3px 8px',
        borderRadius: '6px'
    },
    
    locationBadge: {
        fontSize:'0.7rem', 
        color:'#666', 
        background:'#f0f9ff', 
        padding:'3px 8px', 
        borderRadius:'10px'
    },
    
    iconBtn: { 
        border:'none', 
        background:'#e3f2fd', 
        color:'#1976d2', 
        padding: '9px', 
        borderRadius: '6px', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        ':hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }
    },
    
    // Estilos del mapa
    mapSectionDesktop: {
        flex: 1,
        position: 'sticky',
        top: '20px',
        height: 'fit-content'
    },
    
    mapHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px',
        flexWrap: 'wrap',
        gap: '10px'
    },
    
    closeMapBtn: {
        padding: '8px 15px',
        background: '#e30613',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.2s',
        ':hover': {
            background: '#c10511',
            transform: 'translateY(-1px)'
        }
    },
    
    legend: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.75rem',
        marginBottom: '15px'
    },
    
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#555'
    },
    
    legendBoxFree: {
        width: '12px',
        height: '12px',
        borderRadius: '2px',
        background: '#fff',
        border: '1px solid #ddd'
    },
    
    legendBoxOccupied: {
        width: '12px',
        height: '12px',
        borderRadius: '2px',
        background: '#dfe6e9'
    },
    
    legendBoxSelected: {
        width: '12px',
        height: '12px',
        borderRadius: '2px',
        background: '#0a3d62'
    },
    
    mapGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', 
        gap: '8px',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
    },
    
    mapGridMobile: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', 
        gap: '6px',
        maxHeight: '350px',
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
    },
    
    spotStyle: { 
        height: '45px', 
        borderRadius:'6px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize:'0.8rem', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        transition: 'all 0.2s',
        border: '1px solid #ddd'
    },
    
    spotStyleMobile: { 
        height: '38px', 
        borderRadius:'5px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize:'0.75rem', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        transition: 'all 0.2s',
        border: '1px solid #ddd'
    }
};

const bgStyle = { 
    minHeight: '100vh', 
    background: '#f4f7f6', 
    padding: '15px',
    boxSizing: 'border-box'
};

const navStyle = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems:'center', 
    padding: '12px 20px', 
    background: '#fff', 
    borderRadius:'12px', 
    marginBottom: '15px', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
};

const brandStyle = { 
    fontSize: '1.3rem', 
    fontWeight: 'bold', 
    display:'flex', 
    alignItems:'center', 
    color:'#0a3d62' 
};

const avatarStyle = { 
    width: '40px', 
    height:'40px', 
    background:'#0a3d62', 
    color:'white', 
    borderRadius:'50%', 
    display:'flex', 
    justifyContent:'center', 
    alignItems:'center', 
    fontWeight:'bold', 
    border:'2px solid #ffc107' 
};

const logoutBtn = { 
    background: 'none', 
    border: 'none', 
    color: '#e30613', 
    cursor:'pointer', 
    fontSize:'1.2rem',
    padding: '5px',
    borderRadius: '5px',
    transition: 'all 0.2s',
    ':hover': {
        background: '#fee2e2'
    }
};

const addGlobalStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
};

addGlobalStyles();

export default DashboardUser;