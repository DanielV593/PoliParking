import React from 'react';

const ModuleHistorial = ({ 
    historialFiltrado, 
    filtro, 
    setFiltro, 
    exportarCSV, 
    capacidad 
}) => {

    // Función para darle colorcito al TIPO de usuario (Badge)
    const getBadgeStyle = (item) => {
        const tipo = (item.rol || item.tipo || '').toLowerCase();

        if (tipo.includes('docente')) return { bg: '#f1c40f', color: '#0a3d62', label: 'DOCENTE' };
        if (tipo.includes('estudiante')) return { bg: '#3498db', color: 'white', label: 'ESTUDIANTE' };
        if (tipo.includes('admin')) return { bg: '#2c3e50', color: 'white', label: 'ADMIN' };
        if (tipo.includes('invitado') || tipo.includes('guest')) return { bg: '#95a5a6', color: 'white', label: 'INVITADO' };
        
        return { bg: '#ecf0f1', color: '#7f8c8d', label: 'GENERAL' };
    };

    return (
        <div className="table-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
                <h2 className="card-title" style={{margin:0}}>Historial Global</h2>
                
                {/* 🔥 BOTÓN EXPORTAR CSV (RENOVADO) 🔥 */}
                <button 
                    onClick={exportarCSV}
                    style={{
                        background: '#10b981', // Verde moderno (Emerald)
                        color: 'white',
                        border: 'none', // Adiós borde negro feo
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Sombra suave
                        transition: 'transform 0.2s ease, background 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = '#059669'; // Un poco más oscuro al pasar el mouse
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#10b981';
                    }}
                >
                    <span style={{fontSize:'1.1rem'}}>📊</span> Exportar Reporte CSV
                </button>
            </div>
            
            {/* BARRA DE FILTROS */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background:'#f8fafc', padding:'15px', borderRadius:'12px', flexWrap:'wrap', border:'1px solid #edf2f7' }}>
                <div style={{ flex: 1, position: 'relative', minWidth:'200px' }}>
                    <span style={{ position:'absolute', left:'10px', top:'12px', fontSize:'1.2rem' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, placa, fecha..." 
                        className="input-admin"
                        style={{ paddingLeft: '40px', margin: 0, width:'100%', border:'1px solid #cbd5e0' }}
                        value={filtro.texto}
                        onChange={(e) => setFiltro({ ...filtro, texto: e.target.value })}
                    />
                </div>
                
                <select 
                    className="input-admin" 
                    style={{ width: '200px', margin: 0, border:'1px solid #cbd5e0' }}
                    value={filtro.lugar}
                    onChange={(e) => setFiltro({ ...filtro, lugar: e.target.value })}
                >
                    <option value="todos">Todos los Sectores</option>
                    {Object.keys(capacidad).map(lugar => (
                        <option key={lugar} value={lugar}>{lugar}</option>
                    ))}
                </select>
            </div>

            {/* TABLA DE HISTORIAL DIVIDIDA */}
            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="th-style">FECHA / HORA</th>
                            <th className="th-style">USUARIO</th>
                            <th className="th-style">PLACA</th>
                            <th className="th-style" style={{textAlign:'center'}}>PERFIL</th>
                            <th className="th-style">LUGAR</th>
                            <th className="th-style">PUESTO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historialFiltrado.length > 0 ? (
                            historialFiltrado.map((h, index) => {
                                const badge = getBadgeStyle(h);
                                return (
                                    <tr key={index}>
                                        {/* 1. FECHA Y HORA */}
                                        <td className="td-style">
                                            <div style={{fontWeight:'bold', color:'#0a3d62'}}>{h.fecha}</div>
                                            <div style={{fontSize:'0.85rem', color:'#7f8c8d'}}>{h.hora}</div>
                                        </td>
                                        
                                        {/* 2. USUARIO */}
                                        <td className="td-style" style={{fontWeight:'600', color:'#2c3e50'}}>
                                            {h.nombre || h.usuario || 'Desconocido'}
                                            {h.usuario && h.nombre && h.usuario !== h.nombre && (
                                                <div style={{fontSize:'0.8rem', color:'#95a5a6', fontWeight:'normal'}}>{h.usuario}</div>
                                            )}
                                        </td>

                                        {/* 3. PLACA */}
                                        <td className="td-style">
                                            {h.placa ? (
                                                <span style={{
                                                    background: '#e3f2fd', 
                                                    color: '#0a3d62', 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px', 
                                                    fontWeight: 'bold',
                                                    border: '1px solid #bbdefb',
                                                    fontSize: '0.85rem',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {h.placa.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span style={{color:'#bdc3c7', fontSize:'0.8rem'}}>N/A</span>
                                            )}
                                        </td>

                                        {/* 4. PERFIL (Badge) */}
                                        <td className="td-style" style={{textAlign:'center'}}>
                                            <span style={{
                                                backgroundColor: badge.bg,
                                                color: badge.color,
                                                padding: '5px 10px',
                                                borderRadius: '15px',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                display: 'inline-block',
                                                minWidth: '90px',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                            }}>
                                                {badge.label}
                                            </span>
                                        </td>

                                        {/* 5. LUGAR */}
                                        <td className="td-style">{h.detalle_lugar}</td>
                                        
                                        {/* 6. PUESTO */}
                                        <td className="td-style" style={{fontWeight:'bold', color:'#0a3d62', fontSize:'1rem'}}>
                                            {h.detalle_espacio}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#95a5a6'}}>
                                    <div style={{fontSize:'2rem', marginBottom:'10px'}}>📂</div>
                                    No se encontraron registros en el historial.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModuleHistorial;