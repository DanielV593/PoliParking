import React, { useState } from 'react';
import './footer.css';

const Footer = () => {
    // --- ESTADOS PARA LOS 4 MODALES ---
    const [showFaq, setShowFaq] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [showReport, setShowReport] = useState(false);
    
    // Estado para el acordeón de preguntas
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // --- DATOS FAQ ---
    const faqData = [
        { question: "¿Quiénes pueden usar PoliParking?", answer: "Exclusivo para la comunidad EPN: estudiantes, profesores y administrativos con credenciales activas." },
        { question: "¿Cómo reservo un espacio?", answer: "Regístrate con tu correo institucional, inicia sesión y selecciona fecha/hora en tu Dashboard." },
        { question: "¿Tiene costo?", answer: "El uso de la aplicación es gratuito. El uso físico del parqueadero está sujeto a las tasas vigentes de la institución." },
        { question: "¿Qué es el tiempo de tolerancia?", answer: "Es el tiempo máximo (15 min) que guardamos tu lugar. Si no llegas, el sistema libera el espacio automáticamente." },
        { question: "¿Cómo cancelo una reserva?", answer: "Desde el Dashboard, presiona el botón 'Cancelar'. Debes hacerlo al menos 30 minutos antes para evitar sanciones." }
    ];

    const toggleQuestion = (i) => {
        if (selectedQuestion === i) return setSelectedQuestion(null);
        setSelectedQuestion(i);
    };

    return (
        <>
            <footer className="footer">
                <div className="footer__container">
                    <div className="footer-row">
                        
                        {/* COLUMNA 1: NAVEGACIÓN */}
                        <div className="footer__col">
                            <h3 className="footer__title">Navegación</h3>
                            <ul className="footer__list">
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowFaq(true); }}>
                                        Preguntas Frecuentes
                                    </a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                                        Términos y Condiciones
                                    </a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowRules(true); }}>
                                        Reglamento de Uso
                                    </a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowReport(true); }}>
                                        Reportar Incidente
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* COLUMNA 2: HORARIOS */}
                        <div className="footer__col">
                            <h3 className="footer__title">Horarios de Atención</h3>
                            <ul className="footer__list">
                                <li><span className="label">Lunes - Viernes:</span> 06:30 - 20:00</li>
                                <li><span className="label">Sábados:</span> 07:00 - 13:00</li>
                                <li><span className="label">Dom y Feriados:</span> Solo autorizados</li>
                            </ul>
                        </div>
{/* COLUMNA 3: ACCIÓN DIRECTA */}
<div className="footer__col" style={{ justifyContent: 'center' }}>
    <h3 className="footer__title">Empieza Ahora</h3>
    <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
        ¿Listo para asegurar tu lugar?
    </p>
    
    <a href="/login" style={{ 
        display: 'block',
        textAlign: 'center',
        background: '#feca57', 
        color: '#0a3d62', 
        padding: '12px', 
        borderRadius: '5px', 
        textDecoration: 'none', 
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 4px 0 #d4a017',
        transition: 'transform 0.1s'
    }}>
        <i className="fa-solid fa-calendar-check" style={{ marginRight: '8px' }}></i>
        Reservar Estacionamiento
    </a>
    
    <p style={{ fontSize: '0.8rem', marginTop: '10px', textAlign: 'center', opacity: 0.7 }}>
        *Acceso exclusivo con correo EPN
    </p>
</div>
                    </div>
                </div>
                
                <div className="footer__bottom">
                    <p>© {new Date().getFullYear()} PoliParking - Escuela Politécnica Nacional. Todos los derechos reservados.</p>
                </div>
            </footer>

            {/* =======================================================
                AREA DE MODALES (VENTANAS EMERGENTES)
               ======================================================= */}

            {/* 1. FAQ */}
            {showFaq && (
                <div className="modal-overlay" onClick={() => setShowFaq(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{color: '#0a3d62', margin: 0}}>Preguntas Frecuentes</h2>
                            <button className="close-btn" onClick={() => setShowFaq(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {faqData.map((item, i) => (
                                <div className="faq-item-modal" key={i} onClick={() => toggleQuestion(i)}>
                                    <div className="faq-question-modal">
                                        <span>{item.question}</span>
                                        <span style={{fontWeight:'bold', fontSize:'1.2rem'}}>{selectedQuestion === i ? '-' : '+'}</span>
                                    </div>
                                    <div className={selectedQuestion === i ? 'faq-answer-modal show' : 'faq-answer-modal'}>
                                        <p style={{margin: '10px 0 0', color: '#555'}}>{item.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. TÉRMINOS Y CONDICIONES (PROFESIONAL) */}
            {showTerms && (
                <div className="modal-overlay" onClick={() => setShowTerms(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{color: '#0a3d62', margin: 0}}>Términos y Condiciones</h2>
                            <button className="close-btn" onClick={() => setShowTerms(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{lineHeight: '1.6', color: '#444', textAlign: 'justify'}}>
                            <p style={{marginBottom:'15px', fontStyle:'italic'}}>Última actualización: Febrero 2025</p>
                            
                            <h4 style={{color:'#0a3d62', marginBottom:'5px'}}>1. Aceptación del Servicio</h4>
                            <p style={{marginBottom:'15px'}}>
                                Al acceder y utilizar la plataforma <strong>PoliParking</strong>, el usuario acepta cumplir con los presentes términos y con la normativa interna de la Escuela Politécnica Nacional (EPN). El incumplimiento podrá resultar en la suspensión temporal o definitiva de la cuenta.
                            </p>

                            <h4 style={{color:'#0a3d62', marginBottom:'5px'}}>2. Uso de la Cuenta</h4>
                            <p style={{marginBottom:'15px'}}>
                                La cuenta es <strong>personal e intransferible</strong>. El usuario es responsable de mantener la confidencialidad de sus credenciales. Está prohibido realizar reservas para vehículos de terceros ajenos a la institución.
                            </p>

                            <h4 style={{color:'#0a3d62', marginBottom:'5px'}}>3. Limitación de Responsabilidad</h4>
                            <p style={{marginBottom:'15px'}}>
                                PoliParking actúa únicamente como un sistema de gestión de espacios. La EPN <strong>no asume responsabilidad civil ni penal</strong> por robo total o parcial de vehículos, ni por daños ocasionados por terceros o desastres naturales dentro de las instalaciones.
                            </p>

                            <h4 style={{color:'#0a3d62', marginBottom:'5px'}}>4. Uso de Datos Personales</h4>
                            <p style={{marginBottom:'15px'}}>
                                Los datos recopilados (placa, nombre, correo) serán tratados estrictamente para fines de seguridad y control de acceso vehicular, conforme a la Ley Orgánica de Protección de Datos Personales.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. REGLAMENTO DE USO (ESTILO EPN) */}
            {showRules && (
                <div className="modal-overlay" onClick={() => setShowRules(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{color: '#0a3d62', margin: 0}}>Reglamento Interno</h2>
                            <button className="close-btn" onClick={() => setShowRules(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{lineHeight: '1.6', color: '#444'}}>
                            <div style={{background:'#fdf2f2', borderLeft:'4px solid #e30613', padding:'10px', marginBottom:'20px'}}>
                                <strong>IMPORTANTE:</strong> El ingreso al campus implica la aceptación de estas normas. La vigilancia es permanente.
                            </div>

                            <ul style={{paddingLeft: '20px', listStyleType: 'circle'}}>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Velocidad Máxima:</strong> La velocidad límite dentro del campus es de <strong>10 km/h</strong>. El exceso de velocidad será sancionado.
                                </li>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Estacionamiento en Reversa:</strong> Por normas de seguridad y evacuación rápida, es <u>obligatorio</u> estacionar el vehículo en posición de salida (aculatar).
                                </li>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Espacios Reservados:</strong> Está prohibido ocupar espacios destinados a personas con discapacidad, autoridades o vehículos de emergencia sin la debida autorización.
                                </li>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Pernoctación:</strong> Prohibido dejar vehículos dentro del campus fuera del horario de atención (22:00) sin autorización escrita de la Dirección Administrativa.
                                </li>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Sanciones (Uso de Cepo):</strong> Los vehículos mal estacionados o que ocupen dos plazas serán inmovilizados con cepo. La multa deberá ser cancelada en Tesorería.
                                </li>
                                <li style={{marginBottom: '15px'}}>
                                    <strong>Prohibiciones:</strong> Queda terminantemente prohibido el consumo de alcohol o sustancias estupefacientes dentro de los vehículos en el estacionamiento.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. REPORTAR INCIDENTE */}
            {showReport && (
                <div className="modal-overlay" onClick={() => setShowReport(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{color: '#e30613', margin: 0}}>Reportar Incidente</h2>
                            <button className="close-btn" onClick={() => setShowReport(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{lineHeight: '1.6', color: '#444', textAlign:'center'}}>
                            <i className="fas fa-exclamation-triangle" style={{fontSize: '3rem', color: '#e30613', marginBottom: '1rem'}}></i>
                            <p style={{fontSize: '1.1rem'}}>
                                Para reportar choques, robos, vehículos mal estacionados o actividades sospechosas:
                            </p>
                            
                            <div style={{background: '#f9f9f9', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '1px solid #eee'}}>
                                <h4 style={{margin:'0 0 10px 0', color:'#0a3d62'}}>Central de Seguridad EPN (24h)</h4>
                                <p style={{fontSize: '1.4rem', fontWeight: 'bold', margin: '5px 0', color:'#333'}}>
                                </p>
                                <p style={{fontSize: '1.2rem', fontWeight: 'bold', margin: '5px 0', color:'#333'}}>
                                    <i className="fas fa-mobile-alt"></i> (593) 96 321 8871
                                    <i className="fas fa-mobile-alt"></i> (593) 96 321 8871
                                </p>
                            </div>

                            <p style={{fontSize: '0.9rem', color:'#777'}}>
                                *Recuerda tener a la mano la placa del vehículo involucrado y tu ubicación exacta (Ej: Edificio de Sistemas, Zona B).
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default Footer;