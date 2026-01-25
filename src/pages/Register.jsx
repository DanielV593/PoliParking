import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';

// IMPORTAMOS LIBRERÍAS DE FIREBASE
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Para guardar datos
import { auth, db } from '../firebase/config'; 

const Register = () => {
  // Estados para todos los campos
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [placa, setPlaca] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. CREAR USUARIO EN AUTH (Seguridad)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. GUARDAR DATOS EN FIRESTORE (Base de Datos)
      // Usamos el ID del usuario (uid) como nombre del documento
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre: nombre,
        email: email,
        placa: placa.toUpperCase(), // Guardamos placa en mayúsculas
        celular: celular,
        rol: "usuario", // Por defecto todos son usuarios normales
        fechaRegistro: new Date()
      });
      
      alert("¡Registro exitoso! Datos guardados en la base de datos.");
      navigate('/login');

    } catch (error) {
      console.error("Error:", error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es muy débil (mínimo 6 caracteres).');
      } else {
        setError('Error al registrar: ' + error.message);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Crear Cuenta</h2>
          <p className="auth-subtitle">Regístrate para reservar tu espacio</p>
          
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}

          <form onSubmit={handleRegister} className="auth-form">
            {/* NOMBRE */}
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" placeholder="Juan Pérez" 
                value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            {/* CORREO */}
            <div className="form-group">
              <label>Correo Institucional</label>
              <input type="email" placeholder="juan.perez@epn.edu.ec" 
                value={email} onChange={(e) => setEmail(e.target.value.trim())} required />
            </div>

            {/* PLACA (Importante para PoliParking) */}
            <div className="form-group">
              <label>Placa del Vehículo</label>
              <input type="text" placeholder="PBA-1234" 
                value={placa} onChange={(e) => setPlaca(e.target.value)} required />
            </div>

            {/* CELULAR */}
            <div className="form-group">
              <label>Celular</label>
              <input type="tel" placeholder="0991234567" 
                value={celular} onChange={(e) => setCelular(e.target.value)} required />
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres" 
                value={password} onChange={(e) => setPassword(e.target.value)} required />
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