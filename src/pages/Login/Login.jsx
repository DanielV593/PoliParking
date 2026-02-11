import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'; 
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';

import { auth, db } from '../../firebase/config.js';
import Header from '../../components/header/Header'; 
import MascotaLogin from '../../components/MascotaLogin'; 

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

    const handleResetPassword = async () => {
    const { value: emailInput } = await Swal.fire({
        title: '¿Olvidaste tu contraseña?',
        text: "Ingresa tu correo institucional y te enviaremos un enlace para que la cambies.",
        input: 'email',
        inputPlaceholder: 'usuario@epn.edu.ec',
        showCancelButton: true,
        confirmButtonColor: '#0a3d62',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Enviar enlace',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) return '¡Necesitamos tu correo!';
            if (!value.endsWith('@epn.edu.ec')) return 'Usa un correo de la Poli (@epn.edu.ec)';
        }
    });

    if (emailInput) {
        try {
            // Enviamos el correo a través de Firebase Auth
            await sendPasswordResetEmail(auth, emailInput);
            
            Swal.fire({
                title: '¡Correo enviado!',
                text: `Revisa la bandeja de entrada de ${emailInput}. No olvides revisar la carpeta de Spam.`,
                icon: 'success',
                confirmButtonColor: '#0a3d62'
            });
        } catch (error) {
            console.error("Error al resetear:", error.code);
            if (error.code === 'auth/user-not-found') {
                Swal.fire('Usuario no encontrado', 'No tenemos ninguna cuenta registrada con ese correo.', 'error');
            } else {
                toast.error('Error al enviar el correo: ' + error.message);
            }
        }
    }
};

    const handleLogin = async (e) => {
    e.preventDefault();

    // 1. INVITADOS (Se mantiene igual)
    if (rol === 'invitado') {
        const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
        if (!regexPlaca.test(placaInv.toUpperCase())) {
            toast.error('Formato de placa inválido (ABC-1234)');
            return;
        }
        try {
            const guestData = { nombre: nombreInv, celular: celularInv, placa: placaInv.toUpperCase() };
            await addDoc(collection(db, "ingresos_invitados"), { ...guestData, fecha: new Date().toLocaleString(), rol: 'invitado' });
            localStorage.setItem('userRole', 'invitado');
            navigate('/guest');
            return;
        } catch (err) { toast.error('Error al registrar invitado.'); return; }
    }

    // 2. LÓGICA UNIFICADA (Admin, Estudiante, Docente)
    try {
        const q = query(collection(db, "usuarios"), where("email", "==", email.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            Swal.fire({
                title: 'Usuario no registrado',
                text: 'No encontramos tu cuenta. ¿Quieres registrarte?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Registrarme',
                confirmButtonColor: '#0a3d62'
            }).then((res) => { if (res.isConfirmed) navigate('/register'); });
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Verificar si está bloqueado
        if (userData.estado === 'bloqueado') {
            Swal.fire({ title: 'Cuenta Bloqueada', icon: 'error', confirmButtonColor: '#e30613' });
            return;
        }

        // Intento de Login en Firebase Auth
        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // 🔥 VALIDACIÓN DINÁMICA: Ya no importa el correo, solo que el ROL coincida
            // El rol del select debe ser igual al rol en Firestore (ej: "administrador" === "admin")
            // Nota: Verifica si en tu select el value es "administrador" y en Firestore es "admin"
            const rolMatch = (rol === 'administrador' && userData.rol === 'admin') || (rol === userData.rol);

            if (!rolMatch) {
                await signOut(auth);
                toast.warning(`Esta cuenta es de tipo ${userData.rol.toUpperCase()}. Selecciona el tipo correcto.`);
                return;
            }

            // Éxito: Limpiamos intentos y navegamos
            if (userData.intentosFallidos > 0) {
                await updateDoc(doc(db, "usuarios", userDoc.id), { intentosFallidos: 0 });
            }

            localStorage.setItem('userRole', userData.rol);
            
// 🔥 CORRECCIÓN AQUÍ:
if (userData.rol === 'admin') {
    navigate('/admin');
} else if (userData.rol === 'docente') {
    navigate('/docente'); // <-- Antes decía '/dashboard', cámbialo a '/docente'
} else {
    navigate('/dashboard'); // Los estudiantes van aquí
}

        } catch (authError) {
            const nuevosIntentos = (userData.intentosFallidos || 0) + 1;
            await updateDoc(doc(db, "usuarios", userDoc.id), { intentosFallidos: nuevosIntentos });
            toast.error(`Credenciales incorrectas. Intento ${nuevosIntentos} de 3.`);
        }
    } catch (error) {
        toast.error("Error en el acceso: " + error.message);
    }
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
                        <h2 className="auth-title">Iniciar Sesión</h2>
                        <p className="auth-footer">¿No tienes cuenta? <Link to="/register" style={{color:'#0a3d62', fontWeight:'bold'}}>Regístrate aquí</Link></p>
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
                                        <input type="text" value={placaInv} onChange={e=>setPlacaInv(e.target.value)} required className='auth-register__input' placeholder="ABC-1234" />
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
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className='auth-register__toggle'>
                                                {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                            </button>
                                        </div>
                                        <p onClick={handleResetPassword} style={{ cursor: 'pointer', color: '#0a3d62', fontSize: '0.85rem', marginTop: '12px', fontWeight: 'bold', textAlign: 'right' }}>
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