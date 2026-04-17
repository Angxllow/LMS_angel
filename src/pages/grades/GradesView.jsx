import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const GradesView = () => {
  const { dbUser } = useAuth();
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser]);

  const fetchGrades = async () => {
    if(!dbUser) return;
    setLoading(true);
    try {
      // 1. Tareas grades
      const { data: tareasData } = await supabase
        .from('calificaciones')
        .select(`
          id_calificacion, calificacion_valor,
          tareas ( titulo, modulos ( cursos ( nombre ) ) )
        `)
        .eq('id_usuario', dbUser.id_usuario);
        
      // 2. Quizzes grades
      const { data: quizData } = await supabase
        .from('resultados_cuestionario')
        .select(`
          id_resultado, calificacion,
          cuestionarios ( titulo, modulos ( cursos ( nombre ) ) )
        `)
        .eq('id_usuario', dbUser.id_usuario);
        
      const parsedTareas = (tareasData || []).map(t => ({
        id: t.id_calificacion,
        tipo: 'Tarea',
        titulo: t.tareas?.titulo || 'Desconocido',
        curso: t.tareas?.modulos?.cursos?.nombre || 'General',
        valor: t.calificacion_valor
      }));

      const parsedQuizzes = (quizData || []).map(q => ({
        id: q.id_resultado,
        tipo: 'Cuestionario',
        titulo: q.cuestionarios?.titulo || 'Desconocido',
        curso: q.cuestionarios?.modulos?.cursos?.nombre || 'General',
        valor: q.calificacion
      }));

      const merged = [...parsedTareas, ...parsedQuizzes].sort((a,b) => b.valor - a.valor);
      
      setCalificaciones(merged);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getAverage = () => {
    if(calificaciones.length === 0) return 0;
    const sum = calificaciones.reduce((acc, curr) => acc + curr.valor, 0);
    return (sum / calificaciones.length).toFixed(1);
  };

  if(loading) return <div style={{ padding: '2rem' }}>Cargando libreta de calificaciones...</div>;

  return (
    <div className="animate-fade-in card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Libreta de Calificaciones</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Historial de tus evaluaciones (Tareas y Quizzes).</p>
        </div>
        <div style={{ padding: '1rem 2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Promedio General</p>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{getAverage()}</span>
        </div>
      </div>

      {calificaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Aún no posees calificaciones registradas en el sistema.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Curso</th>
                <th style={{ padding: '1rem' }}>Actividad Evaluada</th>
                <th style={{ padding: '1rem' }}>Tipo</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {calificaciones.map((cal, i) => (
                <tr key={`${cal.id}-${i}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{cal.curso}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{cal.titulo}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                      {cal.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: cal.valor >= 60 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {cal.valor} / 100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GradesView;
