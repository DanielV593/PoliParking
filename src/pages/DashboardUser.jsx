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
    
    const [userData, setUserData] = useState({ nombre: '', placa: '', email: '', rol: '' });
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

    // CAPACIDADES ACTUALIZADAS
    const CAPACIDADES = { 
        "Edificio CEC": 100, 
        "Facultad de Sistemas": 35, 
        "Canchas Deportivas": 50 
    };

    // --- LÓGICA DE TIEMPO (8 Horas Estudiante / 3 Horas Invitado) ---
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicioReserva = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const horasPermitidas = reserva.rol === 'invitado' ? 3 : 8;
                const finReserva = inicioReserva + (horasPermitidas * 60 * 60 * 1000);
                const tiempoRestanteMin = Math.floor((finReserva - ahora) / (60 * 1000));
                
                if (ahora >= finReserva) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Reserva Expirada', `Tu tiempo en el puesto #${reserva.espacio} terminó.`, 'info');
                } else if ([30, 20, 10].includes(tiempoRestanteMin)) {
                    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000 }).fire({
                        icon: 'warning', title: `Tu reserva #${reserva.espacio} vence en ${tiempoRestanteMin} min.`
                    });
                }
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- PDF PROFESIONAL ---
    const generarTicketPro = async (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();
            docPDF.setDrawColor(10, 61, 98); docPDF.setLineWidth(1); docPDF.circle(pageWidth / 2, 18, 10, 'S'); 
            docPDF.setFontSize(22); docPDF.setFont("helvetica", "bold"); docPDF.text("P", pageWidth / 2, 21.5, { align: 'center' });
            docPDF.setFontSize(18); docPDF.text("POLIPARKING", pageWidth / 2, 38, { align: 'center' });
            docPDF.setFontSize(8); docPDF.setFont("helvetica", "normal"); docPDF.text("Comprobante de Reserva - EPN", pageWidth / 2, 43, { align: 'center' });
            docPDF.setLineWidth(0.5); docPDF.line(10, 48, 70, 48);
            
            const xPos = 12; 
            docPDF.setFontSize(9); 
            docPDF.setFont("helvetica", "bold"); docPDF.text("USUARIO:", xPos, 65);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.nombre || userData.nombre || "Usuario").toUpperCase(), xPos, 69);
            docPDF.setFont("helvetica", "bold"); docPDF.text("PLACA:", xPos, 77);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.placa || userData.placa || "N/A").toUpperCase(), xPos, 81);
            docPDF.setFont("helvetica", "bold"); docPDF.text("UBICACIÓN:", xPos, 89);
            docPDF.setFont("helvetica", "normal"); docPDF.text((reserva.lugar || "CEC").toUpperCase(), xPos, 93);
            docPDF.setDrawColor(200); docPDF.line(10, 98, 70, 98);
            
            docPDF.setFont("helvetica", "bold"); docPDF.text("FECHA:", xPos, 105);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.fecha, 35, 105);
            docPDF.setFont("helvetica", "bold"); docPDF.text("HORA:", xPos, 110);
            docPDF.setFont("helvetica", "normal"); docPDF.text(reserva.hora, 35, 110);
            
            docPDF.setDrawColor(0); docPDF.setLineWidth(0.7); docPDF.rect(15, 125, 50, 15); 
            docPDF.setFontSize(16); docPDF.setFont("helvetica", "bold"); 
            docPDF.text(`PUESTO: ${reserva.espacio || '?'}`, pageWidth / 2, 135, { align: 'center' });
            docPDF.save(`Ticket_${reserva.placa || 'parking'}.pdf`);
        } catch (e) { console.error(e); }
    };

    // --- AUTH Y CARGA DE ROL ---
    useEffect(() => {
        if (isGuest) {
            setUserData({ nombre: 'Invitado', placa: 'VISITA', email: guestIdRef.current, rol: 'invitado' });
            setLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setUserData({ ...data, email: user.email });
                }
            } else { navigate('/login'); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate, isGuest]);

    // --- DATA MONITOR ---
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
            await addDoc(collection(db, "reservas"), { 
                ...reservaForm, usuario: userData.email, rol: userData.rol, nombre: userData.nombre, placa: userData.placa
            });
            
            Swal.fire({ title: '¡Listo!', text: 'Reserva confirmada.', icon: 'success', confirmButtonText: 'Descargar Ticket' }).then((r) => { 
                if(r.isConfirmed) generarTicketPro({ ...reservaForm, nombre: userData.nombre, placa: userData.placa });
            });
            setReservaForm({ ...reservaForm, espacio: null });
        } catch (e) { Swal.fire('Error', 'Intenta nuevamente.', 'error'); }
    };

    const liberarPuesto = async (id) => {
        if ((await Swal.fire({ title: '¿Liberar?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await deleteDoc(doc(db, "reservas", id));
            Swal.fire('Liberado', '', 'success');
        }
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><div className="spinner"></div></div>;

    // --- COMPONENTE DE MAPA ---
    const MapaComponent = () => (
        <div style={styles.mapCardStyle}>
            <div style={styles.mapHeader}>
                <h3 style={styles.titleStyle}>🗺️ Mapa: {reservaForm.lugar}</h3>
                <div style={styles.legend}>
                    <div style={styles.legendItem}><div style={styles.legendBoxFree}></div>Libre</div>
                    <div style={styles.legendItem}><div style={styles.legendBoxOccupied}></div>Ocupado</div>
                    <div style={styles.legendItem}><div style={styles.legendBoxSelected}></div>Seleccionado</div>
                </div>
            </div>
            <div style={isMobile ? styles.mapGridMobile : styles.mapGrid}>
                {[...Array(CAPACIDADES[reservaForm.lugar])].map((_, i) => {
                    const num = i + 1; 
                    const estaOcupado = reservasTotales.some(r => r.espacio === num); 
                    const estaSeleccionado = reservaForm.espacio === num;
                    return (
                        <button key={num} onClick={() => !estaOcupado && setReservaForm({...reservaForm, espacio: num})} disabled={estaOcupado} type="button"
                            style={{
                                ...(isMobile ? styles.spotStyleMobile : styles.spotStyle),
                                background: estaOcupado ? '#dfe6e9' : (estaSeleccionado ? '#0a3d62' : '#fff'),
                                color: estaOcupado ? '#b2bec3' : (estaSeleccionado ? '#fff' : '#333'),
                                border: estaSeleccionado ? '2px solid #ffc107' : '1px solid #ddd',
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

            <div style={{...styles.mainContainer, flexDirection: isMobile ? 'column' : 'row'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: isMobile ? '100%' : '350px', flexShrink: 0}}>
                    
                    {/* INFO USUARIO */}
                    <div style={{...styles.cardStyle, padding: '15px', background: '#0a3d62', color: 'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            <div style={avatarStyle}>{userData.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U'}</div>
                            <div>
                                <div style={{fontWeight:'bold'}}>{userData.nombre}</div>
                                <div style={{fontSize:'0.8rem', opacity:0.8}}>{userData.rol.toUpperCase()}</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleReserva}>
                        <section style={styles.cardStyle}>
                            <h3 style={styles.titleStyle}><FaClock color="#ffc107" style={{marginRight:'8px'}}/> Reserva</h3>
                            
                            <label style={styles.labelStyle}>Ubicación:</label>
                            {userData.rol === 'docente' ? (
                                <select 
                                    style={styles.inputStyle} 
                                    value={reservaForm.lugar}
                                    onChange={(e) => setReservaForm({...reservaForm, lugar: e.target.value, espacio: null})}
                                >
                                    {Object.keys(CAPACIDADES).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            ) : (
                                <input style={{...styles.inputStyle, background:'#f0f0f0', cursor:'not-allowed'}} value="Edificio CEC" disabled />
                            )}

                            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={styles.labelStyle}>Fecha</label>
                                    <input type="date" style={styles.inputStyle} value={reservaForm.fecha} min={fechaHoy} max={isGuest ? fechaHoy : fechaMax} onChange={e=>setReservaForm({...reservaForm, fecha:e.target.value, espacio:null})} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={styles.labelStyle}>Hora</label>
                                    <input type="time" style={styles.inputStyle} value={reservaForm.hora} onChange={e=>setReservaForm({...reservaForm, hora:e.target.value})} />
                                </div>
                            </div>

                            {isMobile && <MapaComponent />}

                            <button type="submit" disabled={!reservaForm.espacio} style={{...styles.mainBtn, background: reservaForm.espacio ? '#0a3d62' : '#94a3b8'}}>
                                {reservaForm.espacio ? `Reservar Puesto #${reservaForm.espacio}` : "Selecciona en el mapa"}
                            </button>
                        </section>
                    </form>

                    {/* MIS RESERVAS */}
                    {misReservas.length > 0 && (
                        <section style={styles.cardStyle}>
                            <h4 style={styles.titleStyle}>Tu Reserva Activa</h4>
                            {misReservas.map(res => (
                                <div key={res.id} style={styles.reservaItem}>
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight:'bold', color:'#0a3d62'}}>#{res.espacio} - {res.lugar}</div>
                                        <div style={{fontSize:'0.8rem', color:'#666'}}>{res.fecha} • {res.hora}</div>
                                    </div>
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <button onClick={()=>generarTicketPro(res)} style={styles.actionBtnPrimary}><FaDownload/></button>
                                        <button onClick={()=>liberarPuesto(res.id)} style={styles.actionBtnDanger}><FaTrashAlt/></button>
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
    mainContainer: { display: 'flex', gap: '20px' },
    cardStyle: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '15px' },
    mapCardStyle: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '15px' },
    titleStyle: { marginTop: 0, color: '#0a3d62', fontSize:'1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
    labelStyle: { fontSize:'0.75rem', color:'#666', fontWeight:'600', marginBottom: '4px', display: 'block' },
    inputStyle: { width: '100%', padding: '12px', borderRadius: '10px', border:'1px solid #e2e8f0', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '10px' },
    mainBtn: { width: '100%', padding: '14px', color: '#fff', border: 'none', borderRadius: '10px', fontWeight:'bold', cursor: 'pointer', fontSize: '1rem' },
    reservaItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'#f8fafc', borderRadius:'12px', borderLeft:'5px solid #ffc107', marginTop: '10px' },
    actionBtnPrimary: { border:'none', background:'#e3f2fd', color:'#1976d2', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    actionBtnDanger: { border:'none', background:'#fee2e2', color:'#e30613', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    mapHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
    legend: { display: 'flex', gap: '10px', fontSize: '0.75rem' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
    legendBoxFree: { width: '12px', height: '12px', background: '#fff', border: '1px solid #ddd' },
    legendBoxOccupied: { width: '12px', height: '12px', background: '#dfe6e9' },
    legendBoxSelected: { width: '12px', height: '12px', background: '#0a3d62' },
    mapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '10px' },
    mapGridMobile: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '5px', maxHeight: '300px', overflowY: 'auto', padding: '5px' },
    spotStyle: { height: '45px', borderRadius:'8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    spotStyleMobile: { height: '40px', borderRadius:'6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.8rem', fontWeight: 'bold' }
};

const bgStyle = { minHeight: '100vh', background: '#f1f5f9', padding: '15px' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '15px 5%', background: '#fff', borderRadius:'16px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const brandStyle = { fontSize: '1.4rem', fontWeight: 'bold', display:'flex', alignItems:'center', color:'#0a3d62' };
const avatarStyle = { width: '35px', height:'35px', background:'#ffc107', color:'#0a3d62', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold' };
const logoutBtn = { background: '#fee2e2', border: 'none', color: '#e30613', cursor:'pointer', padding: '10px', borderRadius: '50%' };

export default DashboardUser;