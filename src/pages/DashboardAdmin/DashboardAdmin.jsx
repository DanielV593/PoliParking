import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { 
    collection, deleteDoc, doc, updateDoc, addDoc, query, orderBy, writeBatch, onSnapshot 
} from 'firebase/firestore';
import Swal from 'sweetalert2';

// --- IMPORTAMOS LOS COMPONENTES ---
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
    const [moduloActivo, setModuloActivo] = useState('resumen');
    const [usuarios, setUsuarios] = useState([]);
    const [invitados, setInvitados] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const [modoMasivo, setModoMasivo] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [filtro, setFiltro] = useState({ texto: '', rol: 'todos', estado: 'activo' });
    const [filtroInvitados, setFiltroInvitados] = useState('');
    const [filtroHistorial, setFiltroHistorial] = useState({ texto: '', lugar: 'todos' });

    // ESTADOS PARA RESPONSIVE
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const CAPACIDAD = { "Edificio CEC": 100, "Facultad de Sistemas": 35, "Canchas Deportivas": 50 };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const unsubU = onSnapshot(collection(db, "usuarios"), (s) => setUsuarios(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubR = onSnapshot(collection(db, "reservas"), (s) => setReservas(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubM = onSnapshot(query(collection(db, "mensajes_contacto"), orderBy("fecha", "desc")), (s) => setMensajes(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubI = onSnapshot(collection(db, "ingresos_invitados"), (s) => setInvitados(s.docs.map(d => ({...d.data(), id: d.id}))));
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        setLoading(false);
        return () => { 
            unsubU(); unsubR(); unsubM(); unsubI(); 
            clearInterval(timer); 
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCambioFiltroEstado = async (e) => {
        const nuevoEstado = e.target.value;
        if (nuevoEstado === 'bloqueado') {
            const { value: password } = await Swal.fire({
                title: 'Acceso Restringido',
                text: 'Ingrese la contraseña de administrador:',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonColor: '#0a3d62',
            });
            if (password === 'admin1234') { setFiltro({ ...filtro, estado: nuevoEstado }); }
            else { 
                if (password !== undefined) Swal.fire('Error', 'Contraseña incorrecta', 'error');
                setFiltro({ ...filtro, estado: 'activo' }); 
            }
        } else { setFiltro({ ...filtro, estado: nuevoEstado }); }
    };

    const verPerfilUsuario = (u) => {
        const susReservas = reservas.filter(r => r.usuario === u.email);
        Swal.fire({
            title: `Perfil de ${u.nombre}`,
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Email:</strong> ${u.email}</p>
                    <p><strong>Placa:</strong> ${u.placa || 'N/A'}</p>
                    <p><strong>Rol:</strong> ${u.rol.toUpperCase()}</p>
                    <hr/>
                    <p><strong>Reservas actuales (${susReservas.length}):</strong></p>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${susReservas.length > 0 ? susReservas.map(r => `• ${r.fecha} - ${r.lugar} (#${r.espacio})<br/>`).join('') : 'Sin registros actuales'}
                    </div>
                </div>
            `,
            icon: 'info', confirmButtonColor: '#0a3d62'
        });
    };

    const handleLogout = async () => { 
        const result = await Swal.fire({ title: '¿Cerrar sesión?', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) { await signOut(auth); navigate('/'); }
    };

    const toggleSeleccion = (id) => {
        setSeleccionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const seleccionarTodo = (listaFiltrada) => {
        if (seleccionados.length === listaFiltrada.length) setSeleccionados([]);
        else setSeleccionados(listaFiltrada.map(u => u.id));
    };

    const ejecutarBorradoMasivo = async (coleccion) => {
        if (seleccionados.length === 0) return;
        const result = await Swal.fire({
            title: `¿Eliminar ${seleccionados.length} registros?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e30613'
        });
        if (result.isConfirmed) {
            try {
                const batch = writeBatch(db);
                seleccionados.forEach(id => { batch.delete(doc(db, coleccion, id)); });
                await batch.commit();
                Swal.fire('Eliminados', '', 'success');
                setSeleccionados([]);
            } catch (e) { Swal.fire('Error', 'Fallo masivo', 'error'); }
        }
    };

    const estanBloqueados = seleccionados.length > 0 && seleccionados.every(id => usuarios.find(user => user.id === id)?.estado === 'bloqueado');

    const ejecutarAccionMasivaUsuarios = async (tipo) => {
        if (seleccionados.length === 0) return;
        if (tipo === 'borrar') { await ejecutarBorradoMasivo('usuarios'); return; }
        const result = await Swal.fire({ title: `¿${estanBloqueados ? 'Activar' : 'Desactivar'} ${seleccionados.length} usuarios?`, icon: 'question', showCancelButton: true });
        if (result.isConfirmed) {
            try {
                const batch = writeBatch(db);
                seleccionados.forEach(id => {
                    const ref = doc(db, "usuarios", id);
                    batch.update(ref, { estado: estanBloqueados ? 'activo' : 'bloqueado' });
                });
                await batch.commit();
                Swal.fire('Éxito', 'Estado actualizado', 'success');
                setSeleccionados([]);
            } catch (e) { console.error(e); }
        }
    };

    const toggleBloqueo = async (u) => { 
        const estaBloqueado = (u.estado || 'activo') === 'bloqueado';
        const result = await Swal.fire({ title: `¿${estaBloqueado ? 'Activar':'Bloquear'} usuario?`, icon: 'question', showCancelButton: true });
        if (result.isConfirmed) {
            const nuevoEstado = estaBloqueado ? 'activo' : 'bloqueado';
            await updateDoc(doc(db, "usuarios", u.id), {estado: nuevoEstado}); 
        }
    };

    const eliminarRegistro = async (col, id) => { 
        const result = await Swal.fire({ title: '¿Borrar registro?', icon: 'warning', showCancelButton: true });
        if(result.isConfirmed){ await deleteDoc(doc(db, col, id)); Swal.fire('Borrado','','success'); } 
    };

    const getColorSemaforo = (ocupados, total) => {
        const porc = (ocupados / total) * 100;
        if (porc > 85) return '#e30613';
        if (porc > 50) return '#f39c12';
        return '#2ecc71';
    };

    const usuariosFiltrados = usuarios.filter(u => 
        (u.nombre.toLowerCase().includes(filtro.texto.toLowerCase()) || (u.placa || '').toLowerCase().includes(filtro.texto.toLowerCase())) &&
        (filtro.rol === 'todos' || u.rol === filtro.rol) && (u.estado || 'activo') === filtro.estado
    );

    const invitadosFiltrados = invitados.filter(i => 
        i.nombre.toLowerCase().includes(filtroInvitados.toLowerCase()) || (i.placa || '').toLowerCase().includes(filtroInvitados.toLowerCase())
    );

    const historialUnificado = [
        ...reservas.map(r => ({ ...r, tipo: 'reserva', identificador: r.usuario, detalle_lugar: r.lugar, detalle_espacio: `#${r.espacio}` })),
        ...invitados.map(i => ({ ...i, tipo: 'invitado', identificador: `${i.nombre} (${i.placa})`, detalle_lugar: 'Entrada Invitados', detalle_espacio: 'N/A' }))
    ];

    const historialFiltrado = historialUnificado.filter(h => {
        const texto = filtroHistorial.texto.toLowerCase();
        return (
            (h.identificador.toLowerCase().includes(texto)) || 
            (h.hora.includes(texto) || h.fecha.includes(texto))
        ) && (filtroHistorial.lugar === 'todos' || (h.detalle_lugar && h.detalle_lugar.includes(filtroHistorial.lugar)) || (filtroHistorial.lugar === 'todos' && h.tipo === 'invitado'));
    }).sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora}`);
        const dateB = new Date(`${b.fecha}T${b.hora}`);
        return dateB - dateA;
    });

    const exportarCSV = () => {
        let contenido = "Fecha,Hora,Usuario/Placa,Lugar,Puesto,Tipo\n";
        historialFiltrado.forEach(h => {
            contenido += `${h.fecha},${h.hora},${h.identificador},${h.detalle_lugar},${h.detalle_espacio},${h.tipo}\n`;
        });
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "reporte_parking.csv");
        link.click();
    };

    const handleArchivarVencidos = async () => {
        const result = await Swal.fire({title: '¿Archivar vencidos?', icon: 'question', showCancelButton: true});
        if(result.isConfirmed) {
            const hoy = new Date().toISOString().split('T')[0];
            reservas.forEach(async r => { 
                if(r.fecha < hoy) {
                    await addDoc(collection(db, "historial_reservas"), { ...r, estado_final: "archivado", fecha_archivado: new Date() });
                    await deleteDoc(doc(db,"reservas",r.id)); 
                }
            });
        }
    };

    // --- RENDERIZADO PRINCIPAL (Aquí llamamos a los componentes hijos) ---
    return (
        <div className="admin-bg">
            {isMobile && isMenuOpen && (
                <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex: 999}}></div>
            )}

            <AdminNavbar 
                isMobile={isMobile} 
                onToggleMenu={() => setIsMenuOpen(true)} 
                onLogout={handleLogout} 
            />

            <div className="main-content">
                <AdminSidebar 
                    isMobile={isMobile}
                    isMenuOpen={isMenuOpen}
                    onCloseMenu={() => setIsMenuOpen(false)}
                    moduloActivo={moduloActivo}
                    setModuloActivo={(mod) => { setModuloActivo(mod); if(isMobile) setIsMenuOpen(false); setModoMasivo(false); setSeleccionados([]); }}
                    currentTime={currentTime}
                />
                
                <main className="content-area" style={{ padding: isMobile ? '15px' : '30px' }}>
                    {moduloActivo === 'resumen' && (
                        <ModuleResumen 
                            reservas={reservas} 
                            capacidad={CAPACIDAD} 
                            getColorSemaforo={getColorSemaforo}
                            onArchivarVencidos={handleArchivarVencidos}
                        />
                    )}
                    
                    {moduloActivo === 'usuarios' && (
                        <ModuleUsuarios 
                            usuariosFiltrados={usuariosFiltrados}
                            filtro={filtro}
                            setFiltro={setFiltro}
                            handleCambioFiltroEstado={handleCambioFiltroEstado}
                            modoMasivo={modoMasivo}
                            setModoMasivo={(val) => { setModoMasivo(val); setSeleccionados([]); }}
                            seleccionados={seleccionados}
                            toggleSeleccion={toggleSeleccion}
                            seleccionarTodo={seleccionarTodo}
                            ejecutarAccionMasiva={ejecutarAccionMasivaUsuarios}
                            verPerfil={verPerfilUsuario}
                            toggleBloqueo={toggleBloqueo}
                            eliminarRegistro={eliminarRegistro}
                            estanBloqueados={estanBloqueados}
                        />
                    )}

                    {moduloActivo === 'invitados' && (
                        <ModuleInvitados 
                            invitados={invitadosFiltrados}
                            filtro={filtroInvitados}
                            setFiltro={setFiltroInvitados}
                            modoMasivo={modoMasivo}
                            setModoMasivo={(val) => { setModoMasivo(val); setSeleccionados([]); }}
                            seleccionados={seleccionados}
                            toggleSeleccion={toggleSeleccion}
                            seleccionarTodo={seleccionarTodo}
                            eliminarRegistro={eliminarRegistro}
                            ejecutarBorradoMasivo={ejecutarBorradoMasivo}
                        />
                    )}

                    {moduloActivo === 'mensajes' && (
                        <ModuleMensajes 
                            mensajes={mensajes} 
                            eliminarRegistro={eliminarRegistro} 
                        />
                    )}

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