import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { FileText, CheckSquare, HelpCircle, Video } from 'lucide-react';

const CourseViewer = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // We simulate fetching modules with their content due to complex multi-level joins
  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const { data: courseData } = await supabase
        .from('cursos')
        .select('*')
        .eq('id_curso', id)
        .single();
        
      setCourse(courseData);

      const { data: mods } = await supabase
        .from('modulos')
        .select('*, materiales(*), tareas(*), cuestionarios(*)')
        .eq('id_curso', id)
        .order('orden', { ascending: true });

      setModules(mods || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando contenido del curso...</div>;
  if (!course) return <div style={{ padding: '2rem' }}>Curso no encontrado.</div>;

  return (
    <div className="animate-fade-in">
      <div style={{
          backgroundColor: 'var(--accent-color)',
          color: 'white',
          padding: '3rem 2rem',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${course.imagen})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
      }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>{course.nombre}</h1>
        <p style={{ maxWidth: '800px', opacity: 0.9 }}>{course.descripcion}</p>
        <div style={{ marginTop: '2rem' }}>
          <Link to={`/meeting/${id}`} className="btn" style={{ backgroundColor: 'white', color: 'var(--accent-color)', fontWeight: 'bold' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={20} /> Unirse a Sesión en Vivo (WebRTC)</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {modules.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Este curso aún no tiene contenido publicado.</p>
          </div>
        ) : (
          modules.map((mod, index) => (
            <div key={mod.id_modulo} className="card" style={{ borderLeft: '4px solid var(--accent-color)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Módulo {index + 1}: {mod.titulo}</h2>
              
              {/* Materiales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Materiales</h4>
                {mod.materiales?.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sin materiales.</p>}
                {mod.materiales?.map(mat => (
                  <div key={mat.id_material} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
                    <FileText size={20} color="var(--accent-color)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{mat.titulo}</span>
                        {mat.contenido_texto && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{mat.contenido_texto}</span>}
                    </div>
                    <Link to={`/material/${mat.id_material}`} className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>
                        Ver Detalles Interactivos
                    </Link>
                  </div>
                ))}
              </div>

              {/* Tareas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tareas y Asignaciones</h4>
                {mod.tareas?.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sin tareas.</p>}
                {mod.tareas?.map(tarea => (
                  <div key={tarea.id_tarea} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '3px solid var(--warning-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <CheckSquare size={20} color="var(--warning-color)" />
                      <span style={{ fontWeight: 500 }}>{tarea.titulo}</span>
                    </div>
                    <Link to={`/task/${tarea.id_tarea}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Abrir Entrega</Link>
                  </div>
                ))}
              </div>

              {/* Cuestionarios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cuestionarios Evaluados</h4>
                {mod.cuestionarios?.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sin cuestionarios.</p>}
                {mod.cuestionarios?.map(q => (
                  <div key={q.id_cuestionario} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '3px solid var(--danger-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <HelpCircle size={20} color="var(--danger-color)" />
                      <span style={{ fontWeight: 500 }}>{q.titulo}</span>
                    </div>
                    <Link to={`/quiz/${q.id_cuestionario}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Realizar Test</Link>
                  </div>
                ))}
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseViewer;
