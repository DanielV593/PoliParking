import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { 
    collection, getDocs, deleteDoc, doc, updateDoc, addDoc, query, orderBy, writeBatch 
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FaChartBar, FaUsers, FaEnvelope, FaCar, FaSignOutAlt, FaTrashAlt, FaCheckSquare, FaSquare, FaFilter, FaCheckCircle, FaBan, FaHistory, FaUserCircle, FaSearch } from 'react-icons/fa';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [moduloActivo, setModuloActivo] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [historial, setHistorial] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [modoMasivo, setModoMasivo] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    
    // FILTRO INICIADO SOLO EN 'ACTIVO' Y SIN OPCIÓN 'TODOS'
    const [filtro, setFiltro] = useState({ texto: '', rol: 'todos', estado: 'activo' });
    const [filtroInvitados, setFiltroInvitados] = useState('');

    // --- NUEVO ESTADO PARA FILTROS DE HISTORIAL ---
    const [filtroHistorial, setFiltroHistorial] = useState({ texto: '', lugar: 'todos' });

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const initialFormState = { nombre: '', email: '', rol: 'estudiante', placa: '', telefono: '', password: '', estado: 'activo' };
    const [formData, setFormData] = useState(initialFormState);

    const CAPACIDAD = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [uSnap, iSnap, rSnap, mSnap, hSnap] = await Promise.all([
                getDocs(collection(db, "usuarios")),
                getDocs(collection(db, "ingresos_invitados")),
                getDocs(collection(db, "reservas")),
                getDocs(query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc"))),
                getDocs(query(collection(db, "historial_reservas"), orderBy("fecha", "desc")))
            ]);
            setUsuarios(uSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setInvitados(iSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setReservas(rSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setMensajes(mSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setHistorial(hSnap.docs.map(d => ({ ...d.data(), id: d.id })));
        } catch (error) { console.error("Error cargando datos:", error); }
        setLoading(false);
    };

    // --- LÓGICA DE SEGURIDAD PARA FILTRO DE BLOQUEADOS ---
    const handleCambioFiltroEstado = async (e) => {
        const nuevoEstado = e.target.value;
        
        if (nuevoEstado === 'bloqueado') {
            const { value: password } = await Swal.fire({
                title: 'Acceso Restringido',
                text: 'Ingrese la contraseña de administrador para ver usuarios bloqueados:',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonColor: '#0a3d62',
            });

            if (password === 'admin123') { // CONTRASEÑA DE SEGURIDAD
                setFiltro({ ...filtro, estado: nuevoEstado });
            } else {
                if (password !== undefined) Swal.fire('Error', 'Contraseña incorrecta', 'error');
                setFiltro({ ...filtro, estado: 'activo' }); 
            }
        } else {
            setFiltro({ ...filtro, estado: nuevoEstado });
        }
    };

    // --- NUEVA FUNCIÓN: VER PERFIL COMPLETO CON HISTORIAL ---
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
                    <p><strong>Historial de Reservas (${susReservas.length}):</strong></p>
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
                setSeleccionados([]); cargarDatos();
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
                setSeleccionados([]); cargarDatos();
            } catch (e) { console.error(e); }
        }
    };

    const toggleBloqueo = async (u) => { 
        const estaBloqueado = (u.estado || 'activo') === 'bloqueado';
        const accion = estaBloqueado ? 'Activar' : 'Bloquear';
        const result = await Swal.fire({ 
            title: `¿${accion} usuario?`, 
            text: estaBloqueado ? "El usuario podrá volver a reservar." : "El usuario no podrá realizar nuevas reservas.",
            icon: 'question', 
            showCancelButton: true 
        });
        if (result.isConfirmed) {
            const nuevoEstado = estaBloqueado ? 'activo' : 'bloqueado';
            await updateDoc(doc(db, "usuarios", u.id), {estado: nuevoEstado}); 
            cargarDatos(); 
            Swal.fire('Éxito', `Usuario ${nuevoEstado}`, 'success');
        }
    };

    const eliminarRegistro = async (col, id) => { 
        const result = await Swal.fire({ title: '¿Borrar registro?', icon: 'warning', showCancelButton: true });
        if(result.isConfirmed){ await deleteDoc(doc(db, col, id)); cargarDatos(); Swal.fire('Borrado','','success'); } 
    };

    const handleSaveUser = async (e) => { 
        e.preventDefault(); 
        try { 
            if(editMode){ const {password,...d}=formData; await updateDoc(doc(db,"usuarios",selectedId),d); }
            else{ await addDoc(collection(db,"usuarios"),formData); }
            setShowModal(false); cargarDatos(); Swal.fire('Guardado','','success');
        } catch(e) { console.error(e); }
    };

    const getColorSemaforo = (ocupados, total) => {
        const porc = (ocupados / total) * 100;
        if (porc > 85) return '#e30613';
        if (porc > 50) return '#f39c12';
        return '#2ecc71';
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const coincideTexto = u.nombre.toLowerCase().includes(filtro.texto.toLowerCase()) || (u.placa || '').toLowerCase().includes(filtro.texto.toLowerCase());
        const coincideRol = filtro.rol === 'todos' || u.rol === filtro.rol;
        const coincideEstado = (u.estado || 'activo') === filtro.estado;
        return coincideTexto && coincideRol && coincideEstado;
    });

    const invitadosFiltrados = invitados.filter(i => 
        i.nombre.toLowerCase().includes(filtroInvitados.toLowerCase()) || (i.placa || '').toLowerCase().includes(filtroInvitados.toLowerCase())
    );

    // --- LÓGICA FILTRADO DE HISTORIAL ---
    const historialFiltrado = reservas.filter(h => {
        const textoBusqueda = filtroHistorial.texto.toLowerCase();
        const coincideTexto = 
            h.usuario.toLowerCase().includes(textoBusqueda) || 
            (h.nombre_invitado || '').toLowerCase().includes(textoBusqueda) ||
            h.hora.includes(textoBusqueda) ||
            h.fecha.includes(textoBusqueda);
        const coincideLugar = filtroHistorial.lugar === 'todos' || h.lugar === filtroHistorial.lugar;
        return coincideTexto && coincideLugar;
    });

    const renderResumen = () => (
        <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3 style={{margin:0, color:'#0a3d62'}}>Estado Actual</h3>
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
                        cargarDatos();
                    }
                }} style={{...btnEdit, background:'#e67e22'}}><FaTrashAlt/> Archivar Vencidos</button>
            </div>
            <div style={statsGrid}>
                {Object.keys(CAPACIDAD).map(lugar => {
                    const ocupados = reservas.filter(r => r.lugar === lugar).length;
                    const disponibles = CAPACIDAD[lugar] - ocupados;
                    return (
                        <div key={lugar} style={parkCard}>
                            <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', marginBottom:'5px'}}>
                                <div style={{width:'10px', height:'10px', borderRadius:'50%', background: getColorSemaforo(ocupados, CAPACIDAD[lugar])}}></div>
                                <h4 style={{fontSize:'1rem', color:'#0a3d62', margin:0}}>{lugar}</h4>
                            </div>
                            <p style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight:'bold', color: disponibles > 0 ? '#2ecc71' : '#e30613' }}>{disponibles}</p>
                            <span style={{fontSize:'0.8rem', color:'#666'}}>Libres de {CAPACIDAD[lugar]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderUsuarios = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Gestión de Usuarios</h3>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => { setModoMasivo(!modoMasivo); setSeleccionados([]); }} style={{ ...btnEdit, background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>{modoMasivo ? 'Cancelar' : 'Gestión Masiva'}</button>
                    <button onClick={() => { setEditMode(false); setFormData(initialFormState); setShowModal(true); }} style={btnCreate}>+ Nuevo</button>
                </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <FaFilter color="#999" />
                <input placeholder="Nombre o placa..." style={{ ...inputStyle, width: '200px', margin: 0 }} value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} />
                
                <select style={{ ...inputStyle, width: '120px', margin: 0 }} value={filtro.rol} onChange={e => setFiltro({ ...filtro, rol: e.target.value })}>
                    <option value="todos">Todos los Roles</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                </select>

                {/* FILTRO DE ESTADO SEGURO */}
                <select style={{ ...inputStyle, width: '120px', margin: 0, fontWeight:'bold', color: filtro.estado === 'bloqueado' ? 'red' : 'green' }} value={filtro.estado} onChange={handleCambioFiltroEstado}>
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            {modoMasivo && <th style={{ width: '40px' }}><div onClick={() => seleccionarTodo(usuariosFiltrados)} style={{cursor:'pointer'}}>{seleccionados.length === usuariosFiltrados.length ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                            <th style={thStyle}>Nombre</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Estado</th>
                            {!modoMasivo && <th style={thStyle}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(u => {
                            const estaBloqueado = (u.estado || 'activo') === 'bloqueado';
                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: seleccionados.includes(u.id) ? '#f0f7ff' : 'transparent' }}>
                                    {modoMasivo && <td><div onClick={() => toggleSeleccion(u.id)} style={{cursor:'pointer'}}>{seleccionados.includes(u.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                                    <td style={tdStyle}>{u.nombre}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}><span style={{color: estaBloqueado ? 'red' : 'green', fontWeight:'bold'}}>{(u.estado || 'activo').toUpperCase()}</span></td>
                                    {!modoMasivo && (
                                        <td style={tdStyle}>
                                            <button onClick={() => verPerfilUsuario(u)} style={{...btnEdit, background:'#3498db'}} title="Ver Perfil"><FaUserCircle/></button>
                                            <button onClick={() => toggleBloqueo(u)} style={{ ...btnEdit, background: estaBloqueado ? '#27ae60' : '#f39c12', width: '90px' }}>{estaBloqueado ? 'Activar' : 'Bloquear'}</button>
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

    const renderInvitados = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Invitados Registrados</h3>
                <button onClick={() => { setModoMasivo(!modoMasivo); setSeleccionados([]); }} style={{ ...btnEdit, background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>{modoMasivo ? 'Cancelar' : 'Gestión Masiva'}</button>
            </div>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <input placeholder="Buscar placa o nombre..." style={{ ...inputStyle, width: '250px', margin: 0 }} value={filtroInvitados} onChange={e => setFiltroInvitados(e.target.value)} />
                {modoMasivo && seleccionados.length > 0 && (
                    <button onClick={() => ejecutarBorradoMasivo('ingresos_invitados')} style={{ ...btnDel, marginLeft: 'auto' }}>Eliminar ({seleccionados.length})</button>
                )}
            </div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                        {modoMasivo && <th><div onClick={() => seleccionarTodo(invitadosFiltrados)} style={{cursor:'pointer'}}>{seleccionados.length === invitadosFiltrados.length ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                        <th style={thStyle}>Nombre</th><th style={thStyle}>Placa</th>{!modoMasivo && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {invitadosFiltrados.map(i => (
                        <tr key={i.id} style={{borderBottom:'1px solid #eee', background: seleccionados.includes(i.id) ? '#f0f7ff' : 'transparent'}}>
                            {modoMasivo && <td><div onClick={() => toggleSeleccion(i.id)} style={{cursor:'pointer'}}>{seleccionados.includes(i.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                            <td style={tdStyle}>{i.nombre}</td><td style={tdStyle}>{i.placa}</td>
                            {!modoMasivo && <td style={tdStyle}><button onClick={() => eliminarRegistro("ingresos_invitados",i.id)} style={btnDel}>X</button></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderHistorial = () => (
        <div style={tableContainer}>
            <h3 style={{color:'#0a3d62', marginBottom:'15px'}}>Historial Global de Reservas</h3>
            
            {/* FILTROS DE HISTORIAL AVANZADOS */}
            <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <FaSearch color="#0a3d62" />
                <input 
                    placeholder="Buscar por placa, nombre o fecha..." 
                    style={{ ...inputStyle, flex: 1, margin: 0 }} 
                    value={filtroHistorial.texto} 
                    onChange={e => setFiltroHistorial({ ...filtroHistorial, texto: e.target.value })} 
                />
                <select 
                    style={{ ...inputStyle, width: '180px', margin: 0 }} 
                    value={filtroHistorial.lugar} 
                    onChange={e => setFiltroHistorial({ ...filtroHistorial, lugar: e.target.value })}
                >
                    <option value="todos">Todos los Sectores</option>
                    {Object.keys(CAPACIDAD).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th style={thStyle}>Fecha / Hora</th><th style={thStyle}>Usuario/Placa</th><th style={thStyle}>Lugar</th><th style={thStyle}>Puesto</th></tr></thead>
                    <tbody>
                        {historialFiltrado.map(h => (
                            <tr key={h.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={tdStyle}><strong>{h.fecha}</strong> <br/> <small>{h.hora}</small></td>
                                <td style={tdStyle}>{h.usuario}</td>
                                <td style={tdStyle}>{h.lugar}</td>
                                <td style={tdStyle}>#{h.espacio}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMensajes = () => (
        <div style={tableContainer}>
            <h3 style={{color:'#0a3d62', marginBottom:'15px'}}>Buzón de Contacto</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'500px', overflowY:'auto'}}>
                {mensajes.length === 0 ? (<p style={{textAlign:'center', color:'#888'}}>Sin mensajes nuevos 📩</p>) : mensajes.map(m => (
                    <div key={m.id} style={{padding:'15px', background:'#f8f9fa', borderRadius:'8px', borderLeft:'4px solid #0a3d62'}}>
                        <strong>{m.nombre}</strong> <small>({m.fecha?.toDate ? m.fecha.toDate().toLocaleDateString() : 'Reciente'})</small>
                        <p style={{margin:'5px 0', fontSize:'0.9rem'}}>"{m.mensaje}"</p>
                    </div>
                ))}
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
            default: return null;
        }
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}><h2>Cargando PoliParking Admin...</h2></div>;

    return (
        <div style={{ fontFamily: 'Lato, sans-serif', background: '#f4f7f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <nav style={navAdminStyle}>
                <h2 style={{margin:0, color:'white', fontSize:'1.4rem'}}>PoliParking <span style={{color:'#ffc107', fontSize:'0.8rem', border:'1px solid', padding:'2px 5px', borderRadius:'4px', marginLeft:'5px'}}>ADMIN</span></h2>
                <button onClick={handleLogout} style={btnLogoutStyle}><FaSignOutAlt/> Salir</button>
            </nav>
            <div style={{ flex: 1, display: 'flex' }}>
                <div style={{ width: '240px', background: 'white', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', padding: '20px 10px', gap: '5px' }}>
                    {[
                        {id:'resumen', icon:<FaChartBar/>, l:'Resumen'}, 
                        {id:'usuarios', icon:<FaUsers/>, l:'Usuarios'}, 
                        {id:'invitados', icon:<FaCar/>, l:'Invitados'},
                        {id:'mensajes', icon:<FaEnvelope/>, l:'Mensajes'},
                        {id:'historial', icon:<FaHistory/>, l:'Historial'}
                    ].map(item => (
                        <button key={item.id} onClick={() => { setModuloActivo(item.id); setModoMasivo(false); setSeleccionados([]); }} 
                            style={{...menuBtnStyle, background: moduloActivo === item.id ? '#0a3d62' : 'transparent', color: moduloActivo === item.id ? 'white' : '#0a3d62'}}>
                            {item.icon} {item.l}
                        </button>
                    ))}
                </div>
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>{getContenidoActivo()}</div>
            </div>
            {showModal && (
                <div style={modalOverlay}><div style={modalContent}><h3>{editMode ? 'Editar':'Crear'}</h3><form onSubmit={handleSaveUser} style={{display:'flex', flexDirection:'column', gap:'10px'}}><input style={inputStyle} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre" required /><input style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Correo" required /><input style={inputStyle} value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} placeholder="Placa" /><select style={inputStyle} value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}><option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="administrativo">Administrativo</option></select><div style={{display:'flex', gap:'10px', marginTop:'10px'}}><button type="submit" style={btnCreate}>Guardar</button><button type="button" onClick={() => setShowModal(false)} style={{...btnDel, flex:1, background:'#7f8c8d'}}>Cerrar</button></div></form></div></div>
            )}
        </div>
    );
};

const navAdminStyle = { background: '#0a3d62', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' };
const btnLogoutStyle = { background: '#e30613', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' };
const menuBtnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign:'left', fontWeight:'bold' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' };
const parkCard = { background: 'white', padding: '1.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const tableContainer = { background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px', borderBottom: '2px solid #f1f2f6', color: '#0a3d62', fontWeight:'bold' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f1f2f6', fontSize:'0.9rem', verticalAlign: 'middle' };
const btnCreate = { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' };
const btnEdit = { color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px', fontWeight:'bold', transition: '0.3s' };
const btnDel = { background: '#e30613', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:1000 };
const modalContent = { background: 'white', padding: '2rem', borderRadius: '15px', width: '400px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing:'border-box' };

export default DashboardAdmin;