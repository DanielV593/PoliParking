import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaSignOutAlt, FaDownload, FaTrashAlt, FaClock, FaParking } from 'react-icons/fa';
import jsPDF from 'jspdf';

const DashboardGuest = () => {
    const navigate = useNavigate();
    const [guestInfo, setGuestInfo] = useState(JSON.parse(localStorage.getItem('guestData')) || null);
    const [reservasTotales, setReservasTotales] = useState([]);
    const [misReservas, setMisReservas] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- CONFIGURACIÓN DE FECHAS (Hoy + 2 días) ---
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

    // RESTRICCIÓN: Solo Edificio CEC para invitados también
    const CAPACIDADES = { "Edificio CEC": 100 };

    // --- MONITOR DE EXPIRACIÓN Y NOTIFICACIONES (8 HORAS) ---
    useEffect(() => {
        if (misReservas.length === 0) return;
        const interval = setInterval(() => {
            const ahora = new Date().getTime();
            misReservas.forEach(async (reserva) => {
                const inicioReserva = new Date(`${reserva.fecha}T${reserva.hora}`).getTime();
                const finReserva = inicioReserva + (8 * 60 * 60 * 1000);
                const tiempoRestanteMin = Math.floor((finReserva - ahora) / (60 * 1000));

                if (ahora >= finReserva) {
                    await deleteDoc(doc(db, "reservas", reserva.id));
                    Swal.fire('Reserva Expirada', `Su tiempo de invitado en el puesto #${reserva.espacio} ha terminado.`, 'info');
                } else if ([30, 20, 10].includes(tiempoRestanteMin)) {
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true
                    });
                    Toast.fire({
                        icon: 'warning',
                        title: `¡Atención Invitado! Su reserva #${reserva.espacio} vence en ${tiempoRestanteMin} minutos.`
                    });
                }
            });
        }, 60000);
        return () => clearInterval(interval);
    }, [misReservas]);

    // --- GENERADOR DE TICKET PROFESIONAL PARA INVITADOS ---
    const generarTicketPro = async (reserva) => {
        try {
            const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 160] });
            const pageWidth = docPDF.internal.pageSize.getWidth();

            // Logo Visual
            docPDF.setDrawColor(10, 61, 98);
            docPDF.setLineWidth(1);
            docPDF.circle(pageWidth / 2, 18, 10, 'S'); 
            docPDF.setFontSize(22);
            docPDF.setFont("helvetica", "bold");
            docPDF.text("P", pageWidth / 2, 21.5, { align: 'center' });

            // Cabecera
            docPDF.setFontSize(18);
            docPDF.text("POLIPARKING", pageWidth / 2, 38, { align: 'center' });
            docPDF.setFontSize(8);
            docPDF.setFont("helvetica", "normal");
            docPDF.text("Comprobante de Reserva - INVITADO EPN", pageWidth / 2, 43, { align: 'center' });

            docPDF.setLineWidth(0.5);
            docPDF.line(10, 48, 70, 48);
            
            docPDF.setFontSize(12);
            docPDF.setFont("helvetica", "bold");
            docPDF.text("DETALLES DEL TICKET", pageWidth / 2, 55, { align: 'center' });

            const xPos = 12;
            docPDF.setFontSize(9);
            docPDF.text("INVITADO:", xPos, 65);
            docPDF.setFont("helvetica", "normal");
            docPDF.text((guestInfo.nombre || "Invitado").toUpperCase(), xPos, 69);

            docPDF.setFont("helvetica", "bold");
            docPDF.text("PLACA:", xPos, 77);
            docPDF.setFont("helvetica", "normal");
            docPDF.text((guestInfo.placa || "N/A").toUpperCase(), xPos, 81);

            docPDF.setFont("helvetica", "bold");
            docPDF.text("UBICACIÓN:", xPos, 89);
            docPDF.setFont("helvetica", "normal");
            docPDF.text((reserva.lugar || "CEC").toUpperCase(), xPos, 93);

            docPDF.setDrawColor(200);
            docPDF.line(10, 98, 70, 98);
            
            docPDF.setFont("helvetica", "bold");
            docPDF.text("FECHA ENTRADA:", xPos, 105);
            docPDF.setFont("helvetica", "normal");
            docPDF.text(reserva.fecha, 50, 105);

            docPDF.setFont("helvetica", "bold");
            docPDF.text("HORA ENTRADA:", xPos, 112);
            docPDF.setFont("helvetica", "normal");
            docPDF.text(reserva.hora, 50, 112);

            docPDF.setFont("helvetica", "bold");
            docPDF.text("VALIDEZ MÁXIMA:", xPos, 119);
            docPDF.setFont("helvetica", "normal");
            docPDF.text("8 HORAS", 50, 119);

            docPDF.setDrawColor(0);
            docPDF.setLineWidth(0.7);
            docPDF.rect(15, 125, 50, 15); 
            docPDF.setFontSize(16);
            docPDF.setFont("helvetica", "bold");
            docPDF.text(`PUESTO: ${reserva.espacio || '?'}`, pageWidth / 2, 135, { align: 'center' });

            docPDF.setFontSize(7);
            docPDF.text("Presente este ticket al ingresar. Validez 8 horas.", pageWidth / 2, 150, { align: 'center' });
            docPDF.text("Horario de atención: 07:00 - 20:00", pageWidth / 2, 154, { align: 'center' });

            docPDF.save(`Ticket_Invitado_${guestInfo.placa}.pdf`);
            Swal.fire('¡Éxito!', 'Ticket de invitado generado.', 'success');
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (!guestInfo || role !== 'invitado') { navigate('/login'); return; }
        setLoading(false);
    }, [guestInfo, navigate]);

    useEffect(() => {
        if (!guestInfo) return;
        const qMapa = query(collection(db, "reservas"), where("fecha", "==", reservaForm.fecha), where("lugar", "==", reservaForm.lugar));
        const unsubMapa = onSnapshot(qMapa, (s) => setReservasTotales(s.docs.map(d => d.data())));
        
        const qMias = query(collection(db, "reservas"), where("usuario", "==", guestInfo.placa));
        const unsubMias = onSnapshot(qMias, (s) => setMisReservas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubMapa(); unsubMias(); };
    }, [reservaForm.fecha, reservaForm.lugar, guestInfo]);

    const handleReserva = async (e) => {
        e.preventDefault();
        const horaSeleccionada = parseInt(reservaForm.hora.split(':')[0]);
        if (horaSeleccionada < 7 || horaSeleccionada >= 20) {
            return Swal.fire('Error', 'Horario de invitados: 07:00 AM a 08:00 PM.', 'error');
        }
        if (!reservaForm.espacio) return Swal.fire('Aviso', 'Seleccione un puesto en el mapa', 'info');

        const res = await Swal.fire({
            title: '¿Confirmar Reserva?',
            text: `Puesto #${reservaForm.espacio} - ${reservaForm.fecha} a las ${reservaForm.hora}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            confirmButtonText: 'Reservar'
        });

        if (res.isConfirmed) {
            try {
                const q = query(collection(db, "reservas"), where("usuario", "==", guestInfo.placa), where("fecha", "==", reservaForm.fecha));
                const snap = await getDocs(q);
                if (!snap.empty) return Swal.fire('Límite', 'Ya existe una reserva para esta placa hoy.', 'warning');

                await addDoc(collection(db, "reservas"), { 
                    ...reservaForm, 
                    usuario: guestInfo.placa, 
                    nombre_invitado: guestInfo.nombre,
                    rol: 'invitado' 
                });
                
                Swal.fire({
                    title: '¡Reserva Exitosa!',
                    text: 'Su ticket tiene una validez de 8 horas.',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Descargar Ticket'
                }).then((pdfRes) => { if(pdfRes.isConfirmed) generarTicketPro(reservaForm); });
                
                setReservaForm({ ...reservaForm, espacio: null });
            } catch (e) { Swal.fire('Error', 'No se pudo procesar la reserva', 'error'); }
        }
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',paddingTop:'100px'}}><h2>Cargando Dashboard...</h2></div>;

    return (
        <div style={bgStyle}>
            <nav style={navStyle}>
                <div style={brandStyle}><FaParking color="#ffc107"/> POLI<span style={{color:'#ffc107'}}>PARKING</span></div>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{textAlign:'right', lineHeight:'1.2'}}>
                        <div style={{fontWeight:'bold', color:'#0a3d62', fontSize:'0.9rem'}}>Invitado: {guestInfo.nombre}</div>
                        <div style={{fontSize:'0.75rem', color:'#888'}}>Placa: {guestInfo.placa}</div>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/'); }} style={logoutBtn}><FaSignOutAlt/> Salir</button>
                </div>
            </nav>

            <div style={mainGrid}>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <section style={cardStyle}>
                        <h3 style={titleStyle}>Nueva Reserva Invitado</h3>
                        <form onSubmit={handleReserva}>
                            <label style={labelStyle}>Ubicación (Solo CEC):</label>
                            <input style={{...inputStyle, background: '#f0f0f0', cursor: 'not-allowed'}} value="Edificio CEC" disabled />
                            
                            <label style={labelStyle}>Fecha (Hoy + 2 días):</label>
                            <input 
                                type="date" 
                                style={inputStyle} 
                                value={reservaForm.fecha} 
                                min={fechaHoy} 
                                max={fechaMax}
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={(e) => setReservaForm({...reservaForm, fecha: e.target.value, espacio: null})}
                            />

                            <label style={labelStyle}>Hora de inicio:</label>
                            <input 
                                type="time" 
                                style={inputStyle} 
                                value={reservaForm.hora}
                                onChange={(e) => setReservaForm({...reservaForm, hora: e.target.value})}
                            />

                            <button type="submit" style={mainBtn}>{reservaForm.espacio ? `Reservar #${reservaForm.espacio}` : "Seleccione en el mapa"}</button>
                        </form>
                    </section>

                    <section style={cardStyle}>
                        <h4 style={titleStyle}>Mis Tickets</h4>
                        {misReservas.map(res => (
                            <div key={res.id} style={reservaItem}>
                                <div>
                                    <div style={{fontWeight:'bold'}}>#{res.espacio} - {res.lugar}</div>
                                    <div style={{fontSize:'0.7rem'}}><FaClock/> {res.fecha} | {res.hora}</div>
                                </div>
                                <div style={{display:'flex', gap:'8px'}}>
                                    <button onClick={() => generarTicketPro(res)} style={iconBtn}><FaDownload/></button>
                                    <button onClick={() => deleteDoc(doc(db, "reservas", res.id))} style={{...iconBtn, color:'red', background:'#fee2e2'}}><FaTrashAlt/></button>
                                </div>
                            </div>
                        ))}
                    </section>
                </div>

                <section style={cardStyle}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3 style={titleStyle}>Mapa: Edificio CEC ({reservaForm.fecha})</h3>
                        <div style={{fontSize:'0.8rem', color:'#666'}}>{100 - reservasTotales.length} Libres</div>
                    </div>
                    <div style={mapGrid}>
                        {[...Array(100)].map((_, i) => {
                            const num = i + 1;
                            const oc = reservasTotales.some(r => r.espacio === num);
                            const sel = reservaForm.espacio === num;
                            return (
                                <div key={num} onClick={() => !oc && setReservaForm({...reservaForm, espacio: num})}
                                    style={{ ...spotStyle, background: oc ? '#dfe6e9' : (sel ? '#0a3d62' : '#fff'), color: oc ? '#b2bec3' : (sel ? '#fff' : '#333'), border: sel ? '2px solid #ffc107' : '1px solid #eee', cursor: oc ? 'not-allowed' : 'pointer' }}
                                >{num}</div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

// ESTILOS UNIFICADOS
const bgStyle = { minHeight: '100vh', background: '#f4f7f6', padding: '20px' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '10px 5%', background: '#fff', borderRadius:'12px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const brandStyle = { fontSize: '1.2rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px', color:'#0a3d62' };
const logoutBtn = { background: '#e30613', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor:'pointer', fontSize:'0.9rem', fontWeight:'bold' };
const mainGrid = { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const titleStyle = { marginTop: 0, color: '#0a3d62', fontSize:'1rem', marginBottom:'10px' };
const labelStyle = { fontSize:'0.75rem', color:'#666', fontWeight:'bold' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border:'1px solid #eee', outline:'none' };
const mainBtn = { width: '100%', padding: '12px', background: '#0a3d62', color: '#fff', border: 'none', borderRadius: '8px', fontWeight:'bold', cursor:'pointer' };
const mapGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '8px' };
const spotStyle = { height: '45px', borderRadius:'8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'0.8rem', fontWeight: 'bold' };
const reservaItem = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'#f8f9fa', borderRadius:'10px', marginBottom:'8px', borderLeft:'4px solid #ffc107' };
const iconBtn = { border:'none', background:'#e3f2fd', color:'#1976d2', padding:'8px', borderRadius:'8px', cursor:'pointer' };

export default DashboardGuest;