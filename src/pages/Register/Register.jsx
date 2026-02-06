import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';

// Imports
import { auth, db } from '../../firebase/config'; 
import Header from '../../components/header/Header';
import MascotaLogin from '../../components/MascotaLogin';
import './Register.css'; // <--- Importamos los estilos locales

const Register = () => {
  const [rol, setRol] = useState('estudiante');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [placa, setPlaca] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@epn.edu.ec')) {
      toast.warning('Solo se permiten correos institucionales @epn.edu.ec');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid, nombre, email, placa: placa.toUpperCase(), celular, rol: rol, estado: 'activo', fechaRegistro: new Date()
      });
      toast.success(`¡Registro de ${rol} exitoso!`);
      navigate('/login');
    } catch (error) { toast.error('Error al registrar usuario'); }
  };

  return (
    <div className='auth-page'>
      <Header />
      <div className="auth-container">
        <div className="auth-card"> 
          <div className='auth-register__left'>
              <div style={{ marginBottom: '30px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <MascotaLogin isPasswordFocused={isPasswordFocused && !showPassword} showPassword={showPassword} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 className="auth-title" style={{ margin: '10px 0' }}>Crear Cuenta</h2>
                <p className="auth-footer">
                  ¿Ya tienes cuenta? <br/><Link to="/login" style={{color:'#0a3d62', fontWeight:'bold'}}>Inicia Sesión</Link>
                </p>
              </div>
          </div>
          <div className='auth-register__right'>
            <form onSubmit={handleRegister} className="auth-form">
              
              {/* CAMBIO 1: FULL WIDTH PARA EL SELECT */}
              <div className="form-group full-width">
                <label className='auth-register__label'>Tipo Usuario</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-register__input">
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                </select>
              </div>

              {/* CAMBIO 2: NOMBRE Y PLACA COMPARTEN FILA (No llevan full-width) */}
              <div className="form-group">
                <label className='auth-register__label'>Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className='auth-register__input' placeholder="Ej: Juan Pérez" />
              </div>
              
              <div className="form-group">
                <label className='auth-register__label'>Placa</label>
                <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} required className='auth-register__input' placeholder="Ej: PCQ-1234"/>
              </div>

              {/* CAMBIO 3: CELULAR NORMAL (Se acomoda solo) */}
              <div className="form-group">
                <label className='auth-register__label'>Celular</label>
                <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} required className='auth-register__input' placeholder="099..." />
              </div>

              {/* CAMBIO 4: EMAIL FULL WIDTH */}
              <div className="form-group full-width">
                <label className='auth-register__label'>Correo Institucional</label>
                <input type="email" placeholder="usuario@epn.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} required className='auth-register__input'/>
              </div>

              {/* CAMBIO 5: PASSWORD FULL WIDTH */}
              <div className="form-group full-width">
                <label className='auth-register__label'>Contraseña</label>
                <div className='auth-register__password'>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setIsPasswordFocused(true)} 
                    onBlur={() => setIsPasswordFocused(false)} 
                    className='auth-register__input' 
                    style={{width:'100%'}}
                    required
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className='auth-register__toggle'>
                    {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-register__submit">Registrarse</button>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position='top-right'/>
    </div>
  );
};
export default Register;