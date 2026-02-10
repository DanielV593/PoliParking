import React from 'react';

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
    estanBloqueados
}) => {

    // Función auxiliar para los colores de los roles
    const getRolBadgeColor = (rol) => {
        switch(rol) {
            case 'admin': return { bg: '#2c3e50', color: 'white', label: 'ADMIN' };
            case 'docente': return { bg: '#f1c40f', color: '#0a3d62', label: 'DOCENTE' };
            case 'estudiante': return { bg: '#3498db', color: 'white', label: 'ESTUDIANTE' };
            case 'invitado': return { bg: '#95a5a6', color: 'white', label: 'INVITADO' };
            default: return { bg: '#ecf0f1', color: '#7f8c8d', label: rol ? rol.toUpperCase() : 'DESCONOCIDO' };
        }
    };

    return (
        <div className="table-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
                <h2 className="card-title" style={{margin:0}}>Gestión de Usuarios</h2>
                
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
                    <option value="admin">Admin</option>
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

                        {/* BOTÓN ELIMINAR - Rojo moderno */}
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
                                                <button className="btn-action" style={{background:'#e74c3c', color:'white', borderRadius:'6px'}} title="Eliminar" onClick={() => eliminarRegistro(u.id)}>
                                                    🗑️
                                                </button>
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
        </div>
    );
};

export default ModuleUsuarios;