/**
 * COMPONENTE: Navbar
 * PROPÓSITO: Barra de navegación superior reutilizable.
 */
import React from 'react';
import { FaSignOutAlt, FaParking } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = ({ onLogout }) => {
    return (
        <nav className={styles.navbar}>
            <div className={styles.brand}>
                <FaParking color="#f1c40f" size={24}/> 
                <span>
                    POLI<span className={styles.brandSpan}>PARKING</span>
                </span>
            </div>
            <button 
                onClick={onLogout} 
                className={styles.logoutBtn} 
                title="Cerrar Sesión"
                type="button"
            >
                <FaSignOutAlt size={20}/>
            </button>
        </nav>
    );
};

export default Navbar;