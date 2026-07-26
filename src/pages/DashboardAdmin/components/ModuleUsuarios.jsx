import React, { useState } from 'react';
import Swal from 'sweetalert2';

const FORM_VACIO = { nombre: '', email: '', placa: '', rol: 'estudiante', password: '', confirmPassword: '' };

const ModuleUsuarios = ({ 
    usuariosFiltrados, 
    filtro, 
    setFiltro, 
    handleCambioFiltroEstado,
    modoMasivo, 
    setModoMasivo,
    seleccionados, 
    toggleSeleccion, 
    seleccionarTodo,
    ejecutarAccionMasiva,
    verPerfil, 
    toggleBloqueo, 
    eliminarRegistro,
    estanBloqueados,
    esAdminPrincipal = false,
    rolesCreables = [],
    onCrearUsuario
}) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);

    // Función auxiliar para los colores de los roles
    const getRolBadgeColor = (rol) => {
        switch(rol) {
            case 'admin': return { bg: '#2c3e50', color: 'white', label: 'ADMIN PRINCIPAL' };
            case 'admin_secundario': return { bg: '#8e44ad', color: 'white', label: 'ADMIN SECUNDARIO' };
            case 'docente': return { bg: '#f1c40f', color: '#0a3d62', label: 'DOCENTE' };
            case 'administrativo': return { bg: '#1abc9c', color: 'white', label: 'ADMINISTRATIVO' };
            case 'estudiante': return { bg: '#3498db', color: 'white', label: 'ESTUDIANTE' };
            case 'guardia': return { bg: '#34495e', color: 'white', label: 'GUARDIA' };
            case 'invitado': return { bg: '#95a5a6', color: 'white', label: 'INVITADO' };
            default: return { bg: '#ecf0f1', color: '#7f8c8d', label: rol ? rol.toUpperCase() : 'DESCONOCIDO' };
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setForm(FORM_VACIO);
    };

    const handleSubmitCrear = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
            return;
        }
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!regexPassword.test(form.password)) {
            Swal.fire({
                title: 'Contraseña muy débil',
                html: 'Debe tener al menos 6 caracteres, una mayúscula, un número y un carácter especial.',
                icon: 'warning'
            });
            return;
        }
        const partesNombre = form.nombre.trim().split(/\s+/);
        if (partesNombre.length < 2 || !partesNombre.every(p => p.length >= 3)) {
            Swal.fire('Nombre incompleto', 'Ingresa al menos un nombre y un apellido.', 'warning');
            return;
        }
        if (!form.email.endsWith('@epn.edu.ec')) {
            Swal.fire('Correo inválido', 'Debes usar un correo institucional @epn.edu.ec', 'warning');
            return;
        }
        if (form.placa) {
            const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
            if (!regexPlaca.test(form.placa)) {
                Swal.fire('Placa inválida', 'Usa el formato oficial (ej: ABC-1234) o déjala en blanco.', 'warning');
                return;
            }
        }

        setGuardando(true);
        const exito = await onCrearUsuario(form);
        setGuardando(false);
        if (exito) cerrarModal();
    };

    const handlePlacaChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3, 7);
        setForm({ ...form, placa: value });
    };

    return (
        <div className="table-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
                <h2 className="card-title" style={{margin:0}}>Gestión de Usuarios</h2>
                
                <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                    {/* 🔥 BOTÓN CREAR USUARIO — solo el administrador principal lo ve 🔥 */}
                    {esAdminPrincipal && (
                        <button 
                            onClick={() => setModalAbierto(true)}
                            style={{
                                background: '#27ae60', color: 'white', border: 'none', 
                                borderRadius: '8px', padding: '8px 16px', fontWeight: '700',
                                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', 
                                alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span>➕</span> Crear Usuario
                        </button>
                    )}

                    {/* 🔥 BOTÓN DE GESTIÓN MASIVA (DISEÑO MODERNO) 🔥 */}
                    <button 
                        onClick={() => setModoMasivo(!modoMasivo)}
                        style={{
                            background: modoMasivo ? '#0a3d62' : 'transparent', 
                            color: modoMasivo ? 'white' : '#0a3d62',
                            border: '2px solid #0a3d62', 
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: modoMasivo ? '0 4px 12px rgba(10, 61, 98, 0.2)' : 'none'
                        }}
                    >
                        <span>{modoMasivo ? '☑️' : '◻️'}</span>
                        {modoMasivo ? 'Modo Selección Activo' : 'Activar Selección'}
                    </button>
                </div>
            </div>

            {!esAdminPrincipal && (
                <div style={{
                    background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba',
                    borderRadius: '8px', padding: '10px 15px', marginBottom: '15px', fontSize: '0.85rem'
                }}>
                    ℹ️ Estás en modo <b>administrador secundario</b>: puedes activar o bloquear usuarios, pero no crearlos ni eliminarlos.
                </div>
            )}
            
            {/* --- BARRA DE FILTROS --- */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', background:'#f8fafc', padding:'15px', borderRadius:'12px', border:'1px solid #edf2f7' }}>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, correo o placa..." 
                    className="input-admin"
                    style={{ flex: 1, minWidth: '200px', margin:0, border:'1px solid #cbd5e0' }}
                    value={filtro.texto}
                    onChange={(e) => setFiltro({ ...filtro, texto: e.target.value })}
                />
                
                <select 
                    className="input-admin" 
                    style={{ width: '160px', margin:0, border:'1px solid #cbd5e0' }}
                    value={filtro.rol}
                    onChange={(e) => setFiltro({ ...filtro, rol: e.target.value })}
                >
                    <option value="todos">Todos los Roles</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="guardia">Guardia</option>
                    <option value="admin">Admin</option>
                    {esAdminPrincipal && <option value="admin_secundario">Admin Secundario</option>}
                    <option value="invitado">Invitado</option>
                </select>

                <select 
                    className="input-admin" 
                    style={{ width: '160px', margin:0, border:'1px solid #cbd5e0' }}
                    value={filtro.estado}
                    onChange={handleCambioFiltroEstado}
                >
                    <option value="activo">Activos</option>
                    <option value="bloqueado">Bloqueados</option>
                </select>
            </div>

            {/* --- BARRA DE ACCIONES MASIVAS (ESTILO LIMPIO) --- */}
            {modoMasivo && (
                <div style={{ 
                    padding: '15px 20px', background: '#e3f2fd', borderRadius: '10px', 
                    marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent:'space-between',
                    borderLeft: '5px solid #2196f3', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <input 
                            type="checkbox" 
                            id="selectAll"
                            onChange={seleccionarTodo} 
                            checked={seleccionados.length === usuariosFiltrados.length && usuariosFiltrados.length > 0}
                            style={{ width: '18px', height: '18px', cursor:'pointer', accentColor:'#0a3d62' }}
                        />
                        <label htmlFor="selectAll" style={{ fontWeight: '700', color: '#0a3d62', cursor:'pointer', fontSize:'0.95rem' }}>
                            {seleccionados.length > 0 ? `${seleccionados.length} usuarios seleccionados` : 'Seleccionar todo'}
                        </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* BOTÓN BLOQUEAR/ACTIVAR - Moderno y plano */}
                        <button 
                            onClick={() => ejecutarAccionMasiva('bloqueo')}
                            disabled={seleccionados.length === 0}
                            style={{
                                background: estanBloqueados ? '#27ae60' : '#f39c12', // Verde o Naranja
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                fontWeight: '700',
                                cursor: seleccionados.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: seleccionados.length === 0 ? 0.6 : 1,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Sombra suave
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span>{estanBloqueados ? '🔓' : '🔒'}</span>
                            {estanBloqueados ? 'Activar Marcados' : 'Bloquear Marcados'}
                        </button>

                        {/* BOTÓN ELIMINAR - Rojo moderno (solo admin principal) */}
                        {esAdminPrincipal && (
                            <button 
                                onClick={() => ejecutarAccionMasiva('borrar')}
                                disabled={seleccionados.length === 0}
                                style={{
                                    background: '#e74c3c', // Rojo plano
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    fontWeight: '700',
                                    cursor: seleccionados.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: seleccionados.length === 0 ? 0.6 : 1,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <span>🗑️</span> Eliminar Marcados
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- TABLA --- */}
            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            {modoMasivo && <th className="th-style" style={{width: '40px', textAlign:'center'}}>#</th>}
                            <th className="th-style">NOMBRE</th>
                            <th className="th-style">EMAIL</th>
                            <th className="th-style">ROL</th> 
                            <th className="th-style">PLACA</th>
                            <th className="th-style">ESTADO</th>
                            <th className="th-style" style={{textAlign: 'center'}}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length > 0 ? (
                            usuariosFiltrados.map((u) => {
                                const rolStyle = getRolBadgeColor(u.rol);
                                return (
                                    <tr key={u.id} style={{backgroundColor: modoMasivo && seleccionados.includes(u.id) ? '#f0f9ff' : 'transparent', transition:'background 0.2s'}}>
                                        {modoMasivo && (
                                            <td className="td-style" style={{textAlign:'center'}}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={seleccionados.includes(u.id)}
                                                    onChange={() => toggleSeleccion(u.id)}
                                                    style={{ width: '18px', height: '18px', cursor:'pointer', accentColor:'#0a3d62' }}
                                                />
                                            </td>
                                        )}
                                        <td className="td-style" style={{fontWeight:'600', color:'#2c3e50'}}>{u.nombre}</td>
                                        <td className="td-style" style={{color:'#555'}}>{u.email}</td>
                                        
                                        <td className="td-style">
                                            <span style={{
                                                backgroundColor: rolStyle.bg, color: rolStyle.color,
                                                padding: '4px 10px', borderRadius: '20px',
                                                fontSize: '0.75rem', fontWeight: '800',
                                                display: 'inline-block', minWidth: '85px', textAlign: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}>
                                                {rolStyle.label}
                                            </span>
                                        </td>

                                        <td className="td-style">
                                            {u.placa ? (
                                                <span style={{
                                                    background: '#e3f2fd', color: '#0a3d62', 
                                                    padding: '4px 8px', borderRadius: '6px', 
                                                    fontWeight: '700', border: '1px solid #bbdefb', fontSize: '0.85rem'
                                                }}>
                                                    {u.placa.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span style={{color:'#bdc3c7', fontSize:'0.8rem'}}>N/A</span>
                                            )}
                                        </td>

                                        <td className="td-style">
                                            <span style={{
                                                color: u.estado === 'bloqueado' ? '#e74c3c' : '#27ae60',
                                                fontWeight: '800', textTransform: 'uppercase', fontSize: '0.8rem',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {u.estado === 'bloqueado' ? 'BLOQUEADO' : 'ACTIVO'}
                                            </span>
                                        </td>
                                        
                                        <td className="td-style" style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button className="btn-action" style={{background:'#3498db', color:'white', borderRadius:'6px'}} title="Ver Perfil" onClick={() => verPerfil(u)}>
                                                    👤
                                                </button>
                                                <button 
                                                    className="btn-action" 
                                                    style={{background: u.estado === 'bloqueado' ? '#2ecc71' : '#f39c12', color:'white', borderRadius:'6px'}} 
                                                    onClick={() => toggleBloqueo(u)}
                                                    title={u.estado === 'bloqueado' ? 'Activar' : 'Bloquear'}
                                                >
                                                    {u.estado === 'bloqueado' ? '🔓' : '🔒'}
                                                </button>
                                                {esAdminPrincipal && (
                                                    <button className="btn-action" style={{background:'#e74c3c', color:'white', borderRadius:'6px'}} title="Eliminar" onClick={() => eliminarRegistro(u.id)}>
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={modoMasivo ? 8 : 7} style={{textAlign:'center', padding:'40px', color:'#95a5a6'}}>
                                    <div style={{fontSize:'2rem', marginBottom:'10px'}}>🔍</div>
                                    No se encontraron usuarios con esos criterios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL CREAR USUARIO --- */}
            {modalAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(10, 61, 98, 0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000, padding: '20px'
                }} onClick={cerrarModal}>
                    <div 
                        style={{
                            background: 'white', borderRadius: '14px', padding: '30px',
                            width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
                        }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 20px', color: '#0a3d62' }}>➕ Crear Nuevo Usuario</h3>

                        <form onSubmit={handleSubmitCrear}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Nombre completo</label>
                                <input 
                                    type="text" required className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Correo institucional</label>
                                <input 
                                    type="email" required placeholder="usuario@epn.edu.ec" className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Rol</label>
                                <select 
                                    className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
                                >
                                    {rolesCreables.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Placa de vehículo (opcional)</label>
                                <input 
                                    type="text" placeholder="ABC-1234" maxLength="8" className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.placa} onChange={handlePlacaChange}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Contraseña</label>
                                <input 
                                    type="password" required className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>Repetir contraseña</label>
                                <input 
                                    type="password" required className="input-admin" style={{ width: '100%', margin: '4px 0 0' }}
                                    value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" onClick={cerrarModal}
                                    style={{ background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" disabled={guardando}
                                    style={{ background: '#0a3d62', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}
                                >
                                    {guardando ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleUsuarios;