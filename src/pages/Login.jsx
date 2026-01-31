import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/header/Header';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config';

const Login = () => {
  const [rol, setRol] = useState('estudiante');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para Invitados
  const [nombreInv, setNombreInv] = useState('');
  const [celularInv, setCelularInv] = useState('');
  const [placaInv, setPlacaInv] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 1. LÓGICA DE ADMINISTRADOR
    if (rol === 'administrador') {
      if (email === 'admin@epn.edu.ec' && password === 'admin1234') {
        localStorage.setItem('userRole', 'administrador');
        window.location.href = '/dashboard-admin';
        return;
      } else {
        setError('Credenciales de administrador incorrectas.');
        return;
      }
    }

    // 2. LÓGICA DE INVITADO
    if (rol === 'invitado') {
      try {
        await addDoc(collection(db, "ingresos_invitados"), {
          nombre: nombreInv,
          celular: celularInv,
          placa: placaInv.toUpperCase(),
          fecha: new Date().toLocaleString(),
          rol: 'invitado'
        });
        localStorage.setItem('userRole', 'invitado');
        window.location.href = '/dashboard-user'; 
        return;
      } catch (err) {
        setError('Error al registrar datos de invitado.');
        return;
      }
    }

    // 3. LÓGICA DE ESTUDIANTE / DOCENTE
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const q = query(collection(db, "usuarios"), where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        if (userData.rol !== rol) {
          await signOut(auth);
          setError(`Acceso denegado: Tu cuenta es de tipo ${userData.rol.toUpperCase()}.`);
          return;
        }

        if (userData.estado === 'bloqueado') {
          await signOut(auth); 
          setError('🚫 Tu cuenta ha sido bloqueada.');
          return;
        }

        localStorage.setItem('userRole', userData.rol);
        window.location.href = '/dashboard-user'; 

      } else {
        await signOut(auth);
        setError('El usuario no existe en la base de datos.');
      }

    } catch (err) {
      console.error(err);
      setError('Correo o contraseña incorrectos.');
    }
  }; // <--- AQUÍ ESTABA EL ERROR, FALTABA ESTA LLAVE

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card" data-aos="fade-up">
          <h2 className="auth-title">PoliParking Access</h2>
          
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            
            <div className="form-group">
              <label className="auth-label">Ingresar como:</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-select">
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="invitado">Invitado</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            {rol === 'invitado' ? (
              <>
                <div className="form-group">
                  <label className="auth-label">Nombre Completo</label>
                  <input type="text" placeholder="Ej. Juan Pérez" value={nombreInv} onChange={(e) => setNombreInv(e.target.value)} className="auth-input" required />
                </div>
                <div className="form-group">
                  <label className="auth-label">Teléfono</label>
                  <input type="tel" placeholder="0999999999" value={celularInv} onChange={(e) => setCelularInv(e.target.value)} className="auth-input" required />
                </div>
                <div className="form-group">
                  <label className="auth-label">Placa del Vehículo</label>
                  <input type="text" placeholder="ABC-1234" value={placaInv} onChange={(e) => setPlacaInv(e.target.value)} className="auth-input" required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="auth-label">Correo Institucional</label>
                  <input type="email" placeholder="usuario@epn.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" required />
                </div>
                <div className="form-group">
                  <label className="auth-label">Contraseña</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" required />
                </div>
              </>
            )}

            <button type="submit" className="btn-auth">Entrar al Sistema</button>
          </form>

          {(rol === 'estudiante' || rol === 'docente') && (
            <p className="auth-footer">
              ¿Nuevo aquí? <Link to="/register">Crea una cuenta</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;