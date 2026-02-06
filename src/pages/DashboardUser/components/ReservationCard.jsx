/**
 * COMPONENTE: ReservationCard
 * PROPÓSITO: Muestra la reserva activa del usuario y botones de acción (Descargar/Cancelar).
 * POR QUÉ ESTÁ AQUÍ: Modulariza la vista de "estado actual" para que sea fácil de leer y mantener.
 */
import React from 'react';
import { FaDownload, FaTrashAlt } from 'react-icons/fa';

const ReservationCard = ({ reserva, onDownload, onDelete }) => {
    return (
        <div className="reserva-item">
            <div style={{flex: 1}}>
                <div style={{fontWeight:'bold', color:'#0a3d62'}}>
                    #{reserva.espacio} - {reserva.lugar}
                </div>
                <div style={{fontSize:'0.8rem', color:'#666'}}>
                    {reserva.fecha} • {reserva.hora}
                </div>
            </div>
            
            <div style={{display:'flex', gap:'5px'}}>
                <button 
                    onClick={() => onDownload(reserva)} 
                    className="btn-action-primary" 
                    title="Descargar Ticket"
                >
                    <FaDownload/>
                </button>
                <button 
                    onClick={() => onDelete(reserva.id)} 
                    className="btn-action-danger" 
                    title="Cancelar Reserva"
                >
                    <FaTrashAlt/>
                </button>
            </div>
        </div>
    );
};

export default ReservationCard;