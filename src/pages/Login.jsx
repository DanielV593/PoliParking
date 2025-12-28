import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
// IMPORTAMOS LA LÓGICA DE FIREBASE
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // ESTA LÍNEA VERIFICA TUS DATOS CON FIREBASE
      await signInWithEmailAndPassword(auth, email, password);
      
      // Si pasa, te lleva adentro
      navigate('/dashboard'); 

    } catch (error) {
      console.error(error.code);
      // Errores comunes
      if (error.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card" data-aos="fade-up">
          <h2 className="auth-title">Bienvenido de nuevo</h2>
          <p className="auth-subtitle">Ingresa tus credenciales para reservar</p>
          
          {/* Mensaje de error rojo */}
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Correo Institucional</label>
              <input 
                type="email" 
                placeholder="usuario@epn.edu.ec" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn-auth">Ingresar</button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;