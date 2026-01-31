import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { signOut } from 'firebase/auth'; 

const DashboardUser = () => {
    const navigate = useNavigate();
    const [realRole, setRealRole] = useState(null);
    const [reservasTotales, setReservasTotales] = useState([]);
    const [misReservas, setMisReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5); 
    const fechaHoy = today.toISOString().split('T')[0];
    const fechaMax = maxDate.toISOString().split('T')[0];

    const [reservaForm, setReservaForm] = useState({
        lugar: 'Edificio CEC',
        fecha: fechaHoy,
        hora: "07:30",
        espacio: null
    });

    const CAPACIDADES = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };
    const horasServicio = ["06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

    // --- LÓGICA DE LIMPIEZA AUTOMÁTICA (SOLO PARA ESTE USUARIO) ---
    const limpiarReservasVencidas = async (email) => {
        try {
            const q = query(collection(db, "reservas"), where("usuario", "==", email));
            const querySnapshot = await getDocs(q);
            const hoyStr = new Date().toISOString().split('T')[0];

            querySnapshot.forEach(async (documento) => {
                if (documento.data().fecha < hoyStr) {
                    await deleteDoc(doc(db, "reservas", documento.id));
                }
            });
        } catch (error) {
            console.error("Error al limpiar caducados:", error);
        }
    };

    useEffect(() => {
        const savedRole = localStorage.getItem('userRole');
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Ejecutar limpieza al entrar
                limpiarReservasVencidas(user.email);
                try {
                    const q = query(collection(db, "usuarios"), where("email", "==", user.email));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        setRealRole(querySnapshot.docs[0].data().rol);
                    } else {
                        setRealRole(savedRole || 'estudiante');
                    }
                } catch (error) {
                    setRealRole(savedRole);
                }
            } else if (savedRole === 'invitado') {
                setRealRole('invitado');
            } else {
                navigate('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!realRole) return;

        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (snapshot) => {
            setReservasTotales(snapshot.docs.map(d => d.data()));
        });

        const identificador = auth.currentUser?.email || "Invitado_Anonimo";
        const qMias = query(collection(db, "reservas"), where("usuario", "==", identificador));
        
        const unsubMias = onSnapshot(qMias, (snapshot) => {
            setMisReservas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, realRole]);

    const handleReserva = async (e) => {
        e.preventDefault();
        const identificador = auth.currentUser?.email || "Invitado_Anonimo";

        if (reservaForm.fecha < fechaHoy) {
            return Swal.fire('Error', 'No puedes reservar en el pasado.', 'error');
        }
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Selecciona un espacio.', 'info');
        
        try {
            const q = query(collection(db, "reservas"), where("usuario", "==", identificador), where("fecha", "==", reservaForm.fecha));
            const snap = await getDocs(q);
            if (!snap.empty) return Swal.fire('Límite', 'Ya tienes reserva hoy.', 'warning');

            await addDoc(collection(db, "reservas"), {
                ...reservaForm,
                usuario: identificador,
                rol: realRole
            });
            Swal.fire('Éxito', 'Reserva confirmada', 'success');
            setReservaForm({...reservaForm, espacio: null});
        } catch (e) { 
            Swal.fire('Error', 'No se pudo reservar', 'error'); 
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f4f7f6'}}>
            <h2 style={{color:'#0a3d62'}}>Cargando PoliParking...</h2>
        </div>
    );

    return (
        <div style={bgStyle}>
            <nav style={navStyle}>
                <div style={brandStyle}><span style={{color:'#0a3d62'}}>POLI</span><span style={{color:'#ffc107'}}>PARKING</span></div>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <span style={{fontSize:'0.9rem'}}>Hola, <strong>{auth.currentUser?.email?.split('@')[0] || 'Invitado'}</strong></span>
                    <button onClick={handleLogout} style={logoutBtn}>Salir</button>
                </div>
            </nav>

            <div style={mainGrid}>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <section style={glassCard}>
                        <h3 style={sectionTitle}>Nueva Reserva</h3>
                        <form onSubmit={handleReserva}>
                            <label style={labelStyle}>Ubicación</label>
                            <select style={inputStyle} value={reservaForm.lugar} onChange={(e) => setReservaForm({...reservaForm, lugar: e.target.value, espacio: null})}>
                                <option value="Edificio CEC">Edificio CEC</option>
                                {realRole === 'docente' && (
                                    <>
                                        <option value="Facultad de Sistemas">Facultad de Sistemas</option>
                                        <option value="Canchas Deportivas">Canchas Deportivas</option>
                                    </>
                                )}
                            </select>

                            <div style={{display:'flex', gap:'10px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Fecha</label>
                                    <input type="date" min={fechaHoy} max={fechaMax} style={inputStyle} value={reservaForm.fecha} onChange={(e) => setReservaForm({...reservaForm, fecha: e.target.value})} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Hora</label>
                                    <select style={inputStyle} value={reservaForm.hora} onChange={(e) => setReservaForm({...reservaForm, hora: e.target.value})}>
                                        {horasServicio.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" style={mainBtn}>Reservar Espacio {reservaForm.espacio || ''}</button>
                        </form>
                    </section>

                    <section style={glassCard}>
                        <h4 style={{color:'#0a3d62', marginBottom:'15px', fontSize:'0.9rem'}}>Tus Reservas</h4>
                        {misReservas.length === 0 ? (
                            <p style={{fontSize:'0.8rem', color:'#888'}}>No hay reservas activas.</p>
                        ) : (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                {misReservas.map(res => (
                                    <div key={res.id} style={{
                                        ...reservaItem,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        borderLeft: '4px solid #ffc107'
                                    }}>
                                        <div>
                                            <div style={{fontWeight: 'bold', color: '#0a3d62', fontSize: '0.85rem'}}>
                                                Puesto #{res.espacio} - {res.lugar}
                                            </div>
                                            <div style={{fontSize: '0.75rem', color: '#666'}}>
                                                📅 {res.fecha} | 🕒 {res.hora}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                Swal.fire({
                                                    title: '¿Cancelar reserva?',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#e30613',
                                                    confirmButtonText: 'Sí, cancelar'
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        deleteDoc(doc(db, "reservas", res.id));
                                                        Swal.fire('Eliminada', 'La reserva ha sido cancelada.', 'success');
                                                    }
                                                });
                                            }} 
                                            style={{border:'none', color:'#e30613', background:'#fee2e2', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section style={glassCard}>
                    <h3 style={sectionTitle}>Mapa: {reservaForm.lugar}</h3>
                    <div style={mapGrid}>
                        {[...Array(CAPACIDADES[reservaForm.lugar] || 0)].map((_, i) => {
                            const num = i + 1;
                            const estaOcupado = reservasTotales.some(r => r.espacio === num);
                            return (
                                <div key={num} onClick={() => !estaOcupado && setReservaForm({...reservaForm, espacio: num})}
                                    style={{
                                        ...spotStyle, 
                                        background: estaOcupado ? '#dfe6e9' : (reservaForm.espacio === num ? '#0a3d62' : '#fff'),
                                        color: estaOcupado ? '#b2bec3' : (reservaForm.espacio === num ? '#fff' : '#000'),
                                        cursor: estaOcupado ? 'not-allowed' : 'pointer'
                                    }}
                                >{num}</div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

const bgStyle = { minHeight: '100vh', background: '#f4f7f6', padding: '20px' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '10px 5%', background: '#fff', borderRadius:'10px', marginBottom: '20px' };
const brandStyle = { fontSize: '1.2rem', fontWeight: 'bold' };
const logoutBtn = { background: '#e30613', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor:'pointer' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' };
const glassCard = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const sectionTitle = { color: '#0a3d62', marginBottom:'15px', fontSize:'1rem' };
const labelStyle = { fontSize:'0.75rem', fontWeight:'bold', color:'#666' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 10px 0', borderRadius:'6px', border:'1px solid #ddd' };
const mainBtn = { width: '100%', padding: '12px', background: '#0a3d62', color: '#fff', border: 'none', borderRadius: '8px', fontWeight:'bold', cursor:'pointer' };
const mapGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '6px', maxHeight: '450px', overflowY: 'auto' };
const spotStyle = { height: '40px', border: '1px solid #eee', borderRadius:'4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.75rem' };
const reservaItem = { display:'flex', justifyContent:'space-between', padding:'8px', background:'#f8f9fa', borderRadius:'6px', marginBottom:'5px', fontSize:'0.8rem' };

export default DashboardUser;