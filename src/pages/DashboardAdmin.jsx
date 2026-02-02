import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { 
    collection, deleteDoc, doc, updateDoc, addDoc, query, orderBy, writeBatch, onSnapshot 
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FaChartBar, FaUsers, FaEnvelope, FaCar, FaSignOutAlt, FaTrashAlt, FaCheckSquare, FaSquare, FaFilter, FaCheckCircle, FaBan, FaHistory, FaUserCircle, FaSearch, FaExclamationTriangle, FaDownload, FaListUl, FaChartPie, FaDatabase, FaClock, FaBars, FaTimes } from 'react-icons/fa';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [moduloActivo, setModuloActivo] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const [modoMasivo, setModoMasivo] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [filtro, setFiltro] = useState({ texto: '', rol: 'todos', estado: 'activo' });
    const [filtroInvitados, setFiltroInvitados] = useState('');
    const [filtroHistorial, setFiltroHistorial] = useState({ texto: '', lugar: 'todos' });

    // ESTADOS PARA RESPONSIVE
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const CAPACIDAD = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const unsubU = onSnapshot(collection(db, "usuarios"), (s) => setUsuarios(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubR = onSnapshot(collection(db, "reservas"), (s) => setReservas(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubM = onSnapshot(query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc")), (s) => setMensajes(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubI = onSnapshot(collection(db, "ingresos_invitados"), (s) => setInvitados(s.docs.map(d => ({...d.data(), id: d.id}))));
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        setLoading(false);
        return () => { 
            unsubU(); unsubR(); unsubM(); unsubI(); 
            clearInterval(timer); 
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // --- ESTILOS INTERNOS PARA EL BUZÓN ---
    const messageCardStyle = { background: '#fff', border: '1px solid #edf2f7', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '15px' };
    const avatarCircle = { width: '35px', height: '35px', background: '#e2e8f0', color: '#0a3d62', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #0a3d62' };
    const messageBubble = { background: '#f8fafc', padding: '12px 16px', borderRadius: '0 12px 12px 12px', borderLeft: '4px solid #ffc107', fontSize: '0.95rem', fontStyle: 'italic', color: '#333', wordBreak: 'break-word' };
    const dateBadge = { fontSize: '0.7rem', color: '#718096', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' };
    const btnMiniDel = { background: '#fee2e2', border: 'none', color: '#e30613', fontSize: '0.75rem', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' };

    const handleCambioFiltroEstado = async (e) => {
        const nuevoEstado = e.target.value;
        if (nuevoEstado === 'bloqueado') {
            const { value: password } = await Swal.fire({
                title: 'Acceso Restringido',
                text: 'Ingrese la contraseña de administrador:',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonColor: '#0a3d62',
            });
            if (password === 'admin123') { setFiltro({ ...filtro, estado: nuevoEstado }); }
            else { 
                if (password !== undefined) Swal.fire('Error', 'Contraseña incorrecta', 'error');
                setFiltro({ ...filtro, estado: 'activo' }); 
            }
        } else { setFiltro({ ...filtro, estado: nuevoEstado }); }
    };

    const verPerfilUsuario = (u) => {
        const susReservas = reservas.filter(r => r.usuario === u.email);
        Swal.fire({
            title: `Perfil de ${u.nombre}`,
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Email:</strong> ${u.email}</p>
                    <p><strong>Placa:</strong> ${u.placa || 'N/A'}</p>
                    <p><strong>Rol:</strong> ${u.rol.toUpperCase()}</p>
                    <hr/>
                    <p><strong>Reservas actuales (${susReservas.length}):</strong></p>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${susReservas.length > 0 ? susReservas.map(r => `• ${r.fecha} - ${r.lugar} (#${r.espacio})<br/>`).join('') : 'Sin registros actuales'}
                    </div>
                </div>
            `,
            icon: 'info', confirmButtonColor: '#0a3d62'
        });
    };

    const handleLogout = async () => { 
        const result = await Swal.fire({ title: '¿Cerrar sesión?', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) { await signOut(auth); navigate('/'); }
    };

    const toggleSeleccion = (id) => {
        setSeleccionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const seleccionarTodo = (listaFiltrada) => {
        if (seleccionados.length === listaFiltrada.length) setSeleccionados([]);
        else setSeleccionados(listaFiltrada.map(u => u.id));
    };

    const ejecutarBorradoMasivo = async (coleccion) => {
        if (seleccionados.length === 0) return;
        const result = await Swal.fire({
            title: `¿Eliminar ${seleccionados.length} registros?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e30613'
        });
        if (result.isConfirmed) {
            try {
                const batch = writeBatch(db);
                seleccionados.forEach(id => { batch.delete(doc(db, coleccion, id)); });
                await batch.commit();
                Swal.fire('Eliminados', '', 'success');
                setSeleccionados([]);
            } catch (e) { Swal.fire('Error', 'Fallo masivo', 'error'); }
        }
    };

    const estanBloqueados = seleccionados.length > 0 && seleccionados.every(id => usuarios.find(user => user.id === id)?.estado === 'bloqueado');

    const ejecutarAccionMasivaUsuarios = async (tipo) => {
        if (seleccionados.length === 0) return;
        if (tipo === 'borrar') { await ejecutarBorradoMasivo('usuarios'); return; }
        let accionLabel = estanBloqueados ? 'Activar' : 'Desactivar';
        const result = await Swal.fire({ title: `¿${accionLabel} ${seleccionados.length} usuarios?`, icon: 'question', showCancelButton: true });
        if (result.isConfirmed) {
            try {
                const batch = writeBatch(db);
                seleccionados.forEach(id => {
                    const ref = doc(db, "usuarios", id);
                    batch.update(ref, { estado: estanBloqueados ? 'activo' : 'bloqueado' });
                });
                await batch.commit();
                Swal.fire('Éxito', 'Estado actualizado', 'success');
                setSeleccionados([]);
            } catch (e) { console.error(e); }
        }
    };

    const toggleBloqueo = async (u) => { 
        const estaBloqueado = (u.estado || 'activo') === 'bloqueado';
        const result = await Swal.fire({ title: `¿${estaBloqueado ? 'Activar':'Bloquear'} usuario?`, icon: 'question', showCancelButton: true });
        if (result.isConfirmed) {
            const nuevoEstado = estaBloqueado ? 'activo' : 'bloqueado';
            await updateDoc(doc(db, "usuarios", u.id), {estado: nuevoEstado}); 
        }
    };

    const eliminarRegistro = async (col, id) => { 
        const result = await Swal.fire({ title: '¿Borrar registro?', icon: 'warning', showCancelButton: true });
        if(result.isConfirmed){ await deleteDoc(doc(db, col, id)); Swal.fire('Borrado','','success'); } 
    };

    const getColorSemaforo = (ocupados, total) => {
        const porc = (ocupados / total) * 100;
        if (porc > 85) return '#e30613';
        if (porc > 50) return '#f39c12';
        return '#2ecc71';
    };

    const usuariosFiltrados = usuarios.filter(u => 
        (u.nombre.toLowerCase().includes(filtro.texto.toLowerCase()) || (u.placa || '').toLowerCase().includes(filtro.texto.toLowerCase())) &&
        (filtro.rol === 'todos' || u.rol === filtro.rol) && (u.estado || 'activo') === filtro.estado
    );

    const invitadosFiltrados = invitados.filter(i => 
        i.nombre.toLowerCase().includes(filtroInvitados.toLowerCase()) || (i.placa || '').toLowerCase().includes(filtroInvitados.toLowerCase())
    );

    // --- NUEVA LÓGICA: HISTORIAL UNIFICADO (Reservas + Invitados) ---
    const historialUnificado = [
        ...reservas.map(r => ({ ...r, tipo: 'reserva', identificador: r.usuario, detalle_lugar: r.lugar, detalle_espacio: `#${r.espacio}` })),
        ...invitados.map(i => ({ ...i, tipo: 'invitado', identificador: `${i.nombre} (${i.placa})`, detalle_lugar: 'Entrada Invitados', detalle_espacio: 'N/A' }))
    ];

    const historialFiltrado = historialUnificado.filter(h => {
        const texto = filtroHistorial.texto.toLowerCase();
        return (
            (h.identificador.toLowerCase().includes(texto)) || 
            (h.hora.includes(texto) || h.fecha.includes(texto))
        ) && (filtroHistorial.lugar === 'todos' || (h.detalle_lugar && h.detalle_lugar.includes(filtroHistorial.lugar)) || (filtroHistorial.lugar === 'todos' && h.tipo === 'invitado'));
    }).sort((a, b) => {
        // Ordenar por fecha y hora descendente
        const dateA = new Date(`${a.fecha}T${a.hora}`);
        const dateB = new Date(`${b.fecha}T${b.hora}`);
        return dateB - dateA;
    });

    const exportarCSV = () => {
        let contenido = "Fecha,Hora,Usuario/Placa,Lugar,Puesto,Tipo\n";
        historialFiltrado.forEach(h => {
            contenido += `${h.fecha},${h.hora},${h.identificador},${h.detalle_lugar},${h.detalle_espacio},${h.tipo}\n`;
        });
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "reporte_parking.csv");
        link.click();
    };

    const renderResumen = () => {
        const totalOcupados = reservas.length;
        const totalCapacidad = Object.values(CAPACIDAD).reduce((a, b) => a + b, 0);
        
        return (
            <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap: 'wrap', gap: '10px'}}>
                    <h3 style={{margin:0, color:'#0a3d62'}}>Monitor de Ocupación Real</h3>
                    <button onClick={async () => {
                        const result = await Swal.fire({title: '¿Archivar vencidos?', icon: 'question', showCancelButton: true});
                        if(result.isConfirmed) {
                            const hoy = new Date().toISOString().split('T')[0];
                            reservas.forEach(async r => { 
                                if(r.fecha < hoy) {
                                    await addDoc(collection(db, "historial_reservas"), { ...r, estado_final: "archivado", fecha_archivado: new Date() });
                                    await deleteDoc(doc(db,"reservas",r.id)); 
                                }
                            });
                        }
                    }} style={{...btnEdit, background:'#e67e22'}}><FaTrashAlt/> Archivar Vencidos</button>
                </div>
                
                <div style={statsGrid}>
                    {Object.keys(CAPACIDAD).map(lugar => {
                        const ocupados = reservas.filter(r => r.lugar === lugar).length;
                        const porc = (ocupados / CAPACIDAD[lugar]) * 100;
                        return (
                            <div key={lugar} style={parkCard}>
                                <h4 style={{margin:0, color:'#0a3d62'}}>{lugar}</h4>
                                <div style={{height:'10px', background:'#eee', borderRadius:'5px', margin:'15px 0', overflow:'hidden'}}>
                                    <div style={{width:`${porc}%`, height:'100%', background: getColorSemaforo(ocupados, CAPACIDAD[lugar]), transition:'0.5s'}}></div>
                                </div>
                                <p style={{fontSize:'1.5rem', fontWeight:'bold', margin:0, color: getColorSemaforo(ocupados, CAPACIDAD[lugar])}}>{ocupados} / {CAPACIDAD[lugar]}</p>
                                <span style={{fontSize:'0.8rem', color:'#666'}}>Espacios ocupados</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop:'30px', display:'grid', gridTemplateColumns: window.innerWidth < 1100 ? '1fr' : '1.5fr 1fr', gap:'20px' }}>
                    <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                        <div style={tableContainer}>
                            <h4 style={{color:'#0a3d62', display:'flex', alignItems:'center', gap:'10px', marginTop: 0}}>
                                <FaListUl/> Últimas Reservas del Día
                            </h4>
                            <div style={{maxHeight:'300px', overflowY:'auto'}}>
                                {reservas.length > 0 ? reservas.slice(0, 8).map(r => (
                                    <div key={r.id} style={{padding:'12px', borderBottom:'1px solid #eee', fontSize:'0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div>
                                            <strong>{r.usuario.split('@')[0]}</strong> <br/>
                                            <span style={{fontSize: '0.75rem', color: '#666'}}>Puesto #{r.espacio} en {r.lugar}</span>
                                        </div>
                                        <span style={{color: '#0a3d62', fontWeight: 'bold'}}>{r.hora}</span>
                                    </div>
                                )) : <p style={{textAlign: 'center', color: '#999', padding: '20px'}}>No hay reservas hoy.</p>}
                            </div>
                        </div>
                    </div>

                    <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                        <div style={{...tableContainer, background: '#0a3d62', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px'}}>
                            <FaChartPie size={60} style={{marginBottom: '20px', opacity: 0.9}}/>
                            <div style={{fontSize: '4rem', fontWeight: 'bold', lineHeight: 1}}>{totalOcupados}</div>
                            <div style={{fontSize: '1.1rem', marginTop: '10px', opacity: 0.8, textAlign: 'center'}}>Vehículos en el Campus</div>
                            <div style={{marginTop: '20px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '15px'}}>
                                Capacidad total: {totalCapacidad} puestos
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsuarios = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Gestión de Usuarios</h3>
                <button onClick={() => { setModoMasivo(!modoMasivo); setSeleccionados([]); }} style={{ ...btnEdit, background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>{modoMasivo ? 'Cancelar' : 'Gestión Masiva'}</button>
            </div>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <FaFilter color="#999" />
                <input placeholder="Nombre o placa..." style={{ ...inputStyle, width: '200px', margin: 0, flex: '1 1 200px' }} value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} />
                <select style={{ ...inputStyle, width: '120px', margin: 0, flex: '1 1 120px' }} value={filtro.rol} onChange={e => setFiltro({ ...filtro, rol: e.target.value })}>
                    <option value="todos">Todos</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                </select>
                <select style={{ ...inputStyle, width: '120px', margin: 0, flex: '1 1 120px', fontWeight:'bold', color: filtro.estado === 'bloqueado' ? 'red' : 'green' }} value={filtro.estado} onChange={handleCambioFiltroEstado}>
                    <option value="activo">Activos</option>
                    <option value="bloqueado">Bloqueados</option>
                </select>
                {modoMasivo && seleccionados.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => ejecutarAccionMasivaUsuarios('estado')} style={{ ...btnEdit, background: estanBloqueados ? '#27ae60' : '#f39c12' }}>{estanBloqueados ? <FaCheckCircle/> : <FaBan/>} {estanBloqueados ? 'Activar':'Bloquear'}</button>
                        <button onClick={() => ejecutarAccionMasivaUsuarios('borrar')} style={btnDel}><FaTrashAlt/></button>
                    </div>
                )}
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            {modoMasivo && <th style={{ width: '40px' }}><div onClick={() => seleccionarTodo(usuariosFiltrados)} style={{cursor:'pointer'}}>{seleccionados.length === usuariosFiltrados.length ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                            <th style={thStyle}>Nombre</th><th style={thStyle}>Email</th><th style={thStyle}>Estado</th>{!modoMasivo && <th style={thStyle}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(u => {
                            const bloqueado = (u.estado || 'activo') === 'bloqueado';
                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: seleccionados.includes(u.id) ? '#f0f7ff' : 'transparent' }}>
                                    {modoMasivo && <td><div onClick={() => toggleSeleccion(u.id)} style={{cursor:'pointer'}}>{seleccionados.includes(u.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                                    <td style={tdStyle}>{u.nombre}</td><td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}><span style={{color: bloqueado ? 'red' : 'green', fontWeight:'bold'}}>{(u.estado || 'activo').toUpperCase()}</span></td>
                                    {!modoMasivo && (
                                        <td style={tdStyle}>
                                            <button onClick={() => verPerfilUsuario(u)} style={{...btnEdit, background:'#3498db'}} title="Ver Perfil"><FaUserCircle/></button>
                                            <button onClick={() => toggleBloqueo(u)} style={{ ...btnEdit, background: bloqueado ? '#27ae60' : '#f39c12', width: '90px' }}>{bloqueado ? 'Activar' : 'Bloquear'}</button>
                                            <button onClick={() => eliminarRegistro('usuarios', u.id)} style={btnDel}>X</button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderHistorial = () => (
        <div style={tableContainer}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', flexWrap: 'wrap', gap: '10px'}}>
                <h3 style={{margin:0, color:'#0a3d62'}}>Historial Global (Reservas e Invitados)</h3>
                <button onClick={exportarCSV} style={{...btnEdit, background:'#27ae60'}}><FaDownload/> Exportar CSV</button>
            </div>
            <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <FaSearch color="#0a3d62" />
                <input placeholder="Filtrar por placa, nombre, fecha o hora..." style={{ ...inputStyle, flex: '1 1 250px', margin: 0 }} value={filtroHistorial.texto} onChange={e => setFiltroHistorial({ ...filtroHistorial, texto: e.target.value })} />
                <select style={{ ...inputStyle, width: '180px', margin: 0, flex: '1 1 150px' }} value={filtroHistorial.lugar} onChange={e => setFiltroHistorial({ ...filtroHistorial, lugar: e.target.value })}>
                    <option value="todos">Todos los Sectores</option>{Object.keys(CAPACIDAD).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', minWidth: '600px'}}>
                    <thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th style={thStyle}>Fecha / Hora</th><th style={thStyle}>Usuario/Placa</th><th style={thStyle}>Lugar</th><th style={thStyle}>Puesto</th></tr></thead>
                    <tbody>
                        {historialFiltrado.map((h, index) => (
                            <tr key={`${h.id}-${index}`} style={{borderBottom:'1px solid #eee'}}>
                                <td style={tdStyle}>
                                    <strong>{h.fecha}</strong> <br/> <small>{h.hora}</small>
                                </td>
                                <td style={tdStyle}>
                                    {h.identificador}
                                    {h.tipo === 'invitado' && <span style={{fontSize:'0.7rem', background:'#ffc107', padding:'2px 6px', borderRadius:'4px', marginLeft:'5px'}}>Invitado</span>}
                                </td>
                                <td style={tdStyle}>{h.detalle_lugar}</td>
                                <td style={tdStyle}>{h.detalle_espacio}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMensajes = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Buzón de Contacto</h3>
                <span style={{ background: '#0a3d62', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>{mensajes.length} totales</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                {mensajes.length === 0 ? (<p style={{textAlign:'center', color:'#999'}}>No hay mensajes nuevos.</p>) : mensajes.map(m => (
                    <div key={m.id} style={messageCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={avatarCircle}>{m.nombre.charAt(0).toUpperCase()}</div>
                                <div><strong style={{ color: '#0a3d62', fontSize: '1rem' }}>{m.nombre}</strong><div style={{ fontSize: '0.75rem', color: '#666' }}>Usuario PoliParking</div></div>
                            </div>
                            <span style={dateBadge}><FaHistory size={10} /> {m.fecha?.toDate ? m.fecha.toDate().toLocaleDateString() : 'Reciente'}</span>
                        </div>
                        <div style={messageBubble}><p style={{ margin: 0 }}>"{m.mensaje}"</p></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}><button onClick={() => eliminarRegistro("mensajes_contacto", m.id)} style={btnMiniDel}><FaTrashAlt size={12} /> Eliminar</button></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderInvitados = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Invitados Registrados</h3>
                <button onClick={() => { setModoMasivo(!modoMasivo); setSeleccionados([]); }} style={{ ...btnEdit, background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>{modoMasivo ? 'Cancelar' : 'Gestión Masiva'}</button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Buscar placa o nombre..." style={{...inputStyle, width: '200px', margin: 0, flex: '1 1 200px'}} value={filtroInvitados} onChange={e=>setFiltroInvitados(e.target.value)} />
                {modoMasivo && seleccionados.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => ejecutarBorradoMasivo('ingresos_invitados')} style={{...btnDel, padding:'8px 15px', fontSize:'0.9rem'}}><FaTrashAlt/> Eliminar Seleccionados</button>
                    </div>
                )}
            </div>
            
            <div style={{overflowX: 'auto', marginTop:'15px', borderRadius: '8px', border: '1px solid #eee'}}>
                <table style={{width:'100%', borderCollapse:'collapse', minWidth: '450px'}}>
                    <thead>
                        <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                            {modoMasivo && <th style={{ width: '40px' }}><div onClick={() => seleccionarTodo(invitadosFiltrados)} style={{cursor:'pointer'}}>{seleccionados.length === invitadosFiltrados.length && invitadosFiltrados.length > 0 ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                            <th style={thStyle}>Nombre</th>
                            <th style={thStyle}>Placa</th>
                            {!modoMasivo && <th style={thStyle}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {invitadosFiltrados.length > 0 ? invitadosFiltrados.map(i => (
                            <tr key={i.id} style={{borderBottom: '1px solid #eee', background: seleccionados.includes(i.id) ? '#f0f7ff' : 'transparent'}}>
                                {modoMasivo && <td><div onClick={() => toggleSeleccion(i.id)} style={{cursor:'pointer'}}>{seleccionados.includes(i.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                                <td style={tdStyle}>{i.nombre}</td>
                                <td style={tdStyle}><strong>{i.placa}</strong></td>
                                {!modoMasivo && (
                                    <td style={tdStyle}>
                                        <button onClick={() => eliminarRegistro("ingresos_invitados",i.id)} style={btnDel}>X</button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan={modoMasivo ? 4 : 3} style={{padding:'20px', textAlign:'center', color:'#999'}}>No se encontraron invitados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const getContenidoActivo = () => {
        switch(moduloActivo) {
            case 'resumen': return renderResumen();
            case 'usuarios': return renderUsuarios();
            case 'invitados': return renderInvitados();
            case 'mensajes': return renderMensajes();
            case 'historial': return renderHistorial();
            default: return renderResumen();
        }
    };

    // --- ESTILO DRAWER ---
    const sidebarStyle = {
        width: isMobile ? '280px' : '260px',
        background: 'white',
        borderRight: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 10px',
        gap: '5px',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: isMobile ? (isMenuOpen ? '0' : '-100%') : '0',
        height: '100vh',
        zIndex: 1000,
        transition: 'left 0.3s ease'
    };

    return (
        <div style={{ fontFamily: 'Lato, sans-serif', background: '#f4f7f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {isMobile && isMenuOpen && (
                <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex: 999}}></div>
            )}

            <nav style={navAdminStyle}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    {isMobile && <FaBars size={22} color="white" onClick={() => setIsMenuOpen(true)} style={{cursor:'pointer'}} />}
                    <h2 style={{margin:0, color:'white', fontSize: isMobile ? '1.1rem' : '1.4rem'}}>PoliParking <span style={{color:'#ffc107', fontSize:'0.8rem', border:'1px solid', padding:'2px 5px', borderRadius:'4px', marginLeft:'5px'}}>ADMIN</span></h2>
                </div>
                <button onClick={handleLogout} style={btnLogoutStyle}><FaSignOutAlt/> {!isMobile && 'Salir'}</button>
            </nav>

            <div style={{ flex: 1, display: 'flex' }}>
                <aside style={sidebarStyle}>
                    {isMobile && <div style={{textAlign:'right', paddingBottom:'10px'}}><FaTimes size={20} color="#0a3d62" onClick={() => setIsMenuOpen(false)} /></div>}
                    {[ 
                        {id:'resumen', icon:<FaChartBar/>, l:'Monitor'}, 
                        {id:'usuarios', icon:<FaUsers/>, l:'Usuarios'}, 
                        {id:'invitados', icon:<FaCar/>, l:'Invitados'}, 
                        {id:'mensajes', icon:<FaEnvelope/>, l:'Mensajes'}, 
                        {id:'historial', icon:<FaHistory/>, l:'Historial'}
                    ].map(item => (
                        <button key={item.id} onClick={() => { setModuloActivo(item.id); if(isMobile) setIsMenuOpen(false); setModoMasivo(false); setSeleccionados([]); }} style={{...menuBtnStyle, background: moduloActivo === item.id ? '#0a3d62' : 'transparent', color: moduloActivo === item.id ? 'white' : '#0a3d62'}}>{item.icon} {item.l}</button>
                    ))}
                    <div style={{marginTop: 'auto', padding: '15px', borderTop: '1px solid #eee'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', color: '#27ae60', fontSize:'0.85rem'}}><FaDatabase/> <span>Firebase: Online</span></div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', color: '#0a3d62', fontSize:'0.85rem'}}><FaClock/> <span>{currentTime.toLocaleTimeString()}</span></div>
                        <p style={{fontSize:'0.7rem', color:'#999', marginTop:'15px'}}>PoliParking v2.0 - EPN</p>
                    </div>
                </aside>
                <main style={{ flex: 1, padding: isMobile ? '15px' : '30px', overflowY: 'auto' }}>{getContenidoActivo()}</main>
            </div>
        </div>
    );
};

const navAdminStyle = { background: '#0a3d62', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 100 };
const btnLogoutStyle = { background: '#e30613', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' };
const menuBtnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign:'left', fontWeight:'bold', width: '100%', transition: '0.3s' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' };
const parkCard = { background: 'white', padding: '1.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const tableContainer = { background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px', borderBottom: '2px solid #f1f2f6', color: '#0a3d62', fontWeight:'bold' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f1f2f6', fontSize:'0.9rem', verticalAlign: 'middle' };
const btnEdit = { color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px', fontWeight:'bold', transition: '0.3s' };
const btnDel = { background: '#e30613', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing:'border-box', outline: 'none' };

export default DashboardAdmin;