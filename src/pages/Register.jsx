import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/header/Header';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config'; 
import MascotaLogin from '../components/MascotaLogin';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import {ToastContainer, toast} from 'react-toastify';

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
    if (!email.endsWith('@epn.edu.ec')) {
      toast.warning('Solo se permiten correos institucionales @epn.edu.ec');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid, nombre, email, placa: placa.toUpperCase(), celular, rol: rol, fechaRegistro: new Date()
      });
      toast.success(`¡Registro de ${rol} exitoso!`);
      navigate('/login');
    } catch (error) {
      let mensaje = 'Error al registrar usuario';

      switch (error.code) {
        case 'auth/email-already-in-use':
          mensaje = 'Este correo ya se encuentra registrado';
          break;
        case 'auth/weak-password':
          mensaje = 'La contraseña es muy débil (mínimo 6 caracteres)';
          break;
        case 'auth/invalid-email':
          mensaje = 'Correo electrónico inválido';
          break;
        default:
          mensaje = 'Ocurrió un error inesperado';
      }

      toast.error(mensaje);
    }
  };



  return (
    <div className='auth-page'>
      <Header />
      <div className="auth-container auth-container--register">
        {/* DISEÑO 2 COLUMNAS COMPACTO */}
        <div className="auth-card auth-card--register" > 
          
          {/* IZQUIERDA: Mascota */}
          <div className='auth-register__left'>
             <MascotaLogin isPasswordFocused={isPasswordFocused} showPassword={showPassword} />
             <h2 className="auth-title auth-register__title">Crear Cuenta</h2>
             <p className="auth-footer auth-register__footer">
                ¿Ya tienes cuenta? <br/><Link to="/login" className='auth-register__link'>Inicia Sesión</Link>
             </p>
          </div>

          {/* DERECHA: Formulario Grid */}
          <div className='auth-register__right'>
            {error && <p style={{color: '#e30613', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 10px 0'}}>{error}</p>}
            <form onSubmit={handleRegister} className="auth-form auth-form--register" >
              <div className="form-group">
                <label className='auth-register__label'>Tipo Usuario</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-select auth-register__input">
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                </select>
              </div>
              <div className="form-group">
                <label className='auth-register__label'>Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className='auth-register__input' />
              </div>

              <div className="form-group">
                <label className='auth-register__label'>Placa</label>
                <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)}  required className='auth-register__input'/>
              </div>
              <div className="form-group">
                <label className='auth-register__label'>Celular</label>
                <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} required className='auth-register__input' />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className='auth-register__label'>Correo Institucional</label>
                <input type="email" placeholder="usuario@epn.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} required className='auth-register__input'/>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className='auth-register__label'>Contraseña</label>
                <div className='auth-register__password'>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} className='auth-register__input auth-register__input--password' required/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className='auth-register__toggle' >
                    {/* CORRECCIÓN: Iconos intercambiados */}
                    {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-auth auth-register__submit" >Registrarse</button>
            </form>
          </div>

        </div>
      </div>
      <ToastContainer position='top-right'/>
    </div>
  );
};
export default Register;