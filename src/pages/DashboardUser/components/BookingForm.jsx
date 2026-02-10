/**
 * COMPONENTE: BookingForm
 * PROPÓSITO: Contiene los inputs para seleccionar ubicación, fecha y hora.
 * POR QUÉ ESTÁ AQUÍ: Agrupa toda la lógica de entrada de datos del usuario antes de reservar.
 */
import React from 'react';
import { FaClock } from 'react-icons/fa';

const BookingForm = ({ form, setForm, capacidades, esDocente, fechas, onSubmit, children }) => {
    return (
        <form onSubmit={onSubmit}>
            <section className="card">
                <h3 className="card-title">
                    <FaClock color="#ffc107" style={{marginRight:'8px'}}/> Reserva
                </h3>
                
                {/* Selector de Ubicación (Solo docentes pueden cambiar) */}
                <label className="input-label">Ubicación:</label>
                {esDocente ? (
                    <select 
                        className="input-field" 
                        value={form.lugar}
                        onChange={(e) => setForm({...form, lugar: e.target.value, espacio: null})}
                    >
                        {Object.keys(capacidades).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                ) : (
                    <input className="input-field" value="Edificio CEC" disabled />
                )}

                {/* Inputs de Fecha y Hora */}
                <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                    <div style={{flex:1}}>
                        <label className="input-label">Fecha</label>
                        <input 
                            type="date" 
                            className="input-field" 
                            value={form.fecha} 
                            min={fechas.hoy} 
                            max={fechas.max} 
                            onChange={e => setForm({...form, fecha: e.target.value, espacio: null})} 
                        />
                    </div>
                    <div style={{flex:1}}>
                        <label className="input-label">Hora</label>
                        <input 
                            type="time" 
                            className="input-field" 
                            value={form.hora} 
                            onChange={e => setForm({...form, hora: e.target.value})} 
                        />
                    </div>
                </div>

                {/* 'children' permite inyectar el mapa aquí dentro si estamos en móvil */}
                {children}
            </section>
        </form>
    );
};

export default BookingForm;