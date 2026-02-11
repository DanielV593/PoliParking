/**
 * COMPONENTE: BookingForm
 * PROPÓSITO: Contiene los inputs para seleccionar ubicación, fecha y hora.
 */
import React from 'react';
import { FaClock } from 'react-icons/fa';
import styles from './BookingForm.module.css'; // Importación del Module

const BookingForm = ({ form, setForm, capacidades, esDocente, fechas, onSubmit, children }) => {
    return (
        <form onSubmit={onSubmit} className={styles.container}>
            <section className={styles.card}>
                <h3 className={styles.cardTitle}>
                    <FaClock color="#ffc107" style={{marginRight:'8px'}}/> Reserva
                </h3>
                
                {/* Selector de Ubicación */}
                <div className={styles.fieldWrapper}>
                    <label className={styles.inputLabel}>Ubicación:</label>
                    {esDocente ? (
                        <select 
                            className={styles.inputField} 
                            value={form.lugar}
                            onChange={(e) => setForm({...form, lugar: e.target.value, espacio: null})}
                        >
                            {Object.keys(capacidades).map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    ) : (
                        <input className={styles.inputField} value="Edificio CEC" disabled />
                    )}
                </div>

                {/* Inputs de Fecha y Hora apilados */}
                <div className={styles.dateTimeRow}>
                    <div className={styles.fieldWrapper}>
                        <label className={styles.inputLabel}>Fecha</label>
                        <input 
                            type="date" 
                            className={styles.inputField} 
                            value={form.fecha} 
                            min={fechas.hoy} 
                            max={fechas.max} 
                            onChange={e => setForm({...form, fecha: e.target.value, espacio: null})} 
                        />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <label className={styles.inputLabel}>Hora</label>
                        <input 
                            type="time" 
                            className={styles.inputField} 
                            value={form.hora} 
                            onChange={e => setForm({...form, hora: e.target.value})} 
                        />
                    </div>
                </div>

                {/* 'children' para el mapa en móvil o botones adicionales */}
                {children}
            </section>
        </form>
    );
};

export default BookingForm;