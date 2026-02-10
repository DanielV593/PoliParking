import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext'; // Tu contexto de Auth
import { db } from '../../firebase/config.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Importamos las dos vistas
import DashboardEstudiantes from '../DashboardEstudiantes/DashboardEstudiantes.jsx';
import DashboardDocentes from '../DashboardDocentes/DashboardDocentes.jsx';

const DashboardUser = () => {
    const { user } = useUser();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        // Buscamos quién es este usuario en la BD
        const q = query(collection(db, "usuarios"), where("email", "==", user.email));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setUserData({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <div style={{
                height: '100vh', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: '#0a3d62', 
                color: 'white',
                fontFamily: 'Lato, sans-serif'
            }}>
                Cargando tu perfil PoliParking...
            </div>
        );
    }

    // --- LOGICA PARA VALIDAR SI SE INGRESA COMO DOCENTE/PERSONAL ADMINISTRATIVO O COMO ESTUDIANTE ---
    if (userData?.rol === 'docente' || userData?.rol === 'administrativo') {
        return <DashboardDocentes user={userData} />;
    } else {
        // Por defecto estudiantes
        return <DashboardEstudiantes user={userData} />;
    }
};

export default DashboardUser;