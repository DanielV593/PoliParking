import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "../../firebase/config.js"; 
import { signOut } from 'firebase/auth';
import { 
    collection, deleteDoc, doc, updateDoc, addDoc, query, orderBy, writeBatch, onSnapshot 
} from 'firebase/firestore';
import Swal from 'sweetalert2';

// COMPONENTES
import AdminNavbar from './components/AdminNavbar';
import AdminSidebar from './components/AdminSidebar';
import ModuleResumen from './components/ModuleResumen';
import ModuleUsuarios from './components/ModuleUsuarios';
import ModuleInvitados from './components/ModuleInvitados';
import ModuleMensajes from './components/ModuleMensajes';
import ModuleHistorial from './components/ModuleHistorial';

import './DashboardAdmin.css';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DE DATOS ---
    const [moduloActivo, setModuloActivo] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]); // Reservas Activas
    const [historialArchivado, setHistorialArchivado] = useState([]); // 🔥 NUEVO: Reservas Archivadas
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- FILTROS ---
    const [modoMasivo, setModoMasivo] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [filtro, setFiltro] = useState({ texto: '', rol: 'todos', estado: 'activo' });
    const [filtroInvitados, setFiltroInvitados] = useState('');
    const [filtroHistorial, setFiltroHistorial] = useState({ texto: '', lugar: 'todos' });

    // --- RESPONSIVE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const CAPACIDAD = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    // --- EFECTOS ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        // 1. Usuarios
        const unsubU = onSnapshot(collection(db, "usuarios"), (s) => setUsuarios(s.docs.map(d => ({...d.data(), id: d.id}))));
        // 2. Reservas Activas
        const unsubR = onSnapshot(collection(db, "reservas"), (s) => setReservas(s.docs.map(d => ({...d.data(), id: d.id}))));
        // 3. Historial Archivado (Lo que ya pasó) 🔥
        const unsubH = onSnapshot(collection(db, "historial_reservas"), (s) => setHistorialArchivado(s.docs.map(d => ({...d.data(), id: d.id}))));
        // 4. Mensajes
        const unsubM = onSnapshot(query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc")), (s) => setMensajes(s.docs.map(d => ({...d.data(), id: d.id}))));
        // 5. Invitados (Si usas esta colección)
        // const unsubI = onSnapshot(collection(db, "ingresos_invitados"), (s) => setInvitados(s.docs.map(d => ({...d.data(), id: d.id}))));
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        setLoading(false);
        
        return () => { 
            unsubU(); unsubR(); unsubH(); unsubM(); 
            // unsubI(); 
            clearInterval(timer); 
            window.removeEventListener('resize', handleResize); 
        };
    }, []);

    // --- LÓGICA DE NEGOCIO ---
    const handleCambioFiltroEstado = async (e) => {
        const nuevoEstado = e.target.value;
        if (nuevoEstado === 'bloqueado') {
            const { value: password } = await Swal.fire({
                title: 'Acceso Restringido', text: 'Contraseña:', input: 'password', showCancelButton: true, confirmButtonColor: '#0a3d62'
            });
            if (password === 'admin1234') setFiltro({ ...filtro, estado: nuevoEstado });
            else { if(password) Swal.fire('Error', 'Incorrecta', 'error'); setFiltro({ ...filtro, estado: 'activo' }); }
        } else { setFiltro({ ...filtro, estado: nuevoEstado }); }
    };

    const handleLogout = async () => { 
        if((await Swal.fire({ title: '¿Cerrar sesión?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e30613' })).isConfirmed) { 
            await signOut(auth); navigate('/'); 
        }
    };

    const toggleSeleccion = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const seleccionarTodo = (lista) => setSeleccionados(seleccionados.length === lista.length ? [] : lista.map(u => u.id));

    const ejecutarBorradoMasivo = async (coleccion) => {
        if(!seleccionados.length) return;
        if((await Swal.fire({title:`¿Borrar ${seleccionados.length}?`, icon:'warning', showCancelButton:true})).isConfirmed){
            const batch = writeBatch(db);
            seleccionados.forEach(id => batch.delete(doc(db, coleccion, id)));
            await batch.commit();
            Swal.fire('Listo', '', 'success'); setSeleccionados([]);
        }
    };

    const toggleBloqueo = async (u) => {
        const nuevo = (u.estado || 'activo') === 'bloqueado' ? 'activo' : 'bloqueado';
        if((await Swal.fire({title:`¿${nuevo === 'bloqueado'?'Bloquear':'Activar'}?`, showCancelButton:true})).isConfirmed) {
            await updateDoc(doc(db, "usuarios", u.id), {estado: nuevo});
        }
    };

    const eliminarRegistro = async (col, id) => {
        if((await Swal.fire({title:'¿Borrar?', icon:'warning', showCancelButton:true, confirmButtonColor:'#e30613'})).isConfirmed) {
            await deleteDoc(doc(db, col, id)); Swal.fire('Borrado','','success');
        }
    };

    const getColorSemaforo = (oc, tot) => (oc/tot > 0.85) ? '#e30613' : (oc/tot > 0.5) ? '#f39c12' : '#2ecc71';

    const usuariosFiltrados = usuarios.filter(u => 
        (u.nombre.toLowerCase().includes(filtro.texto.toLowerCase()) || (u.placa||'').toLowerCase().includes(filtro.texto.toLowerCase())) &&
        (filtro.rol === 'todos' || u.rol === filtro.rol) && (u.estado||'activo') === filtro.estado
    );
    const invitadosFiltrados = invitados.filter(i => i.nombre.toLowerCase().includes(filtroInvitados.toLowerCase()));

    // 🔥 LÓGICA DE HISTORIAL UNIFICADO (ACTIVOS + ARCHIVADOS) 🔥
    const historialUnificado = [
        ...reservas.map(r => ({ 
            ...r, tipo: 'Activa', identificador: r.usuario, detalle_lugar: r.lugar, detalle_espacio: `#${r.espacio}` 
        })),
        ...historialArchivado.map(h => ({ 
            ...h, tipo: 'Finalizada', identificador: h.usuario || h.nombre, detalle_lugar: h.lugar, detalle_espacio: `#${h.espacio}` 
        })),
        ...invitados.map(i => ({ 
            ...i, tipo: 'Invitado', identificador: `${i.nombre} (${i.placa})`, detalle_lugar: 'Entrada Invitados', detalle_espacio: 'N/A' 
        }))
    ];

    const historialFiltrado = historialUnificado.filter(h => {
        const texto = filtroHistorial.texto.toLowerCase();
        const coincideTexto = (h.identificador && h.identificador.toLowerCase().includes(texto)) || 
                              (h.hora && h.hora.includes(texto)) || 
                              (h.fecha && h.fecha.includes(texto));
        
        const coincideLugar = filtroHistorial.lugar === 'todos' || (h.detalle_lugar && h.detalle_lugar === filtroHistorial.lugar);

        return coincideTexto && coincideLugar;
    }).sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`));

    const exportarCSV = () => {
        let contenido = "Fecha,Hora,Usuario/Placa,Lugar,Puesto,Tipo\n";
        historialFiltrado.forEach(h => { contenido += `${h.fecha},${h.hora},${h.identificador},${h.detalle_lugar},${h.detalle_espacio},${h.tipo}\n`; });
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = "reporte_parking.csv"; link.click();
    };

    const handleArchivarVencidos = async () => {
        if((await Swal.fire({title: '¿Archivar vencidos?', text: "Se moverán al historial.", icon: 'question', showCancelButton: true})).isConfirmed) {
            const hoy = new Date().toISOString().split('T')[0];
            let contador = 0;
            const batch = writeBatch(db);

            reservas.forEach(r => { 
                if(r.fecha < hoy) {
                    const newRef = doc(collection(db, "historial_reservas"));
                    batch.set(newRef, { ...r, estado_final: "archivado", fecha_archivado: new Date() });
                    batch.delete(doc(db,"reservas",r.id)); 
                    contador++;
                }
            });

            if (contador > 0) {
                await batch.commit();
                Swal.fire('Éxito', `${contador} reservas archivadas.`, 'success');
            } else {
                Swal.fire('Info', 'No hay reservas vencidas para archivar.', 'info');
            }
        }
    };

    const estanBloqueados = seleccionados.length > 0 && seleccionados.every(id => usuarios.find(user => user.id === id)?.estado === 'bloqueado');
    const ejecutarAccionMasivaUsuarios = async (tipo) => {
        if (seleccionados.length === 0) return;
        if (tipo === 'borrar') { await ejecutarBorradoMasivo('usuarios'); return; }
        if ((await Swal.fire({ title: `¿${estanBloqueados ? 'Activar' : 'Bloquear'} ${seleccionados.length} usuarios?`, icon: 'question', showCancelButton: true })).isConfirmed) {
            const batch = writeBatch(db);
            seleccionados.forEach(id => { const ref = doc(db, "usuarios", id); batch.update(ref, { estado: estanBloqueados ? 'activo' : 'bloqueado' }); });
            await batch.commit(); Swal.fire('Actualizado', '', 'success'); setSeleccionados([]);
        }
    };
    const verPerfilUsuario = (u) => {
        const susReservas = reservas.filter(r => r.usuario === u.email);
        Swal.fire({ title: `Perfil de ${u.nombre}`, html: `<div><p>Email: ${u.email}</p><p>Placa: ${u.placa || 'N/A'}</p><p>Rol: ${u.rol}</p><hr/><p>Reservas: ${susReservas.length}</p></div>`, icon: 'info' });
    };

    return (
        <div className="admin-bg">
            {isMobile && isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:999}}></div>}

            <AdminNavbar isMobile={isMobile} onToggleMenu={() => setIsMenuOpen(true)} onLogout={handleLogout} />

            <div className="main-content">
                <div className={`admin-sidebar ${isMobile && isMenuOpen ? 'open' : ''}`} style={isMobile && !isMenuOpen ? {position:'absolute', left:'-100%'} : {}}>
                    <AdminSidebar 
                        moduloActivo={moduloActivo}
                        setModuloActivo={(m) => { setModuloActivo(m); setIsMenuOpen(false); }}
                        currentTime={currentTime}
                        onCloseMenu={() => setIsMenuOpen(false)}
                        isMobile={isMobile}
                    />
                </div>
                
                <main className="content-area">
                    {moduloActivo === 'resumen' && (
    <ModuleResumen 
        reservas={reservas.map(r => {
            const usuarioAsociado = usuarios.find(u => u.email === r.usuario);
            return { ...r, rol: usuarioAsociado ? usuarioAsociado.rol : 'invitado' };
        })} 
        capacidad={CAPACIDAD} 
        getColorSemaforo={getColorSemaforo} 
        onArchivarVencidos={handleArchivarVencidos}
    />
)}
                    
                    {moduloActivo === 'usuarios' && (
                        <ModuleUsuarios 
                            usuariosFiltrados={usuariosFiltrados} filtro={filtro} setFiltro={setFiltro}
                            handleCambioFiltroEstado={handleCambioFiltroEstado} modoMasivo={modoMasivo} setModoMasivo={setModoMasivo}
                            seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} seleccionarTodo={() => seleccionarTodo(usuariosFiltrados)}
                            ejecutarAccionMasiva={ejecutarAccionMasivaUsuarios} verPerfil={verPerfilUsuario} toggleBloqueo={toggleBloqueo} eliminarRegistro={(id) => eliminarRegistro('usuarios', id)}
                            estanBloqueados={estanBloqueados}
                        />
                    )}

                    {moduloActivo === 'invitados' && (
                        <ModuleInvitados 
                            invitados={invitadosFiltrados} filtro={filtroInvitados} setFiltro={setFiltroInvitados}
                            modoMasivo={modoMasivo} setModoMasivo={(val) => { setModoMasivo(val); setSeleccionados([]); }}
                            seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} seleccionarTodo={() => seleccionarTodo(invitadosFiltrados)}
                            eliminarRegistro={(id) => eliminarRegistro('ingresos_invitados', id)} ejecutarBorradoMasivo={() => ejecutarBorradoMasivo('ingresos_invitados')}
                        />
                    )}

                    {moduloActivo === 'mensajes' && <ModuleMensajes mensajes={mensajes} eliminarRegistro={(id) => eliminarRegistro('mensajes_contacto', id)} />}
                    
                    {moduloActivo === 'historial' && (
                        <ModuleHistorial 
                            historialFiltrado={historialFiltrado} 
                            filtro={filtroHistorial} 
                            setFiltro={setFiltroHistorial} 
                            exportarCSV={exportarCSV} 
                            capacidad={CAPACIDAD} 
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardAdmin;