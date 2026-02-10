import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Header from '../../components/header/Header';
import MascotaLogin from '../../components/MascotaLogin'; 
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '', 
        placa: '',
        rol: 'estudiante'
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handlePlacaChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) {
            value = value.slice(0, 3) + '-' + value.slice(3, 7);
        }
        setFormData({ ...formData, placa: value });
    };

    const handleRegister = async (e) => {
    e.preventDefault();
    const { nombre, email, password, confirmPassword, placa, rol } = formData;

    const partesNombre = nombre.trim().split(/\s+/); 
    
    const nombreValido = partesNombre.length >= 2 && partesNombre.every(parte => parte.length >= 3);

    if (!nombreValido) {
        Swal.fire({
            title: 'Nombre incompleto',
            text: 'Por favor, ingresa al menos un nombre y un apellido (mínimo 3 letras cada uno).',
            icon: 'warning',
            confirmButtonColor: '#0a3d62'
        });
        return;
    }
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!regexPassword.test(password)) {
        Swal.fire({
            title: 'Contraseña muy débil',
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    Tu contraseña debe cumplir con: <br><br>
                    • Mínimo <b>6 caracteres</b> <br>
                    • Una letra <b>Mayúscula</b> <br>
                    • Al menos un <b>Número</b> <br>
                    • Un <b>carácter especial</b> (@$!%*?&)
                </div>
            `,
            icon: 'warning',
            confirmButtonColor: '#0a3d62'
        });
        return;
    }

    // 3. Validación de correo institucional
    if (!email.endsWith('@epn.edu.ec')) {
        toast.error('Debes usar tu correo institucional @epn.edu.ec');
        return;
    }

        const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
        if (!regexPlaca.test(placa)) {
            Swal.fire({
                title: 'Formato de placa inválido',
                text: 'Usa el formato oficial (ej: ABC-1234)',
                icon: 'warning',
                confirmButtonColor: '#0a3d62'
            });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await addDoc(collection(db, "usuarios"), {
                uid: user.uid,
                nombre,
                email,
                placa,
                rol,
                estado: 'activo',
                fechaRegistro: new Date().toLocaleString()
            });

            Swal.fire({ title: '¡Registro Exitoso!', icon: 'success', confirmButtonColor: '#0a3d62' });
            navigate('/login');
        } catch (error) {
            toast.error('Hubo un error al registrarte.');
        }
    };

    return (
        <div className="auth-page">
            <Header />
            <div className="auth-container">
                <div className="auth-card">
                    
                    <div className="auth-register__left">
                        <MascotaLogin 
                            isPasswordFocused={isPasswordFocused && !showPassword} 
                            showPassword={showPassword} 
                        />
                        <h2 className="auth-title" style={{ marginTop: '20px', color: '#ffc107' }}>
                            Crea tu cuenta
                        </h2>
                        <p className="auth-footer" style={{ marginTop: '10px' }}>
                            Únete a la comunidad técnica más grande del país.
                        </p>
                    </div>

                    <div className="auth-register__right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '25px', gap: '10px' }}>
                            <span style={{ color: '#4a5568', fontSize: '0.85rem', fontWeight: '600' }}>
                                ¿YA TIENES CUENTA?
                            </span>
                            <Link to="/login" style={{ color: '#0a3d62', fontWeight: '800', fontSize: '0.9rem', textDecoration: 'underline' }}>
                                Inicia sesión
                            </Link>
                        </div>

                        <form onSubmit={handleRegister} className="auth-form">
                            <div className="form-group">
                                <label className="auth-register__label">Nombre Completo</label>
                                <input type="text" required className="auth-register__input" onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                            </div>

                            <div className="form-group">
                                <label className="auth-register__label">Correo Institucional</label>
                                <input type="email" placeholder="usuario@epn.edu.ec" required className="auth-register__input" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>

                            <div className="form-group">
                                <label className="auth-register__label">Placa de Vehículo</label>
                                <input type="text" placeholder="ABC-1234" value={formData.placa} maxLength="8" required className="auth-register__input" onChange={handlePlacaChange} />
                            </div>

                            <div className="form-group">
                                <label className="auth-register__label">Tipo de Usuario</label>
                                <select className="auth-register__input" onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                                    <option value="estudiante">Estudiante</option>
                                    <option value="docente">Docente</option>
                                </select>
                            </div>

                            {/* --- CONTRASEÑA --- */}
                            <div className="form-group">
                                <label className="auth-register__label">Contraseña</label>
                                <div className="auth-register__password">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required 
                                        className="auth-register__input" 
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-register__toggle">
                                        {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="auth-register__label">Repetir Contraseña</label>
                                <div className="auth-register__password">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required 
                                        className="auth-register__input" 
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                    />
                                    {/* 🔥 Ahora este también tiene el botón de toggle */}
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-register__toggle">
                                        {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="auth-register__submit">Registrarse</button>
                        </form>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Register;