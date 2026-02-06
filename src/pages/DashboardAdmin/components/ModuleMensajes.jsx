import React from 'react';
import { FaHistory, FaTrashAlt } from 'react-icons/fa';

const ModuleMensajes = ({ mensajes, eliminarRegistro }) => {
    return (
        <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#0a3d62', margin: 0 }}>Buzón de Contacto</h3>
                <span style={{ background: '#0a3d62', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>{mensajes.length} totales</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                {mensajes.length === 0 ? (<p style={{textAlign:'center', color:'#999'}}>No hay mensajes nuevos.</p>) : mensajes.map(m => (
                    <div key={m.id} className="message-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '35px', height: '35px', background: '#e2e8f0', color: '#0a3d62', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #0a3d62' }}>
                                    {m.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div><strong style={{ color: '#0a3d62', fontSize: '1rem' }}>{m.nombre}</strong><div style={{ fontSize: '0.75rem', color: '#666' }}>Usuario PoliParking</div></div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#718096', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaHistory size={10} /> {m.fecha?.toDate ? m.fecha.toDate().toLocaleDateString() : 'Reciente'}
                            </span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '0 12px 12px 12px', borderLeft: '4px solid #ffc107', fontSize: '0.95rem', fontStyle: 'italic', color: '#333', wordBreak: 'break-word' }}>
                            <p style={{ margin: 0 }}>"{m.mensaje}"</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button onClick={() => eliminarRegistro("mensajes_contacto", m.id)} style={{ background: '#fee2e2', border: 'none', color: '#e30613', fontSize: '0.75rem', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                <FaTrashAlt size={12} /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModuleMensajes;