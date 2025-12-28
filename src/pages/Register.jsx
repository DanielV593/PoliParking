import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
// IMPORTAMOS LA LÓGICA DE FIREBASE
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Para mostrar errores en pantalla
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos

    try {
      // ESTA LÍNEA CREA EL USUARIO EN LA NUBE REAL
      await createUserWithEmailAndPassword(auth, email, password);
      
      alert("¡Cuenta creada con éxito! Ahora inicia sesión.");
      navigate('/login'); // Te manda al login automáticamente

    } catch (error) {
      console.error(error.code);
      // Manejo de errores comunes
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrarse. Revisa tu conexión.');
      }
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card" data-aos="fade-up">
          <h2 className="auth-title">Crear Cuenta</h2>
          <p className="auth-subtitle">Únete a PoliParking hoy mismo</p>
          
          {/* Mensaje de error rojo si falla algo */}
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Correo Institucional</label>
              <input 
                type="email" 
                placeholder="ejemplo@epn.edu.ec" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn-auth">Registrarse</button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;