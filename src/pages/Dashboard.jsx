import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc 
} from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reservas, setReservas] = useState([]);
  
  // Estado para el formulario (Crear/Editar)
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [lugar, setLugar] = useState('A1');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  // 1. VERIFICAR USUARIO Y CARGAR DATOS (READ)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        cargarReservas(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // FUNCIÓN: LEER RESERVAS (READ)
  const cargarReservas = async (uid) => {
    try {
        const q = query(collection(db, "reservas"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReservas(data);
    } catch (error) {
        console.error("Error al cargar reservas:", error);
    }
  };

  // FUNCIÓN: CREAR O ACTUALIZAR (CREATE / UPDATE)
  const manejarReserva = async (e) => {
    e.preventDefault();
    if(!fecha || !hora) return alert("Completa todos los campos");

    try {
        if (modoEdicion) {
            // LÓGICA DE ACTUALIZAR (UPDATE)
            const reservaRef = doc(db, "reservas", idEdicion);
            await updateDoc(reservaRef, {
                fecha: fecha,
                hora: hora,
                lugar: lugar
            });
            alert("Reserva actualizada correctamente");
            setModoEdicion(false);
            setIdEdicion(null);
        } else {
            // LÓGICA DE CREAR (CREATE)
            await addDoc(collection(db, "reservas"), {
                uid: user.uid,
                email: user.email,
                fecha: fecha,
                hora: hora,
                lugar: lugar,
                creado: new Date()
            });
            alert("Reserva creada con éxito");
        }

        // Limpiar formulario y recargar lista
        setFecha('');
        setHora('');
        cargarReservas(user.uid);

    } catch (error) {
        console.error("Error al guardar:", error);
    }
  };

  // FUNCIÓN: PREPARAR EDICIÓN
  const activarEdicion = (reserva) => {
      setModoEdicion(true);
      setIdEdicion(reserva.id);
      setFecha(reserva.fecha);
      setHora(reserva.hora);
      setLugar(reserva.lugar);
  };

  // FUNCIÓN: ELIMINAR (DELETE)
  const eliminarReserva = async (id) => {
      if(!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;
      
      try {
          await deleteDoc(doc(db, "reservas", id));
          alert("Reserva cancelada.");
          cargarReservas(user.uid); // Recargar lista
      } catch (error) {
          console.error("Error al eliminar:", error);
      }
  };

  // FUNCIÓN: CERRAR SESIÓN
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', background: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* NAVBAR */}
      <nav style={navStyle}>
        <h2>PoliParking <span style={{color: '#feca57'}}>Dashboard</span></h2>
        <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
            <span style={{fontSize:'0.9rem'}}>{user?.email}</span>
            <button onClick={handleLogout} style={btnLogoutStyle}>Salir</button>
        </div>
      </nav>

      <div className="container" style={{ marginTop: '3rem', maxWidth: '1000px' }}>
        
        {/* SECCIÓN 1: FORMULARIO (CREATE / UPDATE) */}
        <div style={cardStyle}>
            <h3 style={{color: '#0a3d62', marginBottom:'1.5rem'}}>
                {modoEdicion ? '✏️ Editar Reserva' : '🚗 Nueva Reserva'}
            </h3>
            
            <form onSubmit={manejarReserva} style={formStyle}>
                <div style={inputGroupStyle}>
                    <label>Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} required/>
                </div>
                <div style={inputGroupStyle}>
                    <label>Hora</label>
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle} required/>
                </div>
                <div style={inputGroupStyle}>
                    <label>Lugar</label>
                    <select value={lugar} onChange={e => setLugar(e.target.value)} style={inputStyle}>
                        <option value="A1">Edificio A - Planta Baja</option>
                        <option value="B2">Facultad de Sistemas</option>
                        <option value="C3">Canchas Deportivas</option>
                    </select>
                </div>
                <button type="submit" style={modoEdicion ? btnUpdateStyle : btnCreateStyle}>
                    {modoEdicion ? 'Guardar Cambios' : 'Reservar Ahora'}
                </button>
                
                {modoEdicion && (
                    <button onClick={() => { setModoEdicion(false); setFecha(''); setHora(''); }} style={btnCancelStyle}>
                        Cancelar
                    </button>
                )}
            </form>
        </div>

        {/* SECCIÓN 2: LISTA DE RESERVAS (READ / DELETE) */}
        <h3 style={{marginTop: '3rem', color: '#0a3d62'}}>📅 Tus Reservas Activas</h3>
        
        <div style={gridStyle}>
            {reservas.length === 0 ? (
                <p>No tienes reservas activas.</p>
            ) : (
                reservas.map(reserva => (
                    <div key={reserva.id} style={reservaCardStyle}>
                        <div style={{flex: 1}}>
                            <h4 style={{margin: 0, color:'#0a3d62'}}>{reserva.lugar}</h4>
                            <p style={{margin: '5px 0'}}>📅 {reserva.fecha} | ⏰ {reserva.hora}</p>
                        </div>
                        <div style={{display:'flex', gap:'0.5rem'}}>
                            <button onClick={() => activarEdicion(reserva)} style={btnEditStyle}>Editar</button>
                            <button onClick={() => eliminarReserva(reserva.id)} style={btnDeleteStyle}>Cancelar</button>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
};

// --- ESTILOS EN JS PARA NO COMPLICAR EL CSS ---
const navStyle = { background: '#0a3d62', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' };
const btnLogoutStyle = { background: 'transparent', border: '1px solid white', color: 'white', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const formStyle = { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' };
const inputStyle = { padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' };
const btnCreateStyle = { background: '#0a3d62', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '46px' };
const btnUpdateStyle = { background: '#feca57', color: '#0a3d62', border: 'none', padding: '0.8rem 2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '46px' };
const btnCancelStyle = { background: '#ccc', color: 'black', border: 'none', padding: '0.8rem 1rem', borderRadius: '6px', cursor: 'pointer', height: '46px' };
const gridStyle = { display: 'grid', gap: '1rem', marginTop: '1rem' };
const reservaCardStyle = { background: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #0a3d62', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const btnEditStyle = { background: '#feca57', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#0a3d62' };
const btnDeleteStyle = { background: '#e30613', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: 'white' };

export default Dashboard;