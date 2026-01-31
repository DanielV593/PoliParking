import React, { useState, useEffect } from 'react';
import '../css/MascotaLogin.css';

const MascotaLogin = ({ isPasswordFocused, showPassword, mode = 'card' }) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isPasswordFocused && !showPassword) return;

      const { innerWidth, innerHeight } = window;
      const x = (event.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (event.clientY - innerHeight / 2) / (innerHeight / 2);

      // Si es modo "full", permitimos más movimiento
      const range = mode === 'full' ? 25 : 10; 
      
      const moveX = x * range;
      const moveY = y * range + (mode === 'full' ? 0 : 5);

      setEyePosition({ x: moveX, y: moveY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused, showPassword, mode]);

  const eyesClosed = isPasswordFocused && !showPassword;

  return (
    // Agregamos la clase dinámica según el modo
    <div className={`mascota-container ${mode === 'full' ? 'mascota-full' : ''}`}>
      
      {/* Elementos decorativos extra para el modo pantalla completa */}
      {mode === 'full' && (
        <>
           <div className="decor-circle"></div>
           <div className="decor-triangle"></div>
        </>
      )}

      <div className="shape-blob"></div>

      <div className="head">
        <div className="eye-socket">
          <div 
            className={`pupil ${eyesClosed ? 'hidden' : ''}`}
            style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
          />
          <div className={`eyelid ${eyesClosed ? 'closed' : ''}`} />
        </div>

        <div className="eye-socket">
          <div 
            className={`pupil ${eyesClosed ? 'hidden' : ''}`}
            style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
          />
          <div className={`eyelid ${eyesClosed ? 'closed' : ''}`} />
        </div>
      </div>

      <div className="shape-rect"></div>
    </div>
  );
};

export default MascotaLogin;