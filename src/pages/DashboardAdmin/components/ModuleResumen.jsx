import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ModuleResumen = ({ reservas, capacidad, getColorSemaforo, onArchivarVencidos }) => {
    const [ocupacionActual, setOcupacionActual] = useState({});
    const [ultimasReservasDia, setUltimasReservasDia] = useState([]);
    const [conteoUsuarios, setConteoUsuarios] = useState({ estudiante: 0, docente: 0, admin: 0, invitado: 0 });

    useEffect(() => {
        const calcularOcupacion = () => {
            const hoy = new Date().toISOString().split('T')[0];
            const reservasHoy = reservas.filter(reserva => reserva.fecha === hoy);

            const nuevaOcupacion = {};
            Object.keys(capacidad).forEach(lugar => {
                nuevaOcupacion[lugar] = reservasHoy.filter(r => r.lugar === lugar).length;
            });
            setOcupacionActual(nuevaOcupacion);

            // Ultimas reservas del día (para la tabla inferior izquierda)
            const sortedReservas = reservasHoy.sort((a, b) => {
                const timeA = new Date(`${a.fecha}T${a.hora}`);
                const timeB = new Date(`${b.fecha}T${b.hora}`);
                return timeB - timeA; // Más reciente primero
            }).slice(0, 5); // Mostrar solo las 5 más recientes
            setUltimasReservasDia(sortedReservas);

            // Conteo de usuarios para el gráfico
            const conteo = { estudiante: 0, docente: 0, admin: 0, invitado: 0 };
            reservasHoy.forEach(reserva => {
                const rol = reserva.rol || 'estudiante'; // Asume 'estudiante' si no hay rol explícito
                if (conteo[rol]) {
                    conteo[rol]++;
                } else if (reserva.tipo === 'invitado') { // Asume 'invitado' si no es un rol conocido
                    conteo.invitado++;
                }
            });
            setConteoUsuarios(conteo);
        };

        calcularOcupacion();
    }, [reservas, capacidad]);

    const totalPuestos = Object.values(capacidad).reduce((sum, val) => sum + val, 0);
    const totalOcupados = Object.values(ocupacionActual).reduce((sum, val) => sum + val, 0);

    // Datos para el Pie Chart
    const pieChartData = [
        { name: 'Estudiantes', value: conteoUsuarios.estudiante },
        { name: 'Docentes', value: conteoUsuarios.docente },
        { name: 'Admins', value: conteoUsuarios.admin },
        { name: 'Invitados', value: conteoUsuarios.invitado },
    ].filter(item => item.value > 0); // Solo muestra los que tienen valor > 0

    const COLORS = ['#3498db', '#f1c40f', '#2c3e50', '#95a5a6']; // Colores para Estudiantes, Docentes, Admins, Invitados

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{fontWeight:'bold', fontSize:'0.9rem'}}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div>
            {/* Cabecera del monitor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap:'10px' }}>
                <h2 className="card-title" style={{ margin: 0 }}>Monitor de Ocupación Actual</h2>
                <button 
                    onClick={onArchivarVencidos}
                    style={{
                        background: '#f39c12',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease, background 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = '#e67e22'; 
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#f39c12';
                    }}
                >
                    <span>🗄️</span> Archivar Vencidos
                </button>
            </div>

            {/* Grid de monitores de capacidad */}
            <div className="stats-grid" style={{ marginBottom: '25px' }}>
                {Object.keys(capacidad).map(lugar => (
                    <div className="park-card" key={lugar} style={{borderBottom:`5px solid ${getColorSemaforo(ocupacionActual[lugar] || 0, capacidad[lugar])}`}}>
                        <h3 style={{color:'#0a3d62', marginBottom:'10px'}}>{lugar}</h3>
                        <p style={{fontSize:'1.8rem', fontWeight:'bold', color:getColorSemaforo(ocupacionActual[lugar] || 0, capacidad[lugar])}}>
                            {ocupacionActual[lugar] || 0} <span style={{fontSize:'1rem', color:'#555'}}>/ {capacidad[lugar]}</span>
                        </p>
                        <p style={{fontSize:'0.9rem', color:'#777'}}>Espacios ocupados</p>
                    </div>
                ))}
            </div>

            {/* Contenido inferior (Últimas Reservas + Gráfico) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' }}>
                
                {/* 1. Últimas Reservas del Día (Columna Izquierda) */}
                <div className="table-container" style={{padding:'25px'}}>
                    <h3 style={{marginBottom:'15px', color:'#0a3d62', display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{fontSize:'1.3rem'}}>🕒</span> Últimas Reservas del Día
                    </h3>
                    {ultimasReservasDia.length > 0 ? (
                        <ul style={{listStyle:'none', padding:0}}>
                            {ultimasReservasDia.map((reserva, index) => (
                                <li key={index} style={{
                                    display:'flex', justifyContent:'space-between', alignItems:'center',
                                    padding:'10px 0', borderBottom:'1px solid #eee', fontSize:'0.9rem'
                                }}>
                                    <div style={{fontWeight:'600', color:'#2c3e50'}}>{reserva.usuario} ({reserva.placa})</div>
                                    <div style={{color:'#0a3d62', fontWeight:'bold'}}>{reserva.lugar} - {reserva.espacio}</div>
                                    <div style={{color:'#7f8c8d'}}>{reserva.hora}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{textAlign:'center', padding:'30px', color:'#95a5a6', fontSize:'1rem'}}>
                            <span style={{fontSize:'2rem', display:'block', marginBottom:'10px'}}>😴</span>
                            No hay reservas activas hoy.
                        </div>
                    )}
                </div>

                {/* 2. Gráfico de Distribución de Usuarios (Columna Derecha) 🔥 NUEVO 🔥 */}
                <div className="table-container" style={{ 
                    padding: '25px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#0a3d62', // Fondo azul oscuro para el gráfico
                    color: 'white',
                    borderRadius: '15px', // Misma esquina redondeada
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{marginBottom:'20px', color:'white', textAlign:'center', fontSize:'1.2rem'}}>
                        Distribución de Vehículos en Campus
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                // label={renderCustomizedLabel} // Si quieres porcentajes dentro
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} 
                                itemStyle={{ color: '#0a3d62', fontWeight: 'bold' }} 
                            />
                            <Legend 
                                align="center" 
                                verticalAlign="bottom" 
                                wrapperStyle={{ paddingTop: '10px' }}
                                formatter={(value, entry) => <span style={{color:'white', fontWeight:'600'}}>{value} ({entry.payload.value})</span>}
                            />
                            {/* Texto en el centro del Pie Chart */}
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="white" style={{fontSize:'2.5rem', fontWeight:'bold'}}>
                                {totalOcupados}
                            </text>
                            <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill="#bbdefb" style={{fontSize:'0.8rem', fontWeight:'600'}}>
                                Vehículos en Campus
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                    <p style={{fontSize:'0.9rem', color:'#bbdefb', marginTop:'15px'}}>
                        Capacidad total: {totalPuestos} puestos
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModuleResumen;