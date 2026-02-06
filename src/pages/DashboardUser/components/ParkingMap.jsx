/**
 * COMPONENTE: ParkingMap
 * PROPÓSITO: Renderiza la cuadrícula de puestos y maneja la selección visual.
 * POR QUÉ ESTÁ AQUÍ: El mapa es complejo visualmente; aislarlo facilita modificar el diseño sin romper el formulario.
 */
import React from 'react';

const ParkingMap = ({ lugar, capacidad, ocupados, seleccionado, onSelect, isMobile }) => {
    // Generamos el array de puestos según la capacidad del lugar
    const puestos = [...Array(capacidad)].map((_, i) => i + 1);

    return (
        <div className="card">
            <div className="map-header">
                <h3 className="card-title">🗺️ Mapa: {lugar}</h3>
                <div className="legend">
                    <div className="legend-item"><div className="legend-box free"></div>Libre</div>
                    <div className="legend-item"><div className="legend-box occupied"></div>Ocupado</div>
                    <div className="legend-item"><div className="legend-box selected"></div>Seleccionado</div>
                </div>
            </div>
            
            <div className={`map-grid ${isMobile ? 'mobile' : ''}`}>
                {puestos.map((num) => {
                    const estaOcupado = ocupados.some(r => r.espacio === num);
                    const estaSeleccionado = seleccionado === num;
                    
                    return (
                        <button 
                            key={num} 
                            onClick={() => !estaOcupado && onSelect(num)} 
                            disabled={estaOcupado} 
                            type="button"
                            className={`spot ${isMobile ? 'mobile' : ''} ${estaSeleccionado ? 'selected' : ''}`}
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