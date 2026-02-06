import React from 'react';
import { FaTrashAlt, FaListUl, FaChartPie } from 'react-icons/fa';

const ModuleResumen = ({ reservas, capacidad, getColorSemaforo, onArchivarVencidos }) => {
    const totalOcupados = reservas.length;
    const totalCapacidad = Object.values(capacidad).reduce((a, b) => a + b, 0);

    return (
        <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap: 'wrap', gap: '10px'}}>
                <h3 style={{margin:0, color:'#0a3d62'}}>Monitor de Ocupación Real</h3>
                <button onClick={onArchivarVencidos} className="btn-edit" style={{background:'#e67e22'}}>
                    <FaTrashAlt/> Archivar Vencidos
                </button>
            </div>
            
            <div className="stats-grid">
                {Object.keys(capacidad).map(lugar => {
                    const ocupados = reservas.filter(r => r.lugar === lugar).length;
                    const porc = (ocupados / capacidad[lugar]) * 100;
                    return (
                        <div key={lugar} className="park-card">
                            <h4 style={{margin:0, color:'#0a3d62'}}>{lugar}</h4>
                            <div style={{height:'10px', background:'#eee', borderRadius:'5px', margin:'15px 0', overflow:'hidden'}}>
                                <div style={{width:`${porc}%`, height:'100%', background: getColorSemaforo(ocupados, capacidad[lugar]), transition:'0.5s'}}></div>
                            </div>
                            <p style={{fontSize:'1.5rem', fontWeight:'bold', margin:0, color: getColorSemaforo(ocupados, capacidad[lugar])}}>
                                {ocupados} / {capacidad[lugar]}
                            </p>
                            <span style={{fontSize:'0.8rem', color:'#666'}}>Espacios ocupados</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop:'30px', display:'grid', gridTemplateColumns: window.innerWidth < 1100 ? '1fr' : '1.5fr 1fr', gap:'20px' }}>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div className="table-container">
                        <h4 style={{color:'#0a3d62', display:'flex', alignItems:'center', gap:'10px', marginTop: 0}}>
                            <FaListUl/> Últimas Reservas del Día
                        </h4>
                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                            {reservas.length > 0 ? reservas.slice(0, 8).map(r => (
                                <div key={r.id} style={{padding:'12px', borderBottom:'1px solid #eee', fontSize:'0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                        <strong>{r.usuario.split('@')[0]}</strong> <br/>
                                        <span style={{fontSize: '0.75rem', color: '#666'}}>Puesto #{r.espacio} en {r.lugar}</span>
                                    </div>
                                    <span style={{color: '#0a3d62', fontWeight: 'bold'}}>{r.hora}</span>
                                </div>
                            )) : <p style={{textAlign: 'center', color: '#999', padding: '20px'}}>No hay reservas hoy.</p>}
                        </div>
                    </div>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div className="table-container" style={{ background: '#0a3d62', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px'}}>
                        <FaChartPie size={60} style={{marginBottom: '20px', opacity: 0.9}}/>
                        <div style={{fontSize: '4rem', fontWeight: 'bold', lineHeight: 1}}>{totalOcupados}</div>
                        <div style={{fontSize: '1.1rem', marginTop: '10px', opacity: 0.8, textAlign: 'center'}}>Vehículos en el Campus</div>
                        <div style={{marginTop: '20px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '15px'}}>
                            Capacidad total: {totalCapacidad} puestos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleResumen;