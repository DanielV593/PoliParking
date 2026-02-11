import React from 'react';
import styles from './ParkingMap.module.css';

const ParkingMap = ({ lugar, capacidad, ocupados, seleccionado, onSelect, columnas = 3 }) => {
    // Generamos el array de puestos
    const puestos = [...Array(capacidad)].map((_, i) => i + 1);

    // Calculamos disponibles
    const totalOcupados = ocupados ? ocupados.length : 0;
    const disponibles = capacidad - totalOcupados;

    return (
        <div className={styles.card}>
            <div className={styles.mapHeader}>
                <h3 className={styles.cardTitle}>
                    🗺️ {lugar}
                </h3>
                
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBox} ${styles.free}`}></div>
                        Libre
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBox} ${styles.occupied}`}></div>
                        Ocupado
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBox} ${styles.selectedBox}`}></div>
                        Tu Selección
                    </div>
                </div>

                <p style={{textAlign:'center', fontSize:'0.85rem', color:'#64748b', marginTop:'10px'}}>
                    Disponibles: <strong>{disponibles}</strong> / {capacidad}
                </p>
            </div>
            
            <div 
                className={styles.mapGrid}
                style={{ '--columnas': columnas }} // Inyectamos la variable CSS
            >
                {puestos.map((num) => {
                    const estaOcupado = ocupados.some(r => r.espacio === num);
                    const estaSeleccionado = seleccionado === num;
                    
                    return (
                        <button 
                            key={num} 
                            onClick={() => !estaOcupado && onSelect(num)} 
                            disabled={estaOcupado} 
                            type="button"
                            className={`${styles.spot} ${estaSeleccionado ? styles.selected : ''}`}
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