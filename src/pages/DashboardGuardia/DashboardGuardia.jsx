import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config.js';

import ModuleInicioGuardia from "./modules/ModuleInicioGuardia";
import ModuleChatGuardia from "./modules/ModuleChatGuardia";
import ModuleAvisosGuardia from "./modules/ModuleAvisosGuardia";
import ModuleActividadGuardia from "./modules/ModuleActividadGuardia";

import styles from "./DashboardGuardia.module.css";

const DashboardGuardia = ({ user }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('inicio');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const fechaHoy = new Date().toISOString().split('T')[0];

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: "Se cerrará el panel de control de seguridad.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#e30613',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                navigate('/login');
            }
        });
    };

    const changeTab = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false); 
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.fixedBackground}></div>

            {/* 🔥 Capa oscura que aparece cuando el menú está abierto */}
            {isMenuOpen && (
                <div 
                    className={styles.backdrop} 
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}

            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.hamburgerBtn} 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>

                    <div className={styles.logoContainer}>
                        <span className={styles.logoIcon}>🛡️</span>
                        <h1 className={styles.logoText}>POLI<span>PARKING</span></h1>
                    </div>
                    <div className={styles.roleTag}>Guardia</div>
                    <span className={styles.userNameHeader}>👤 {user.nombre}</span>
                </div>

                <div className={styles.headerCenter}>
                    <span className={styles.dateBadge}>📅 {fechaHoy}</span>
                </div>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <span className={styles.logoutText}>Cerrar Sesión</span> 🚫
                </button>
            </header>

            <main className={styles.mainLayout}>
                <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
                    <button 
                        className={`${styles.menuItem} ${activeTab === 'inicio' ? styles.active : ''}`}
                        onClick={() => changeTab('inicio')}
                    >
                        📊 Resumen General
                    </button>
                    <button 
                        className={`${styles.menuItem} ${activeTab === 'actividad' ? styles.active : ''}`}
                        onClick={() => changeTab('actividad')}
                    >
                        🚗 Control Vehicular
                    </button>
                    <button 
                        className={`${styles.menuItem} ${activeTab === 'avisos' ? styles.active : ''}`}
                        onClick={() => changeTab('avisos')}
                    >
                        📢 Publicar Avisos
                    </button>
                    <button 
                        className={`${styles.menuItem} ${activeTab === 'chat' ? styles.active : ''}`}
                        onClick={() => changeTab('chat')}
                    >
                        💬 Chat de Soporte
                    </button>
                    <div className={styles.sidebarFooter}>
                        <p>PoliParking Security v2.0</p>
                    </div>
                </aside>

                <section className={styles.contentArea}>
                    {activeTab === 'inicio' && <ModuleInicioGuardia />}
                    {activeTab === 'actividad' && <ModuleActividadGuardia />}
                    {activeTab === 'avisos' && <ModuleAvisosGuardia user={user} />}
                    {activeTab === 'chat' && <ModuleChatGuardia user={user} />}
                </section>
            </main>
        </div>
    );
};

export default DashboardGuardia;