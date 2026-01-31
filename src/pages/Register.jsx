import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/header/Header';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config'; 
import MascotaLogin from '../components/MascotaLogin';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [rol, setRol] = useState('estudiante');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [placa, setPlaca] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.endsWith('@epn.edu.ec')) {
      setError('Solo se permiten correos institucionales @epn.edu.ec');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid, nombre, email, placa: placa.toUpperCase(), celular, rol: rol, fechaRegistro: new Date()
      });
      alert(`¡Registro de ${rol} exitoso!`);
      navigate('/login');
    } catch (error) { setError(error.message); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <div className="auth-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '20px' }}>
        
        {/* DISEÑO 2 COLUMNAS COMPACTO */}
        <div className="auth-card" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'row', height: '480px' }}> 
          
          {/* IZQUIERDA: Mascota */}
          <div style={{ width: '40%', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #eee' }}>
             <MascotaLogin isPasswordFocused={isPasswordFocused} showPassword={showPassword} />
             <h2 className="auth-title" style={{marginTop: '-20px', fontSize: '1.5rem'}}>Crear Cuenta</h2>
             <p className="auth-footer" style={{marginTop: '20px'}}>
                ¿Ya tienes cuenta? <br/><Link to="/login" style={{fontWeight:'bold'}}>Inicia Sesión</Link>
             </p>
          </div>

          {/* DERECHA: Formulario Grid */}
          <div style={{ width: '60%', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {error && <p style={{color: '#e30613', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 10px 0'}}>{error}</p>}
            
            <form onSubmit={handleRegister} className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              <div className="form-group">
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Tipo Usuario</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-select" style={{padding: '8px', fontSize:'0.9rem'}}>
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{padding: '8px', fontSize:'0.9rem'}} />
              </div>

              <div className="form-group">
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Placa</label>
                <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} required style={{padding: '8px', fontSize:'0.9rem'}} />
              </div>
              <div className="form-group">
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Celular</label>
                <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} required style={{padding: '8px', fontSize:'0.9rem'}} />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Correo Institucional</label>
                <input type="email" placeholder="usuario@epn.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} required style={{padding: '8px', fontSize:'0.9rem'}} />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{fontSize: '0.75rem', fontWeight:'bold'}}>Contraseña</label>
                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} style={{width: '100%', paddingRight: '35px', padding: '8px', fontSize:'0.9rem'}} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer'}}>
                    {/* CORRECCIÓN: Iconos intercambiados */}
                    {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-auth" style={{ gridColumn: '1 / -1', padding: '10px', marginTop: '5px' }}>Registrarse</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Register;