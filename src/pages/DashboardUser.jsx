import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { signOut } from 'firebase/auth'; 
import { FaDownload, FaSignOutAlt, FaParking, FaTrashAlt, FaClock, FaCheckCircle, FaTimes, FaCarSide } from 'react-icons/fa';
import jsPDF from 'jspdf';

const DashboardUser = ({ isGuest = false }) => {
    const navigate = useNavigate();
    
    const [userData, setUserData] = useState({ nombre: '', placa: '', email: '' });
    const [reservasTotales, setReservasTotales] = useState([]); 
    const [misReservas, setMisReservas] = useState([]);       
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    const guestIdRef = useRef('guest_' + Math.floor(Math.random() * 1000000));

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
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

    // --- LÓGICA DE TIEMPO ---
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicioReserva = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const horasPermitidas = reserva.rol === 'invitado' ? 3 : 8;
                const finReserva = inicioReserva + (horasPermitidas * 60 * 60 * 1000);
                
                if (ahora >= finReserva) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                } 
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- PDF CORREGIDO (TEXTO QUE NO SE CORTA) ---
    const generarTicketPro = async (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();
            docPDF.setDrawColor(10, 61, 98); docPDF.setLineWidth(1); docPDF.circle(pageWidth / 2, 18, 10, 'S'); 
            docPDF.setFontSize(22); docPDF.setFont("helvetica", "bold"); docPDF.text("P", pageWidth / 2, 21.5, { align: 'center' });
            docPDF.setFontSize(18); docPDF.text("POLIPARKING", pageWidth / 2, 38, { align: 'center' });
            docPDF.setFontSize(8); docPDF.setFont("helvetica", "normal"); docPDF.text("Comprobante de Reserva - EPN", pageWidth / 2, 43, { align: 'center' });
            docPDF.setLineWidth(0.5); docPDF.line(10, 48, 70, 48);
            
            const xPos = 12; // Margen izquierdo alineado
            docPDF.setFontSize(9); 
            docPDF.setFont("helvetica", "bold"); docPDF.text("USUARIO:", xPos, 65);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.nombre || userData.nombre || "Usuario").toUpperCase(), xPos, 69);
            docPDF.setFont("helvetica", "bold"); docPDF.text("PLACA:", xPos, 77);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.placa || userData.placa || "N/A").toUpperCase(), xPos, 81);
            docPDF.setFont("helvetica", "bold"); docPDF.text("UBICACIÓN:", xPos, 89);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.lugar || "CEC").toUpperCase(), xPos, 93);
            docPDF.setDrawColor(200); docPDF.line(10, 98, 70, 98);
            
            // Alineación de columnas corregida
            docPDF.setFont("helvetica", "bold"); docPDF.text("FECHA:", xPos, 105);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.fecha, 35, 105); // Movido a x=35
            docPDF.setFont("helvetica", "bold"); docPDF.text("HORA:", xPos, 110);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.hora, 35, 110); // Movido a x=35
            
            const textoValidez = reserva.rol === 'invitado' ? "3 HORAS (INVITADO)" : "8 H (ESTUDIANTE)";
            docPDF.setFont("helvetica", "bold"); docPDF.text("VALIDEZ:", xPos, 115);
            // Reducimos fuente solo aquí para evitar corte
            docPDF.setFontSize(8); 
            docPDF.setFont("helvetica", "normal"); docPDF.text(textoValidez, 35, 115); // Movido a x=35 para dar espacio
            
            docPDF.setDrawColor(0); docPDF.setLineWidth(0.7); docPDF.rect(15, 125, 50, 15); 
            docPDF.setFontSize(16); docPDF.setFont("helvetica", "bold"); 
            docPDF.text(`PUESTO: ${reserva.espacio || '?'}`, pageWidth / 2, 135, { align: 'center' });
            docPDF.save(`Ticket_${reserva.placa || 'invitado'}.pdf`);
        } catch (e) { console.error(e); }
    };

    // --- AUTH ---
    useEffect(() => {
        if (isGuest) {
            setUserData({ nombre: 'Invitado', placa: 'VISITA', email: guestIdRef.current });
            setLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const snap = await getDocs(q);
                if (!snap.empty) setUserData({ ...snap.docs[0].data(), email: user.email });
            } else { navigate('/login'); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate, isGuest]);

    // --- DATA ---
    useEffect(() => {
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        const currentUserEmail = isGuest ? guestIdRef.current : auth.currentUser?.email;
        let unsubMias = () => {};
        if (currentUserEmail) {
            const qMias = query(collection(db, "reservas"), where("usuario", "==", currentUserEmail));
            unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        }
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, isGuest]);

    // --- ACCIONES ---
    const handleReserva = async (e) => {
        e.preventDefault();

        if (misReservas.length > 0) return Swal.fire({ title: 'Límite', text: 'Solo puedes tener una reserva activa.', icon: 'warning' });
        if (isGuest && reservaForm.fecha !== fechaHoy) return Swal.fire({ title: 'Restricción', text: 'Invitados solo hoy.', icon: 'warning' });
        
        const [hSeleccionada, mSeleccionada] = reservaForm.hora.split(':').map(Number);
        const minutosTotales = hSeleccionada * 60 + mSeleccionada;
        if (minutosTotales < 390 || minutosTotales > 1230) return Swal.fire({ title: 'Horario', text: 'Atención de 06:30 a 20:30', icon: 'error' });
        
        if (reservaForm.fecha === fechaHoy) {
            const ahora = new Date();
            const tiempoReserva = new Date();
            tiempoReserva.setHours(hSeleccionada, mSeleccionada, 0);
            if (tiempoReserva < ahora) return Swal.fire('Error', 'Hora ya pasada.', 'error');
        }

        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un puesto en el mapa.', 'info');

        try {
            const rolUsuario = isGuest ? 'invitado' : 'estudiante';
            const duracion = isGuest ? "3 horas" : "8 horas";
            
            const q = query(collection(db, "reservas"), where("usuario", "==", userData.email), where("fecha", "==", reservaForm.fecha));
            const snap = await getDocs(q);
            if (!snap.empty) return Swal.fire('Error', 'Ya tienes reserva hoy.', 'warning');

            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, usuario: userData.email, rol: rolUsuario, nombre: userData.nombre, placa: userData.placa
            });
            
            Swal.fire({ title: '¡Listo!', text: `Reserva por ${duracion}.`, icon: 'success', confirmButtonText: 'Ticket' }).then((r) => { 
                if(r.isConfirmed) generarTicketPro({ ...reservaForm, nombre: userData.nombre, placa: userData.placa, rol: rolUsuario });
            });
            setReservaForm({ ...reservaForm, espacio: null });

        } catch (e) { Swal.fire('Error', 'Intenta nuevamente.', 'error'); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
        }
    };

    const handleSpaceSelection = (num) => {
        const estaOcupado = reservasTotales.some(r => r.espacio === num);
        if (estaOcupado) return; 
        setReservaForm({...reservaForm, espacio: num});
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', flexDirection:'column'}}><div className="spinner"></div></div>;

    // COMPONENTE DE MAPA
    const MapaComponent = () => (
        <div style={styles.mapCardStyle}>
            <div style={styles.mapHeader}>
                <h3 style={styles.titleStyle}>🗺️ Selecciona Puesto</h3>
                <div style={styles.legend}>
                    <div style={styles.legendItem}><div style={styles.legendBoxFree}></div>Libre</div>
                    <div style={styles.legendItem}><div style={styles.legendBoxOccupied}></div>Ocupado</div>
                    <div style={styles.legendItem}><div style={styles.legendBoxSelected}></div>Tu Puesto</div>
                </div>
            </div>
            <div style={isMobile ? styles.mapGridMobile : styles.mapGrid}>
                {[...Array(CAPACIDADES[reservaForm.lugar] || 100)].map((_, i) => {
                    const num = i + 1; 
                    const estaOcupado = reservasTotales.some(r => r.espacio === num); 
                    const estaSeleccionado = reservaForm.espacio === num;
                    return (
                        <button key={num} onClick={() => handleSpaceSelection(num)} disabled={estaOcupado} type="button"
                            style={{
                                ...(isMobile ? styles.spotStyleMobile : styles.spotStyle),
                                background: estaOcupado ? '#dfe6e9' : (estaSeleccionado ? '#0a3d62' : '#fff'),
                                color: estaOcupado ? '#b2bec3' : (estaSeleccionado ? '#fff' : '#333'),
                                border: estaSeleccionado ? '2px solid #ffc107' : '1px solid #ddd',
                                transform: estaSeleccionado ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: estaSeleccionado ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >{num}</button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={bgStyle}>
            <nav style={navStyle}>
                <div style={brandStyle}><FaParking color="#ffc107" size={24}/> <span style={{marginLeft:'8px'}}>POLI<span style={{color:'#ffc107'}}>PARKING</span></span></div>
                <button onClick={async()=>{ await signOut(auth); navigate(isGuest?'/':'/login');}} style={logoutBtn}><FaSignOutAlt size={20}/></button>
            </nav>

            <div style={styles.mainContainer}>
                {/* CONTENEDOR MÓVIL (Ancho completo) */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: isMobile ? '100%' : '350px', flexShrink: 0}}>
                    
                    {/* INFO USUARIO */}
                    <div style={{...styles.cardStyle, padding: '15px', background: '#0a3d62', color: 'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            <div style={avatarStyle}>{userData.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U'}</div>
                            <div>
                                <div style={{fontWeight:'bold'}}>{isGuest ? 'Invitado' : userData.nombre.split(' ')[0]}</div>
                                <div style={{fontSize:'0.8rem', opacity:0.8}}>{userData.placa || 'VISITA'}</div>
                            </div>
                        </div>
                        <span style={{background:'#ffc107', color:'black', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem', fontWeight:'bold'}}>
                            {isGuest ? '3H' : '8H'}
                        </span>
                    </div>

                    <form onSubmit={handleReserva}>
                        <section style={styles.cardStyle}>
                            <h3 style={styles.titleStyle}><FaClock color="#ffc107" style={{marginRight:'8px'}}/> Reserva</h3>
                            
                            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={styles.labelStyle}>Fecha</label>
                                    <input type="date" style={styles.inputStyle} value={reservaForm.fecha} min={fechaHoy} max={isGuest ? fechaHoy : fechaMax} 
                                        onKeyDown={e=>e.preventDefault()} onChange={e=>setReservaForm({...reservaForm, fecha:e.target.value, espacio:null})} 
                                    />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={styles.labelStyle}>Hora</label>
                                    <input type="time" style={styles.inputStyle} value={reservaForm.hora} onChange={e=>setReservaForm({...reservaForm, hora:e.target.value})} />
                                </div>
                            </div>

                            {/* MAPA MÓVIL: Siempre visible para scrollear */}
                            {isMobile && <MapaComponent />}

                            <button type="submit" disabled={!reservaForm.espacio} style={{...styles.mainBtn, background: reservaForm.espacio ? '#0a3d62' : '#94a3b8'}}>
                                {reservaForm.espacio ? `Reservar Puesto #${reservaForm.espacio}` : "Selecciona un puesto"}
                            </button>
                        </section>
                    </form>

                    {/* LISTA RESERVAS - ESTILO MEJORADO MÓVIL */}
                    {misReservas.length > 0 && (
                        <section style={styles.cardStyle}>
                            <h4 style={{...styles.titleStyle, marginBottom:'10px'}}>Tu Reserva Activa</h4>
                            {misReservas.map(res => (
                                <div key={res.id} style={styles.reservaItem}>
                                    <div style={{flex: 1, paddingRight: '10px'}}>
                                        <div style={{fontWeight:'bold', color:'#0a3d62', fontSize:'1.1rem'}}>#{res.espacio} - {res.lugar}</div>
                                        <div style={{fontSize:'0.85rem', color:'#555', marginTop: '4px'}}>{res.fecha} • {res.hora}</div>
                                    </div>
                                    <div style={{display:'flex', gap:'8px'}}>
                                        {/* BOTONES MÁS GRANDES PARA EL DEDO */}
                                        <button onClick={()=>generarTicketPro(res)} style={styles.actionBtnPrimary} title="Ticket"><FaDownload/></button>
                                        <button onClick={()=>liberarPuesto(res.id)} style={styles.actionBtnDanger} title="Liberar"><FaTrashAlt/></button>
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}
                </div>

                {!isMobile && <div style={{flex:1}}><MapaComponent /></div>}
            </div>
        </div>
    );
};

const styles = {
    mainContainer: { display: 'flex', gap: '20px', '@media (max-width: 900px)': { flexDirection: 'column' } },
    cardStyle: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '15px' },
    mapCardStyle: { background: '#fff', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '15px' },
    titleStyle: { marginTop: 0, color: '#0a3d62', fontSize:'1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
    labelStyle: { fontSize:'0.8rem', color:'#666', fontWeight:'600', marginBottom: '4px', display: 'block' },
    inputStyle: { width: '100%', padding: '12px', borderRadius: '10px', border:'1px solid #e2e8f0', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', background: '#f8fafc' },
    mainBtn: { width: '100%', padding: '14px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight:'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' },
    
    // Estilo tarjeta reserva móvil mejorado
    reservaItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', background:'#f8fafc', borderRadius:'12px', borderLeft:'5px solid #22c55e', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
    
    // Botones grandes para móvil
    actionBtnPrimary: { border:'none', background:'#e3f2fd', color:'#1976d2', width: '45px', height: '45px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
    actionBtnDanger: { border:'none', background:'#fee2e2', color:'#e30613', width: '45px', height: '45px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },

    mapHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    legend: { display: 'flex', gap: '8px', fontSize: '0.7rem' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '4px', color: '#555' },
    legendBoxFree: { width: '10px', height: '10px', background: '#fff', border: '1px solid #ddd' },
    legendBoxOccupied: { width: '10px', height: '10px', background: '#dfe6e9' },
    legendBoxSelected: { width: '10px', height: '10px', background: '#0a3d62' },
    mapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '8px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' },
    mapGridMobile: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: '6px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #f1f5f9', padding:'5px', borderRadius:'8px' },
    spotStyle: { height: '45px', borderRadius:'6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.8rem', fontWeight: 'bold', cursor: 'pointer' },
    spotStyleMobile: { height: '42px', borderRadius:'8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.9rem', fontWeight: 'bold', cursor: 'pointer' }
};

const bgStyle = { minHeight: '100vh', background: '#f1f5f9', padding: '10px', boxSizing: 'border-box' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '12px 15px', background: '#fff', borderRadius:'16px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const brandStyle = { fontSize: '1.2rem', fontWeight: 'bold', display:'flex', alignItems:'center', color:'#0a3d62' };
const avatarStyle = { width: '35px', height:'35px', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', color:'white', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold', fontSize: '0.9rem' };
const logoutBtn = { background: 'none', border: 'none', color: '#e30613', cursor:'pointer', padding: '5px' };
const addGlobalStyles = () => { const style = document.createElement('style'); style.innerHTML = ` .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0a3d62; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `; document.head.appendChild(style); }; addGlobalStyles();

export default DashboardUser;