/**
 * COMPONENTE: UserInfo
 * PROPÓSITO: Visualiza la tarjeta con la información del usuario (Nombre, Avatar, Rol).
 * POR QUÉ ESTÁ AQUÍ: Separa la presentación de los datos del usuario de la lógica de negocio.
 */
import React from 'react';

const UserInfo = ({ user }) => {
    return (
        <div className="card user-card">
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                {/* Avatar con la inicial */}
                <div className="avatar">
                    {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                {/* Datos de texto */}
                <div>
                    <div style={{fontWeight:'bold'}}>{user.nombre || 'Cargando...'}</div>
                    <div style={{fontSize:'0.8rem', opacity:0.8}}>
                        {user.rol ? user.rol.toUpperCase() : '...'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;