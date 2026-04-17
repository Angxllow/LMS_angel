import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Panel Supremo de Administración</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Control total del sistema LMS.</p>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['usuarios', 'cursos', 'categorias', 'logs_accesos', 'general'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('_', ' & ')}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        {activeTab === 'usuarios' && <TabUsuarios />}
        {activeTab === 'cursos' && <TabCursos />}
        {activeTab === 'categorias' && <TabCategorias />}
        {activeTab === 'logs_accesos' && <TabLogs />}
        {activeTab === 'general' && <TabGeneral />}
      </div>
    </div>
  );
};

// --- SUBCOMPONENTES DE TABS ---

const TabUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [insignias, setInsignias] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: u } = await supabase.from('usuarios').select('*, roles(*)');
    const { data: r } = await supabase.from('roles').select('*');
    const { data: i } = await supabase.from('insignias').select('*');
    setUsers(u || []);
    setRoles(r || []);
    setInsignias(i || []);
  };

  const updateRole = async (userId, roleId) => {
    await supabase.from('usuarios').update({ id_rol: roleId }).eq('id_usuario', userId);
    alert('Rol actualizado');
    fetchData();
  };

  const grantBadge = async (userId, badgeId) => {
    if(!badgeId) return;
    try {
      await supabase.from('usuarios_insignias').insert([{ id_usuario: userId, id_insignia: badgeId }]);
      alert('Insignia otorgada exitosamente al usuario');
    } catch(err) {
      console.error(err);
      alert('Error o el alumno ya tiene esta insignia');
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Usuarios y Roles</h3>
      <table className="standard-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem' }}>Nombre</th>
            <th style={{ padding: '0.75rem' }}>Correo</th>
            <th style={{ padding: '0.75rem' }}>Rol Actual</th>
            <th style={{ padding: '0.75rem' }}>Reasignar Rol</th>
            <th style={{ padding: '0.75rem' }}>Recompensar (Insignias)</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id_usuario} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}>{u.nombre}</td>
              <td style={{ padding: '0.75rem' }}>{u.correo}</td>
              <td style={{ padding: '0.75rem' }}>{u.roles?.nombre_rol}</td>
              <td style={{ padding: '0.75rem' }}>
                <select className="form-select" style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} value={u.id_rol} onChange={(e) => updateRole(u.id_usuario, e.target.value)}>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                </select>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <select className="form-select" style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} onChange={(e) => {
                   grantBadge(u.id_usuario, e.target.value);
                   e.target.value = '';
                }}>
                  <option value="">+ Dar Insignia...</option>
                  {insignias.map(badge => (
                    <option key={badge.id_insignia} value={badge.id_insignia}>{badge.nombre}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabCursos = () => {
  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    supabase.from('cursos').select('*, usuarios(nombre), estados_curso(nombre_estado)').then(({data}) => setCourses(data || []));
  }, []);

  const deleteCourse = async (id) => {
    if(!window.confirm('Eliminar en cascada este curso?')) return;
    await supabase.from('cursos').delete().eq('id_curso', id);
    setCourses(courses.filter(c => c.id_curso !== id));
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Infraestructura de Cursos</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem' }}>Curso</th>
            <th style={{ padding: '0.75rem' }}>Autor</th>
            <th style={{ padding: '0.75rem' }}>Estado</th>
            <th style={{ padding: '0.75rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.id_curso} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}>{c.nombre}</td>
              <td style={{ padding: '0.75rem' }}>{c.usuarios?.nombre}</td>
              <td style={{ padding: '0.75rem' }}>{c.estados_curso?.nombre_estado}</td>
              <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <Link to={`/manage-course/${c.id_curso}`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Editar / Administrar</Link>
                <button onClick={() => deleteCourse(c.id_curso)} className="btn btn-secondary" style={{color: 'red', padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabCategorias = () => {
  const [categorias, setCats] = useState([]);
  const [nombre, setNombre] = useState('');
  
  useEffect(() => { fetchCats(); }, []);
  const fetchCats = async () => { const {data} = await supabase.from('categorias').select('*'); setCats(data || []); };

  const submit = async (e) => {
    e.preventDefault();
    await supabase.from('categorias').insert([{nombre}]);
    setNombre('');
    fetchCats();
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Categorías y Metadatos</h3>
      <form onSubmit={submit} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input className="form-input" placeholder="Nueva categoría" value={nombre} onChange={e=>setNombre(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Crear Categoría</button>
      </form>
      <ul>{categorias.map(c => <li key={c.id_categoria} style={{marginBottom: '0.5rem'}}>{c.nombre}</li>)}</ul>
    </div>
  );
};

const TabLogs = () => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    supabase.from('historial_accesos').select('*, usuarios(nombre)').order('fecha', {ascending: false}).limit(50).then(({data}) => setLogs(data || []));
  }, []);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Monitor de Accesos Recientes</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem' }}>Usuario</th>
            <th style={{ padding: '0.75rem' }}>Dispositivo</th>
            <th style={{ padding: '0.75rem' }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id_acceso} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.75rem' }}>{l.usuarios?.nombre}</td>
              <td style={{ padding: '0.75rem', fontSize:'0.8rem' }}>{l.dispositivo || 'Web'}</td>
              <td style={{ padding: '0.75rem' }}>{new Date(l.fecha).toLocaleString()}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan="3" style={{padding: '1rem'}}>No hay registros (No implementado en el login Auth)</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const TabGeneral = () => {
  const [notif, setNotif] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  
  const sendGlobal = async (e) => {
    e.preventDefault();
    const {data: users} = await supabase.from('usuarios').select('id_usuario');
    const inserts = users.map(u => ({ id_usuario: u.id_usuario, mensaje: notif }));
    await supabase.from('notificaciones').insert(inserts);
    alert('Notificación enviada a todos');
    setNotif('');
  };

  const createBadge = async (e) => {
    e.preventDefault();
    await supabase.from('insignias').insert([{ nombre: badgeName, descripcion_logro: badgeDesc }]);
    alert('Insignia creada globalmente exitoso');
    setBadgeName(''); setBadgeDesc('');
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Avisos y Trofeos (Insignias)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <form onSubmit={sendGlobal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <label className="form-label">Notificación Global (Broadcast)</label>
          <textarea className="form-textarea" required value={notif} onChange={e=>setNotif(e.target.value)}></textarea>
          <button type="submit" className="btn btn-primary" style={{alignSelf: 'flex-start'}}>Enviar Notificación Masiva</button>
        </form>

        <form onSubmit={createBadge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <label className="form-label">Crear Nueva Insignia del Sistema</label>
          <input className="form-input" placeholder="Nombre (Ej. 'Rey de la Química')" required value={badgeName} onChange={e=>setBadgeName(e.target.value)} />
          <textarea className="form-textarea" rows="2" placeholder="Descripción" required value={badgeDesc} onChange={e=>setBadgeDesc(e.target.value)}></textarea>
          <button type="submit" className="btn btn-primary" style={{alignSelf: 'flex-start'}}>Crear Insignia</button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
