import React, { useState, useEffect } from 'react';
import { db } from "../../../firebase/config.js";
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FaBullhorn, FaSave, FaTrashAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ModuleAvisos = () => {
    const [mensaje, setMensaje] = useState("");
    const [estaActivo, setEstaActivo] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Escuchar el aviso actual en tiempo real
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "avisos", "global"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMensaje(data.mensaje || "");
                setEstaActivo(data.activo || false);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // 2. Función para publicar/actualizar
    const handlePublicar = async () => {
        if (!mensaje.trim()) {
            return Swal.fire('Campo vacío', 'Por favor escribe un mensaje antes de publicar.', 'warning');
        }

        try {
            const avisoRef = doc(db, "avisos", "global");
            await updateDoc(avisoRef, {
                mensaje: mensaje,
                activo: true,
                fecha: serverTimestamp()
            });
            Swal.fire('¡Publicado!', 'El aviso ahora es visible para todos los usuarios.', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar: ' + error.message, 'error');
        }
    };

    // 3. Función para desactivar (quitar banner)
    const handleDesactivar = async () => {
        try {
            await updateDoc(doc(db, "avisos", "global"), { activo: false });
            Swal.fire('Aviso Retirado', 'El banner ya no se mostrará en la aplicación.', 'info');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <p>Cargando configuración de avisos...</p>;

    return (
        <div className="module-container">
            <div className="module-header">
                <h2><FaBullhorn /> Gestión de Avisos Globales</h2>
                <p>Configura comunicados en tiempo real para la comunidad PoliParking.</p>
            </div>

            <div className="aviso-card">
                <div className={`status-badge ${estaActivo ? 'active' : 'inactive'}`}>
                    {estaActivo ? <><FaCheckCircle /> Aviso Activo actualmente</> : <><FaExclamationTriangle /> No hay avisos visibles</>}
                </div>

                <div className="aviso-form">
                    <label>Contenido del Mensaje</label>
                    <textarea 
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Ej: El parqueadero de Sistemas está lleno. Favor dirigirse al CEC."
                        rows="4"
                    />
                    
                    <div className="aviso-actions">
                        <button onClick={handlePublicar} className="btn-publish">
                            <FaSave /> {estaActivo ? 'Actualizar Aviso' : 'Publicar Aviso'}
                        </button>
                        {estaActivo && (
                            <button onClick={handleDesactivar} className="btn-remove">
                                <FaTrashAlt /> Quitar de la App
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="aviso-preview">
                <h4>Vista previa del banner:</h4>
                {mensaje && (
                    <div className="preview-banner">
                        <FaBullhorn /> <span>{mensaje}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleAvisos;