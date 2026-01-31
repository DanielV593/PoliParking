import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/header/Header';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config'; 

const Register = () => {
  const [rol, setRol] = useState('estudiante'); // Solo estudiante o docente
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

    // VALIDACIÓN CORREO EPN
    if (!email.endsWith('@epn.edu.ec')) {
      setError('Solo se permiten correos institucionales @epn.edu.ec');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre,
        email,
        placa: placa.toUpperCase(),
        celular,
        rol: rol,
        fechaRegistro: new Date()
      });
      
      alert(`¡Registro de ${rol} exitoso!`);
      navigate('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Crear Cuenta</h2>
          
          <div className="form-group">
            <label>Tipo de Usuario</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-select">
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
            </select>
          </div>

          {error && <p style={{color: 'red', textAlign: 'center', marginBottom: '1rem'}}>{error}</p>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Correo Institucional</label>
              <input type="email" placeholder="usuario@epn.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Placa del Vehículo</label>
              <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Celular</label>
              <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} required />
            </div>

            <button type="submit" className="btn-auth">Registrarse</button>
          </form>
          <p className="auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link></p>
        </div>
      </div>
    </>
  );
};

export default Register;