/**
 * COMPONENTE: UserInfo
 * PROPÓSITO: Visualiza la tarjeta con la información del usuario (Nombre, Avatar, Rol).
 */
import React from 'react';
import styles from './UserInfo.module.css';

const UserInfo = ({ user }) => {
    // Evitamos errores si el objeto user no ha cargado
    const nombre = user?.nombre || 'Cargando...';
    const inicial = nombre.charAt(0).toUpperCase();
    const rol = user?.rol || '...';

    return (
        <div className={styles.card}>
            <div className={styles.userContainer}>
                {/* Avatar con la inicial */}
                <div className={styles.avatar}>
                    {inicial}
                </div>
                
                {/* Datos de texto */}
                <div className={styles.textContainer}>
                    <div className={styles.userName}>
                        {nombre}
                    </div>
                    <div className={styles.userRol}>
                        {rol}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;