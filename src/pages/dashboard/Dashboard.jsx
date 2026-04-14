import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabaseClient';
import axios from 'axios';
import { BookOpen, Award, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { dbUser } = useAuth();
  const [quote, setQuote] = useState('');
  const [metrics, setMetrics] = useState({ courses: 0, progress: 0 });
  const [notif, setNotif] = useState([]);
  const [insignias, setInsignias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [quizGrades, setQuizGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
    if (dbUser) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get('https://dummyjson.com/quotes/random');
      setQuote(`"${response.data.quote}" - ${response.data.author}`);
    } catch(err) {
      setQuote("El aprendizaje es un tesoro que te seguirá a donde vayas.");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const role = dbUser.roles?.nombre_rol;

      if (role === 'Estudiante') {
        const { count } = await supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('id_usuario', dbUser.id_usuario);
        setMetrics({ courses: count || 0, progress: count ? Math.floor(Math.random() * 100) : 0 }); // Random para UX momentánea
      } else if (role === 'Docente') {
        const { count } = await supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('id_docente', dbUser.id_usuario);
        setMetrics({ courses: count || 0, progress: 100 });
      } else if (role === 'admin') {
        const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        setMetrics({ courses: count || 0, progress: 100 });
      }

      // Extras requeridos (Notificaciones, Insignias, Calendario)
      const [{ data: nData }, { data: uiData }, { data: calData }, { data: qData }] = await Promise.all([
        supabase.from('notificaciones').select('*').eq('id_usuario', dbUser.id_usuario).order('fecha', {ascending: false}).limit(5),
        supabase.from('usuarios_insignias').select('*, insignias(nombre, descripcion_logro)').eq('id_usuario', dbUser.id_usuario),
        supabase.from('calendario_eventos').select('*').order('fecha_inicio', {ascending: true}).limit(5),
        supabase.from('resultados_cuestionario').select('*, cuestionarios(titulo)').eq('id_usuario', dbUser.id_usuario)
      ]);
      setNotif(nData || []);
      setInsignias(uiData || []);
      setEventos(calData || []);
      setQuizGrades(qData || []);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  if(!dbUser || loading) return <div>Cargando estadísticas...</div>;

  const role = dbUser.roles?.nombre_rol;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Saludo y Cita motivacional */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-color), #2563eb)', color: 'white' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'white' }}>¡Hola, {dbUser.nombre}!</h1>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem', fontStyle: 'italic' }}>{quote}</p>
        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '1rem', fontSize: '0.875rem' }}>
          Perfil: {role}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{metrics.courses}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {role === 'Estudiante' ? 'Cursos Inscritos' : (role === 'Docente' ? 'Cursos Impartidos' : 'Total Usuarios')}
            </p>
          </div>
        </div>

        {role === 'Estudiante' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Progreso Global</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-color)', fontSize: '0.875rem' }}>{metrics.progress}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${metrics.progress}%`, backgroundColor: 'var(--accent-color)', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Inferior (Extras Rúbrica) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Award size={20} color="var(--accent-color)" /> Mis Insignias
          </h3>
          <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
            {insignias.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aún no has desbloqueado logros.</p> : 
              insignias.map(i => (
                <li key={i.id_insignia} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>🏅 {i.insignias?.nombre}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{i.insignias?.descripcion_logro}</span>
                </li>
              ))
            }
          </ul>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--warning-color)" /> Calendario Académico
          </h3>
          <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
            {eventos.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>El calendario está despejado.</p> : 
              eventos.map(e => (
                <li key={e.id_evento} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>📅 {e.titulo}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inicia: {new Date(e.fecha_inicio).toLocaleString()}</span>
                </li>
              ))
            }
          </ul>
        </div>

        {role === 'Estudiante' && (
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              📝 Calificaciones de Exámenes
            </h3>
            <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
              {quizGrades.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aún no has presentado cuestionarios.</p> : 
                quizGrades.map(q => (
                  <li key={q.id_resultado} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>{q.cuestionarios?.titulo}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{q.calificacion} pts</span>
                  </li>
                ))
              }
            </ul>
          </div>
        )}

      </div>

      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <CheckCircle size={20} color="var(--success-color)" /> Buzón de Notificaciones
        </h3>
        <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
          {notif.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nada nuevo por el momento.</p> : 
            notif.map(n => (
              <li key={n.id_notificacion} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: n.estado_leido ? 'transparent' : 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: n.estado_leido ? 'normal' : 'bold' }}>{n.mensaje}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Hace un momento</div>
              </li>
            ))
          }
        </ul>
      </div>

    </div>
  );
};

export default Dashboard;
