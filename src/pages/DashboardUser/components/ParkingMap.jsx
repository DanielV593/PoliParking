/**
 * COMPONENTE: ParkingMap
 * PROPÓSITO: Renderiza la cuadrícula de puestos y la leyenda correcta.
 */
import React from 'react';

const ParkingMap = ({ lugar, capacidad, ocupados, seleccionado, onSelect, isMobile }) => {
    // Generamos el array de puestos
    const puestos = [...Array(capacidad)].map((_, i) => i + 1);

    // Calculamos disponibles
    const totalOcupados = ocupados ? ocupados.length : 0;
    const disponibles = capacidad - totalOcupados;

    return (
        <div className="card" style={{marginTop: '20px'}}>
            <div className="map-header">
                <h3 className="card-title" style={{justifyContent: 'center'}}>
                    🗺️ {lugar}
                </h3>
                
                {/* LEYENDA CON COLORES */}
                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-box free"></div>
                        Libre
                    </div>
                    <div className="legend-item">
                        <div className="legend-box occupied"></div>
                        Ocupado
                    </div>
                    <div className="legend-item">
                        <div className="legend-box selected"></div>
                        Tu Selección
                    </div>
                </div>

                <p style={{textAlign:'center', fontSize:'0.85rem', color:'#64748b', marginTop:'10px'}}>
                    Disponibles: <strong>{disponibles}</strong> / {capacidad}
                </p>
            </div>
            
            <div className={`map-grid ${isMobile ? 'mobile' : ''}`}>
                {puestos.map((num) => {
                    // Verificamos si el puesto está en la lista de ocupados
                    const estaOcupado = ocupados.some(r => r.espacio === num);
                    const estaSeleccionado = seleccionado === num;
                    
                    return (
                        <button 
                            key={num} 
                            onClick={() => !estaOcupado && onSelect(num)} 
                            disabled={estaOcupado} 
                            type="button"
                            className={`spot ${estaSeleccionado ? 'selected' : ''}`}
                        >
                            {num}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ParkingMap;