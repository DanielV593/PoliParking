import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { 
    collection, getDocs, deleteDoc, doc, updateDoc, addDoc, query, orderBy 
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FaChartBar, FaUsers, FaEnvelope, FaCar, FaChevronDown, FaChevronUp, FaSignOutAlt, FaTrashAlt } from 'react-icons/fa';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [moduloActivo, setModuloActivo] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
            const [uSnap, iSnap, rSnap, mSnap] = await Promise.all([
                getDocs(collection(db, "usuarios")),
                getDocs(collection(db, "ingresos_invitados")),
                getDocs(collection(db, "reservas")),
                getDocs(query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc")))
            ]);
            setUsuarios(uSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setInvitados(iSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setReservas(rSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            setMensajes(mSnap.docs.map(d => ({ ...d.data(), id: d.id })));
        } catch (error) { console.error("Error:", error); }
        setLoading(false);
    };

    // --- LÓGICA DE LIMPIEZA GLOBAL (ADMIN) ---
    const ejecutarMantenimiento = async () => {
        const result = await Swal.fire({
            title: 'Limpieza de Reservas',
            text: "¿Deseas eliminar todas las reservas que ya caducaron?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            confirmButtonText: 'Sí, limpiar base de datos'
        });

        if (result.isConfirmed) {
            try {
                const hoyStr = new Date().toISOString().split('T')[0];
                let contador = 0;
                
                reservas.forEach(async (res) => {
                    if (res.fecha < hoyStr) {
                        await deleteDoc(doc(db, "reservas", res.id));
                        contador++;
                    }
                });
                
                await cargarDatos();
                Swal.fire('Limpieza Exitosa', `Se eliminaron las reservas vencidas.`, 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo completar la limpieza', 'error');
            }
        }
    };

    const handleLogout = async () => { await signOut(auth); navigate('/'); };

    const toggleBloqueo = async (u) => { 
        await updateDoc(doc(db, "usuarios", u.id), {estado: u.estado==='bloqueado'?'activo':'bloqueado'}); 
        cargarDatos(); 
    };
    const handleSaveUser = async (e) => { 
        e.preventDefault(); 
        try { 
            if(editMode){ const {password,...d}=formData; await updateDoc(doc(db,"usuarios",selectedId),d); }
            else{ await addDoc(collection(db,"usuarios"),formData); }
            setShowModal(false); cargarDatos(); Swal.fire('Guardado','','success');
        } catch(e) { Swal.fire('Error','','error'); }
    };
    const eliminarRegistro = async (col, id) => { 
        if((await Swal.fire({title:'¿Borrar?',icon:'warning',showCancelButton:true})).isConfirmed){ 
            await deleteDoc(doc(db, col, id)); cargarDatos(); Swal.fire('Eliminado','','success'); 
        } 
    };

    const renderResumen = () => (
        <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3 style={{margin:0, color:'#0a3d62'}}>Estado Actual</h3>
                <button onClick={ejecutarMantenimiento} style={{...btnEdit, background:'#e67e22', display:'flex', alignItems:'center', gap:'8px', padding:'10px 15px'}}>
                    <FaTrashAlt/> Limpiar Vencidos
                </button>
            </div>
            <div style={statsGrid}>
                {Object.keys(CAPACIDAD).map(lugar => {
                    const ocupados = reservas.filter(r => r.lugar === lugar).length;
                    const disponibles = CAPACIDAD[lugar] - ocupados;
                    return (
                        <div key={lugar} style={parkCard}>
                            <h4 style={{fontSize:'1rem', color:'#0a3d62', margin:0}}>{lugar}</h4>
                            <p style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight:'bold', color: disponibles > 0 ? '#2ecc71' : '#e30613' }}>{disponibles}</p>
                            <span style={{fontSize:'0.8rem', color:'#666'}}>Libres</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderUsuarios = () => (
        <div style={tableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Usuarios</h3>
                <button onClick={() => { setEditMode(false); setFormData(initialFormState); setShowModal(true); }} style={btnCreate}>+ Nuevo</button>
            </div>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', minWidth:'600px'}}>
                    <thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th style={thStyle}>Usuario</th><th style={thStyle}>Rol</th><th style={thStyle}>Estado</th><th style={thStyle}>Acciones</th></tr></thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={tdStyle}><strong>{u.nombre}</strong><br/><small>{u.email}</small></td>
                                <td style={tdStyle}>{u.rol}</td>
                                <td style={tdStyle}><span style={{color: u.estado==='bloqueado'?'red':'green', fontWeight:'bold'}}>{u.estado}</span></td>
                                <td style={tdStyle}>
                                    <button onClick={()=>{setEditMode(true); setSelectedId(u.id); setFormData(u); setShowModal(true)}} style={btnEdit}>Edit</button>
                                    <button onClick={()=>toggleBloqueo(u)} style={btnEdit}>{u.estado==='bloqueado'?'Act':'Bloq'}</button>
                                    <button onClick={()=>eliminarRegistro('usuarios',u.id)} style={btnDel}>X</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMensajes = () => (
        <div style={tableContainer}>
            <h3 style={{color:'#0a3d62', marginBottom:'15px'}}>Buzón</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'500px', overflowY:'auto'}}>
                {mensajes.length === 0 && <p>Sin mensajes.</p>}
                {mensajes.map(m => (
                    <div key={m.id} style={{padding:'15px', background:'#f8f9fa', borderRadius:'8px', borderLeft:'4px solid #0a3d62'}}>
                        <strong>{m.nombre}</strong> <small>({m.fecha?.toDate().toLocaleDateString()})</small>
                        <p style={{margin:'5px 0', fontStyle:'italic'}}>"{m.mensaje}"</p>
                        <small>{m.email} | {m.celular}</small>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderInvitados = () => (
        <div style={tableContainer}>
            <h3 style={{color:'#0a3d62', marginBottom:'15px'}}>Invitados</h3>
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', minWidth:'400px'}}>
                    <thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th style={thStyle}>Nombre</th><th style={thStyle}>Placa</th><th></th></tr></thead>
                    <tbody>{invitados.map(i => (<tr key={i.id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}>{i.nombre}</td><td style={tdStyle}>{i.placa}</td><td style={tdStyle}><button onClick={()=>eliminarRegistro('ingresos_invitados',i.id)} style={btnDel}>X</button></td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );

    const getContenidoActivo = () => {
        switch(moduloActivo) {
            case 'resumen': return renderResumen();
            case 'usuarios': return renderUsuarios();
            case 'mensajes': return renderMensajes();
            case 'invitados': return renderInvitados();
            default: return null;
        }
    };

    return (
        <div style={{ fontFamily: 'Lato, sans-serif', background: '#f4f7f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .sidebar-container { width: 250px; background: white; border-right: 1px solid #e1e1e1; display: flex; flex-direction: column; padding: 20px 10px; gap: 10px; }
                .content-area { flex: 1; padding: 30px; overflow-y: auto; }
                .mobile-accordion { display: none; padding: 10px; }
                .layout-wrapper { flex: 1; display: flex; overflow: hidden; }
                @media (max-width: 768px) {
                    .sidebar-container { display: none; }
                    .content-area { display: none; }
                    .mobile-accordion { display: flex; flex-direction: column; gap: 15px; }
                    .layout-wrapper { display: block; overflow-y: auto; }
                }
            `}</style>

            <nav style={navAdminStyle}>
                <h2 style={{margin:0, fontSize:'1.4rem', color:'white'}}>PoliParking <span style={adminSpanStyle}>ADMIN</span></h2>
                <button onClick={handleLogout} style={btnLogoutStyle}><FaSignOutAlt/> Salir</button>
            </nav>

            <div className="layout-wrapper">
                <div className="sidebar-container">
                    {[
                        {id:'resumen', icon:<FaChartBar/>, label:'Resumen'},
                        {id:'usuarios', icon:<FaUsers/>, label:'Usuarios'},
                        {id:'mensajes', icon:<FaEnvelope/>, label:'Mensajes'},
                        {id:'invitados', icon:<FaCar/>, label:'Invitados'}
                    ].map(item => (
                        <button key={item.id} onClick={() => setModuloActivo(item.id)} style={{...menuBtnStyle, background: moduloActivo === item.id ? '#0a3d62' : 'transparent', color: moduloActivo === item.id ? 'white' : '#0a3d62'}}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>

                <div className="content-area">{getContenidoActivo()}</div>

                <div className="mobile-accordion">
                    <div style={accCard}>
                        <div onClick={() => setModuloActivo(moduloActivo === 'resumen' ? '' : 'resumen')} style={accHeader}><span style={{display:'flex', alignItems:'center', gap:'10px'}}><FaChartBar/> Resumen</span> {moduloActivo === 'resumen' ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        {moduloActivo === 'resumen' && <div style={{padding:'15px'}}>{renderResumen()}</div>}
                    </div>
                    <div style={accCard}>
                        <div onClick={() => setModuloActivo(moduloActivo === 'usuarios' ? '' : 'usuarios')} style={accHeader}><span style={{display:'flex', alignItems:'center', gap:'10px'}}><FaUsers/> Usuarios</span> {moduloActivo === 'usuarios' ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        {moduloActivo === 'usuarios' && <div style={{padding:'15px'}}>{renderUsuarios()}</div>}
                    </div>
                    <div style={accCard}>
                        <div onClick={() => setModuloActivo(moduloActivo === 'mensajes' ? '' : 'mensajes')} style={accHeader}><span style={{display:'flex', alignItems:'center', gap:'10px'}}><FaEnvelope/> Mensajes</span> {moduloActivo === 'mensajes' ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        {moduloActivo === 'mensajes' && <div style={{padding:'15px'}}>{renderMensajes()}</div>}
                    </div>
                    <div style={accCard}>
                        <div onClick={() => setModuloActivo(moduloActivo === 'invitados' ? '' : 'invitados')} style={accHeader}><span style={{display:'flex', alignItems:'center', gap:'10px'}}><FaCar/> Invitados</span> {moduloActivo === 'invitados' ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        {moduloActivo === 'invitados' && <div style={{padding:'15px'}}>{renderInvitados()}</div>}
                    </div>
                </div>
            </div>

            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{color:'#0a3d62', marginTop:0}}>{editMode ? 'Editar' : 'Crear'} Usuario</h3>
                        <form onSubmit={handleSaveUser} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                            <input style={inputStyle} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre" required />
                            <input style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Correo" required />
                            <div style={{display:'flex', gap:'10px'}}>
                                <input style={inputStyle} value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} placeholder="Placa" required />
                                <input style={inputStyle} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="Teléfono" required />
                            </div>
                            {!editMode && <input style={inputStyle} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Contraseña" required />}
                            <select style={inputStyle} value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                                <option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="administrativo">Administrativo</option>
                            </select>
                            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                <button type="submit" style={{...btnCreate, flex:1}}>Guardar</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{...btnDel, flex:1, background:'#7f8c8d'}}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const navAdminStyle = { background: '#0a3d62', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' };
const adminSpanStyle = { color: '#feca57', border:'1px solid', padding:'2px 8px', borderRadius:'4px', fontSize:'0.8rem', marginLeft:'10px' };
const btnLogoutStyle = { background: '#e30613', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' };
const menuBtnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign:'left' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' };
const parkCard = { background: 'white', padding: '1.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const tableContainer = { background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f1f2f6', color: '#0a3d62', minWidth:'100px' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f1f2f6', fontSize:'0.95rem' };
const badgeStyle = { padding: '4px 10px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold' };
const btnCreate = { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' };
const btnEdit = { background: '#0a3d62', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px' };
const btnDel = { background: '#e30613', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '2rem', borderRadius: '15px', width: '90%', maxWidth:'420px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const accCard = { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const accHeader = { padding: '15px', background: '#0a3d62', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };

export default DashboardAdmin;