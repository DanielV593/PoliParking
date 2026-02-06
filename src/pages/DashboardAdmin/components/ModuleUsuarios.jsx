import React from 'react';
import { FaFilter, FaCheckCircle, FaBan, FaTrashAlt, FaCheckSquare, FaSquare, FaUserCircle } from 'react-icons/fa';

const ModuleUsuarios = ({ 
    usuariosFiltrados, filtro, setFiltro, handleCambioFiltroEstado, 
    modoMasivo, setModoMasivo, seleccionados, toggleSeleccion, seleccionarTodo, 
    ejecutarAccionMasiva, verPerfil, toggleBloqueo, eliminarRegistro, estanBloqueados 
}) => {
    return (
        <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Gestión de Usuarios</h3>
                <button onClick={() => { setModoMasivo(!modoMasivo); }} className="btn-edit" style={{ background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>
                    {modoMasivo ? 'Cancelar' : 'Gestión Masiva'}
                </button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <FaFilter color="#999" />
                <input placeholder="Nombre o placa..." className="input-admin" style={{ width: '200px', margin: 0, flex: '1 1 200px' }} value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} />
                <select className="input-admin" style={{ width: '120px', margin: 0, flex: '1 1 120px' }} value={filtro.rol} onChange={e => setFiltro({ ...filtro, rol: e.target.value })}>
                    <option value="todos">Todos</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                </select>
                <select className="input-admin" style={{ width: '120px', margin: 0, flex: '1 1 120px', fontWeight:'bold', color: filtro.estado === 'bloqueado' ? 'red' : 'green' }} value={filtro.estado} onChange={handleCambioFiltroEstado}>
                    <option value="activo">Activos</option>
                    <option value="bloqueado">Bloqueados</option>
                </select>
                
                {modoMasivo && seleccionados.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => ejecutarAccionMasiva('estado')} className="btn-edit" style={{ background: estanBloqueados ? '#27ae60' : '#f39c12' }}>
                            {estanBloqueados ? <FaCheckCircle/> : <FaBan/>} {estanBloqueados ? 'Activar':'Bloquear'}
                        </button>
                        <button onClick={() => ejecutarAccionMasiva('borrar')} className="btn-del"><FaTrashAlt/></button>
                    </div>
                )}
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            {modoMasivo && <th style={{ width: '40px' }}><div onClick={() => seleccionarTodo(usuariosFiltrados)} style={{cursor:'pointer'}}>{seleccionados.length === usuariosFiltrados.length && usuariosFiltrados.length > 0 ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                            <th className="th-style">Nombre</th><th className="th-style">Email</th><th className="th-style">Estado</th>{!modoMasivo && <th className="th-style">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(u => {
                            const bloqueado = (u.estado || 'activo') === 'bloqueado';
                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: seleccionados.includes(u.id) ? '#f0f7ff' : 'transparent' }}>
                                    {modoMasivo && <td><div onClick={() => toggleSeleccion(u.id)} style={{cursor:'pointer'}}>{seleccionados.includes(u.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                                    <td className="td-style">{u.nombre}</td><td className="td-style">{u.email}</td>
                                    <td className="td-style"><span style={{color: bloqueado ? 'red' : 'green', fontWeight:'bold'}}>{(u.estado || 'activo').toUpperCase()}</span></td>
                                    {!modoMasivo && (
                                        <td className="td-style">
                                            <button onClick={() => verPerfil(u)} className="btn-edit" style={{background:'#3498db'}} title="Ver Perfil"><FaUserCircle/></button>
                                            <button onClick={() => toggleBloqueo(u)} className="btn-edit" style={{ background: bloqueado ? '#27ae60' : '#f39c12', width: '90px' }}>{bloqueado ? 'Activar' : 'Bloquear'}</button>
                                            <button onClick={() => eliminarRegistro('usuarios', u.id)} className="btn-del">X</button>
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
};

export default ModuleUsuarios;