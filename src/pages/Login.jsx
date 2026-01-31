import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/header/Header';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config';

import MascotaLogin from '../components/MascotaLogin';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [rol, setRol] = useState('estudiante');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de invitado
  const [nombreInv, setNombreInv] = useState('');
  const [celularInv, setCelularInv] = useState('');
  const [placaInv, setPlacaInv] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados visuales Mascota
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // --- LOGICA DE ADMIN ---
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

    // --- LOGICA DE INVITADO ---
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
        setError('Error al registrar invitado.');
        return;
      }
    }

    // --- LOGICA ESTUDIANTE/DOCENTE ---
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const q = query(collection(db, "usuarios"), where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        
        if (userData.rol !== rol) {
          await signOut(auth);
          setError(`Error: Tu cuenta es de ${userData.rol}, no de ${rol}.`);
          return;
        }
        if (userData.estado === 'bloqueado') {
          await signOut(auth); 
          setError('Cuenta bloqueada.');
          return;
        }

        localStorage.setItem('userRole', userData.rol);
        window.location.href = '/dashboard-user'; 

      } else {
        await signOut(auth);
        setError('Usuario no encontrado en base de datos.');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') setError('Credenciales incorrectas.');
      else setError('Error al iniciar sesión.');
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-card" data-aos="fade-up">
          
          {/* 1. LA MASCOTA ARRIBA (Estilo Card) */}
          <MascotaLogin 
            isPasswordFocused={isPasswordFocused} 
            showPassword={showPassword}
          />

          <div className="auth-content">
            <h2 className="auth-title">Bienvenido</h2>
            <p className="auth-subtitle">Ingresa para reservar tu sitio</p>
            
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="auth-label">Soy:</label>
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
                      <label>Nombre</label>
                      <input type="text" className="auth-input" value={nombreInv} onChange={e=>setNombreInv(e.target.value)} required />
                   </div>
                   <div className="form-group">
                      <label>Placa</label>
                      <input type="text" className="auth-input" value={placaInv} onChange={e=>setPlacaInv(e.target.value)} required />
                   </div>
                   <div className="form-group">
                      <label>Celular</label>
                      <input type="tel" className="auth-input" value={celularInv} onChange={e=>setCelularInv(e.target.value)} required />
                   </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Correo Institucional</label>
                    <input type="email" placeholder="u@epn.edu.ec" className="auth-input" value={email} onChange={e=>setEmail(e.target.value)} required />
                  </div>
                  
                  <div className="form-group">
                    <label>Contraseña</label>
                    <div style={{position:'relative', display:'flex', alignItems:'center'}}>
                      <input 
                        type={showPassword ? "text":"password"} 
                        className="auth-input" 
                        value={password}
                        onChange={e=>setPassword(e.target.value)}
                        onFocus={()=>setIsPasswordFocused(true)}
                        onBlur={()=>setIsPasswordFocused(false)}
                        style={{paddingRight:'40px'}}
                        required 
                      />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', color:'#666'}}>
                        {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-auth">Ingresar</button>
            </form>

            {rol !== 'invitado' && rol !== 'administrador' && (
              <p className="auth-footer">
                ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;