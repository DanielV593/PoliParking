import React from 'react';
import { FaDownload, FaSearch } from 'react-icons/fa';

const ModuleHistorial = ({ historialFiltrado, filtro, setFiltro, exportarCSV, capacidad }) => {
    return (
        <div className="table-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', flexWrap: 'wrap', gap: '10px'}}>
                <h3 style={{margin:0, color:'#0a3d62'}}>Historial Global (Reservas e Invitados)</h3>
                <button onClick={exportarCSV} className="btn-edit" style={{background:'#27ae60'}}><FaDownload/> Exportar CSV</button>
            </div>
            <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <FaSearch color="#0a3d62" />
                <input placeholder="Filtrar por placa, nombre, fecha o hora..." className="input-admin" style={{ flex: '1 1 250px', margin: 0 }} value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} />
                <select className="input-admin" style={{ width: '180px', margin: 0, flex: '1 1 150px' }} value={filtro.lugar} onChange={e => setFiltro({ ...filtro, lugar: e.target.value })}>
                    <option value="todos">Todos los Sectores</option>{Object.keys(capacidad).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div style={{overflowX:'auto'}}>
                <table className="admin-table">
                    <thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th className="th-style">Fecha / Hora</th><th className="th-style">Usuario/Placa</th><th className="th-style">Lugar</th><th className="th-style">Puesto</th></tr></thead>
                    <tbody>
                        {historialFiltrado.map((h, index) => (
                            <tr key={`${h.id}-${index}`} style={{borderBottom:'1px solid #eee'}}>
                                <td className="td-style">
                                    <strong>{h.fecha}</strong> <br/> <small>{h.hora}</small>
                                </td>
                                <td className="td-style">
                                    {h.identificador}
                                    {h.tipo === 'invitado' && <span style={{fontSize:'0.7rem', background:'#ffc107', padding:'2px 6px', borderRadius:'4px', marginLeft:'5px'}}>Invitado</span>}
                                </td>
                                <td className="td-style">{h.detalle_lugar}</td>
                                <td className="td-style">{h.detalle_espacio}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModuleHistorial;