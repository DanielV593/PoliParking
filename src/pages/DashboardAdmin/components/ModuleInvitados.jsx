import React from 'react';
import { FaTrashAlt, FaCheckSquare, FaSquare } from 'react-icons/fa';

const ModuleInvitados = ({ 
    invitados, filtro, setFiltro, modoMasivo, setModoMasivo, 
    seleccionados, toggleSeleccion, seleccionarTodo, eliminarRegistro, ejecutarBorradoMasivo 
}) => {
    return (
        <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Invitados Registrados</h3>
                <button onClick={() => { setModoMasivo(!modoMasivo); }} className="btn-edit" style={{ background: modoMasivo ? '#7f8c8d' : '#0a3d62' }}>
                    {modoMasivo ? 'Cancelar' : 'Gestión Masiva'}
                </button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Buscar placa o nombre..." className="input-admin" style={{width: '200px', margin: 0, flex: '1 1 200px'}} value={filtro} onChange={e=>setFiltro(e.target.value)} />
                {modoMasivo && seleccionados.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => ejecutarBorradoMasivo('ingresos_invitados')} className="btn-del" style={{padding:'8px 15px', fontSize:'0.9rem'}}><FaTrashAlt/> Eliminar Seleccionados</button>
                    </div>
                )}
            </div>
            
            <div style={{overflowX: 'auto', marginTop:'15px', borderRadius: '8px', border: '1px solid #eee'}}>
                <table className="admin-table">
                    <thead>
                        <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                            {modoMasivo && <th style={{ width: '40px' }}><div onClick={() => seleccionarTodo(invitados)} style={{cursor:'pointer'}}>{seleccionados.length === invitados.length && invitados.length > 0 ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></th>}
                            <th className="th-style">Nombre</th>
                            <th className="th-style">Placa</th>
                            {!modoMasivo && <th className="th-style">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {invitados.length > 0 ? invitados.map(i => (
                            <tr key={i.id} style={{borderBottom: '1px solid #eee', background: seleccionados.includes(i.id) ? '#f0f7ff' : 'transparent'}}>
                                {modoMasivo && <td><div onClick={() => toggleSeleccion(i.id)} style={{cursor:'pointer'}}>{seleccionados.includes(i.id) ? <FaCheckSquare color="#0a3d62"/> : <FaSquare color="#ddd"/>}</div></td>}
                                <td className="td-style">{i.nombre}</td>
                                <td className="td-style"><strong>{i.placa}</strong></td>
                                {!modoMasivo && (
                                    <td className="td-style">
                                        <button onClick={() => eliminarRegistro("ingresos_invitados",i.id)} className="btn-del">X</button>
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
};

export default ModuleInvitados;