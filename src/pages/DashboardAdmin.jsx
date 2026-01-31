import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { 
    collection, getDocs, deleteDoc, doc, updateDoc, addDoc 
} from 'firebase/firestore';
import Swal from 'sweetalert2';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Estado inicial completo
    const initialFormState = { 
        nombre: '', 
        email: '', 
        rol: 'estudiante', 
        placa: '', 
        telefono: '', 
        password: '', 
        estado: 'activo' 
    };
    const [formData, setFormData] = useState(initialFormState);

    const CAPACIDAD = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    useEffect(() => { 
        cargarDatos(); 
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const userSnap = await getDocs(collection(db, "usuarios"));
            setUsuarios(userSnap.docs.map(d => ({ ...d.data(), id: d.id })));
            
            const invSnap = await getDocs(collection(db, "ingresos_invitados"));
            setInvitados(invSnap.docs.map(d => ({ ...d.data(), id: d.id })));

            const resSnap = await getDocs(collection(db, "reservas"));
            setReservas(resSnap.docs.map(d => ({ ...d.data(), id: d.id })));
        } catch (error) { 
            console.error("Error cargando datos:", error); 
        }
        setLoading(false);
    };

    const toggleBloqueo = async (usuario) => {
        const estadoActual = usuario.estado || 'activo';
        const nuevoEstado = estadoActual === 'bloqueado' ? 'activo' : 'bloqueado';
        
        const result = await Swal.fire({
            title: `¿${nuevoEstado === 'bloqueado' ? 'Bloquear' : 'Desbloquear'} usuario?`,
            text: `El usuario ${usuario.nombre} cambiará su estado a ${nuevoEstado}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: nuevoEstado === 'bloqueado' ? '#e30613' : '#2ecc71',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const userRef = doc(db, "usuarios", usuario.id);
                await updateDoc(userRef, { estado: nuevoEstado });
                cargarDatos();
                Swal.fire('¡Éxito!', `Usuario ${nuevoEstado}`, 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
            }
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();

        // VALIDACIÓN: Dominio EPN
        const emailRegex = /^[a-zA-Z0-9._%+-]+@epn\.edu\.ec$/;
        if (!emailRegex.test(formData.email)) {
            return Swal.fire({
                icon: 'error',
                title: 'Correo no permitido',
                text: 'Solo se admiten correos institucionales @epn.edu.ec',
                confirmButtonColor: '#e30613'
            });
        }

        // VALIDACIÓN: Contraseña mínima (solo creación)
        if (!editMode && formData.password.length < 6) {
            return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        }

        try {
            if (editMode) {
                const userRef = doc(db, "usuarios", selectedId);
                // Por seguridad, quitamos el password del objeto antes de actualizar
                const { password, ...datosSinPassword } = formData;
                await updateDoc(userRef, datosSinPassword);
                Swal.fire('¡Actualizado!', 'Datos modificados correctamente', 'success');
            } else {
                await addDoc(collection(db, "usuarios"), formData);
                Swal.fire('¡Registrado!', 'Nuevo usuario creado con éxito', 'success');
            }
            setShowModal(false);
            setFormData(initialFormState);
            cargarDatos();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Hubo un fallo al guardar el registro', 'error');
        }
    };

    const eliminarRegistro = async (coleccion, id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#e30613',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, coleccion, id));
                cargarDatos();
                Swal.fire('Eliminado', 'Registro borrado.', 'success');
            } catch (error) { 
                Swal.fire('Error', 'No se pudo eliminar de Firebase.', 'error'); 
            }
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            confirmButtonText: 'Sí, salir'
        });
        if (result.isConfirmed) {
            await signOut(auth);
            navigate('/');
        }
    };

    if (loading) return (
        <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center', background:'#f4f7f9'}}>
            <h2 style={{color:'#0a3d62'}}>Cargando Dashboard...</h2>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Lato, sans-serif', background: '#f4f7f9', minHeight: '100vh' }}>
            <nav style={navAdminStyle}>
                <h2 style={brandStyle}>PoliParking <span style={adminSpanStyle}>ADMIN</span></h2>
                <button onClick={handleLogout} style={btnLogoutStyle}>Cerrar Sesión</button>
            </nav>

            <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
                
                {/* Stats Cards */}
                <div style={statsGrid}>
                    {Object.keys(CAPACIDAD).map(lugar => {
                        const ocupados = reservas.filter(r => r.lugar === lugar).length;
                        const disponibles = CAPACIDAD[lugar] - ocupados;
                        return (
                            <div key={lugar} style={parkCard}>
                                <h4 style={{fontSize:'1rem', color:'#0a3d62', margin:0}}>{lugar}</h4>
                                <p style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight:'bold', color: disponibles > 0 ? '#2ecc71' : '#e30613' }}>
                                    {disponibles}
                                </p>
                                <span style={{fontSize:'0.8rem', color:'#666'}}>Libres de {CAPACIDAD[lugar]}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Usuarios Table */}
                <div style={tableContainer}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '2rem' }}>
                        <h3 style={{ color: '#0a3d62', margin: 0 }}>👥 Usuarios PoliParking</h3>
                        <button onClick={() => { setEditMode(false); setFormData(initialFormState); setShowModal(true); }} style={btnCreate}>+ Crear Nuevo Usuario</button>
                    </div>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Información Vehículo</th>
                                <th style={thStyle}>Correo</th>
                                <th style={thStyle}>Rol</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                                    <td style={tdStyle}>{u.nombre}</td>
                                    <td style={tdStyle}>
                                        <div style={{fontWeight:'bold', color:'#0a3d62'}}>🚗 {u.placa || 'N/A'}</div>
                                        
                                    </td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}><span style={{...badgeStyle, background:'#dfe6e9'}}>{(u.rol || 'estudiante').toUpperCase()}</span></td>
                                    <td style={tdStyle}>
                                        <span style={{ color: u.estado === 'bloqueado' ? '#e30613' : '#2ecc71', fontWeight:'bold' }}>
                                            {(u.estado || 'activo').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => { setEditMode(true); setSelectedId(u.id); setFormData(u); setShowModal(true); }} style={btnEdit}>Editar</button>
                                        <button onClick={() => toggleBloqueo(u)} style={{ ...btnEdit, backgroundColor: u.estado === 'bloqueado' ? '#2ecc71' : '#feca57' }}>
                                            {u.estado === 'bloqueado' ? 'Activar' : 'Bloquear'}
                                        </button>
                                        <button onClick={() => eliminarRegistro('usuarios', u.id)} style={btnDel}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Invitados Table */}
                <div style={tableContainer}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#0a3d62' }}>🚗 Registro de Invitados</h3>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={thStyle}>Invitado</th>
                                <th style={thStyle}>Placa</th>
                                <th style={thStyle}>Celular</th>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invitados.map(inv => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                                    <td style={tdStyle}>{inv.nombre}</td>
                                    <td style={tdStyle}><strong>{inv.placa}</strong></td>
                                    <td style={tdStyle}>{inv.celular || 'N/A'}</td>
                                    <td style={tdStyle}>{inv.fecha}</td>
                                    <td style={tdStyle}>
                                        <button onClick={() => eliminarRegistro('ingresos_invitados', inv.id)} style={btnDel}>Borrar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro Completo */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{color:'#0a3d62', marginTop:0}}>{editMode ? 'Actualizar Datos' : 'Registrar Nuevo Usuario'}</h3>
                        <form onSubmit={handleSaveUser}>
                            <input style={inputStyle} type="text" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                            <input style={inputStyle} type="email" placeholder="Correo institucional (@epn.edu.ec)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                            
                            <div style={{display:'flex', gap:'10px'}}>
                                <input style={inputStyle} type="text" placeholder="Placa (ABC-1234)" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})} required />
                                <input style={inputStyle} type="tel" placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} required />
                            </div>

                            {/* SOLO SE MUESTRA SI NO ES MODO EDICIÓN */}
                            {!editMode && (
                                <input 
                                    style={inputStyle} 
                                    type="password" 
                                    placeholder="Contraseña de acceso" 
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required 
                                />
                            )}

                            <select style={inputStyle} value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                                <option value="estudiante">Estudiante</option>
                                <option value="docente">Docente</option>
                                <option value="administrativo">Administrativo</option>
                            </select>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" style={btnCreate}>{editMode ? 'Actualizar' : 'Guardar Registro'}</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{...btnDel, padding:'10px 20px'}}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Estilos
const navAdminStyle = { background: '#0a3d62', padding: '1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const brandStyle = { margin: 0, color: '#ffffff', fontSize: '1.5rem' };
const adminSpanStyle = { color: '#feca57', marginLeft: '8px', fontSize:'0.9rem', border:'1px solid #feca57', padding:'2px 8px', borderRadius:'4px' };
const btnLogoutStyle = { background: '#e30613', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' };
const parkCard = { background: 'white', padding: '1.5rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const tableContainer = { background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f1f2f6', color: '#0a3d62' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f1f2f6', fontSize:'0.95rem' };
const badgeStyle = { padding: '4px 10px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold' };
const btnCreate = { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' };
const btnEdit = { background: '#0a3d62', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px' };
const btnDel = { background: '#e30613', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '2rem', borderRadius: '15px', width: '420px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };

export default DashboardAdmin;