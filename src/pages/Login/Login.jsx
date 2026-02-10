import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'; 
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';

// Un solo import de Firebase para evitar errores
import { auth, db } from '../../firebase/config.js';
import Header from '../../components/header/Header'; 
import MascotaLogin from '../../components/MascotaLogin'; 
import './Login.css';

const Login = () => {
    const [rol, setRol] = useState('estudiante');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombreInv, setNombreInv] = useState('');
    const [celularInv, setCelularInv] = useState('');
    const [placaInv, setPlacaInv] = useState('');
    
    const navigate = useNavigate();
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // --- FUNCIÓN DE RECUPERACIÓN DE CONTRASEÑA ---
    const handleResetPassword = async () => {
        const { value: emailInput } = await Swal.fire({
            title: 'Restablecer contraseña',
            input: 'email',
            inputLabel: 'Ingresa tu correo institucional',
            inputPlaceholder: 'ejemplo@epn.edu.ec',
            showCancelButton: true,
            confirmButtonColor: '#0a3d62',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Enviar enlace',
            cancelButtonText: 'Cancelar'
        });

        if (emailInput) {
            try {
                await sendPasswordResetEmail(auth, emailInput);
                Swal.fire(
                    '¡Correo enviado!',
                    'Revisa tu bandeja de entrada para cambiar tu contraseña.',
                    'success'
                );
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No pudimos encontrar una cuenta con ese correo.', 'error');
            }
        }
    };

    // --- FUNCIÓN DE LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validación de placa para invitados
        if (rol === 'invitado') {
            const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
            if (!regexPlaca.test(placaInv.toUpperCase())) {
                toast.error('Formato de placa inválido (Ej: ABC-1234)');
                return;
            }
        }

        if (rol === 'administrador') {
            if (email === 'admin@epn.edu.ec' && password === 'admin1234') {
                localStorage.setItem('userRole', 'administrador');
                window.location.href = '/admin'; 
                return;
            } else {
                toast.error('Credenciales de administrador incorrectas.');
                return;
            }
        }

        if (rol === 'invitado') {
            try {
                await signOut(auth);
                localStorage.clear();
                const guestData = { nombre: nombreInv, celular: celularInv, placa: placaInv.toUpperCase() };
                await addDoc(collection(db, "ingresos_invitados"), { ...guestData, fecha: new Date().toLocaleString(), rol: 'invitado' });
                localStorage.setItem('userRole', 'invitado');
                localStorage.setItem('guestData', JSON.stringify(guestData));
                navigate('/guest'); 
                return;
            } catch (err) { toast.error('Error al registrar invitado.'); return; }
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const q = query(collection(db, "usuarios"), where("email", "==", email.trim()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.rol !== rol) { await signOut(auth); toast.warning(`Tu cuenta es de ${data.rol}, no de ${rol}.`); return; }
                if (data.estado === 'bloqueado') { await signOut(auth); toast.error('Cuenta bloqueada.'); return; }
                localStorage.setItem('userRole', data.rol);
                navigate('/dashboard'); 
            } else { await signOut(auth); toast.error('Usuario no encontrado.'); }
        } catch (err) { toast.error('Credenciales incorrectas.'); }
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
                            <h2 className="auth-title" style={{ margin: '10px 0' }}>Iniciar Sesión</h2>
                            <p className="auth-footer">
                                ¿No tienes cuenta? <br/>
                                <Link to="/register" style={{color:'#0a3d62', fontWeight:'bold'}}>Regístrate aquí</Link>
                            </p>
                        </div>
                    </div>

                    <div className='auth-register__right'>
                        <form onSubmit={handleLogin} className="auth-form">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className='auth-register__label'>Tipo Usuario</label>
                                <select value={rol} onChange={(e) => setRol(e.target.value)} className="auth-register__input">
                                    <option value="estudiante">Estudiante</option>
                                    <option value="docente">Docente</option>
                                    <option value="invitado">Invitado</option>
                                    <option value="administrador">Administrador</option>
                                </select>
                            </div>
                            
                            {rol === 'invitado' ? (
                                <>
                                    <div className="form-group">
                                        <label className='auth-register__label'>Nombre Completo</label>
                                        <input type="text" value={nombreInv} onChange={e=>setNombreInv(e.target.value)} required className='auth-register__input' />
                                    </div>
                                    <div className="form-group">
                                        <label className='auth-register__label'>Placa (ABC-1234)</label>
                                        <input type="text" value={placaInv} onChange={e=>setPlacaInv(e.target.value)} required className='auth-register__input' placeholder="PCO-4875" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className='auth-register__label'>Celular</label>
                                        <input type="tel" value={celularInv} onChange={e=>setCelularInv(e.target.value)} required className='auth-register__input' />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className='auth-register__label'>Correo Institucional</label>
                                        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className='auth-register__input'/>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className='auth-register__label'>Contraseña</label>
                                        <div className='auth-register__password'>
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e=>setPassword(e.target.value)} 
                                                onFocus={() => setIsPasswordFocused(true)} 
                                                onBlur={() => setIsPasswordFocused(false)} 
                                                className='auth-register__input' 
                                                style={{width:'100%'}}
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className='auth-register__toggle'>
                                                {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                            </button>
                                        </div>
                                        
                                        {/* ENLACE DE RECUPERACIÓN AQUÍ */}
                                        <p 
                                            onClick={handleResetPassword} 
                                            style={{ cursor: 'pointer', color: '#0a3d62', fontSize: '0.85rem', marginTop: '12px', fontWeight: 'bold', textAlign: 'right' }}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </p>
                                    </div>
                                </>
                            )}
                            <button type="submit" className="auth-register__submit">Ingresar</button>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer position='top-right'/>
        </div>
    );
};

export default Login;