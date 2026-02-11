/**
 * COMPONENTE: ReservationCard
 * PROPÓSITO: Muestra la reserva activa del usuario y botones de acción.
 */
import React from 'react';
import { FaDownload, FaTrashAlt } from 'react-icons/fa';
import styles from './ReservationCard.module.css';

const ReservationCard = ({ reserva, onDownload, onDelete }) => {
    if (!reserva) return null;

    return (
        <div className={styles.card}>
            <div className={styles.info}>
                <div className={styles.title}>
                    #{reserva.espacio} - {reserva.lugar}
                </div>
                <div className={styles.dateTime}>
                    {reserva.fecha} • {reserva.hora}
                </div>
            </div>
            
            <div className={styles.actions}>
                <button 
                    onClick={() => onDownload(reserva)} 
                    className={`${styles.btnAction} ${styles.download}`}
                    title="Descargar Ticket"
                    type="button"
                >
                    <FaDownload />
                </button>
                <button 
                    onClick={() => onDelete(reserva.id)} 
                    className={`${styles.btnAction} ${styles.delete}`}
                    title="Cancelar Reserva"
                    type="button"
                >
                    <FaTrashAlt />
                </button>
            </div>
        </div>
    );
};

export default ReservationCard;