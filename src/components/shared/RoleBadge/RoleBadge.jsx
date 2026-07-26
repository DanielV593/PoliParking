// src/components/shared/RoleBadge/RoleBadge.jsx
// Badge de identidad de rol reutilizable en los 6 dashboards.
// Usa las variables --rol-* definidas en css/styles.css como color de acento.
import React from 'react';
import styles from './RoleBadge.module.css';

/**
 * @param {string} role - Texto a mostrar, ej. "Admin", "Guardia", "Invitado"
 * @param {'admin'|'guardia'|'invitado'|'estudiante'|'personal'|'docente'} accent - variante de color
 */
const RoleBadge = ({ role, accent }) => {
    return (
        <span className={`${styles.badge} ${styles[accent] || ''}`}>
            {role}
        </span>
    );
};

export default RoleBadge;
