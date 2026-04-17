import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { dbUser } = useAuth();

  useEffect(() => {
    fetchMyCourses();
  }, [dbUser]);

  const fetchMyCourses = async () => {
    if (!dbUser) return;
    setLoading(true);
    
    try {
      if (dbUser.roles?.nombre_rol === 'Estudiante') {
        const { data, error } = await supabase
          .from('inscripciones')
          .select('id_curso, cursos(*, usuarios(nombre))')
          .eq('id_usuario', dbUser.id_usuario);
        
        if (!error && data) {
          setCourses(data.map(d => d.cursos));
        }
      } else if (dbUser.roles?.nombre_rol === 'Docente') {
        const { data, error } = await supabase
          .from('cursos')
          .select('*, usuarios(nombre)')
          .eq('id_docente', dbUser.id_usuario);
          
        if (!error && data) {
          setCourses(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Mis Cursos</h1>
      
      {loading ? (
        <p>Cargando tus cursos...</p>
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No estás inscrito en ningún curso todavía.</p>
          <Link to="/catalog" className="btn btn-primary">Ir al Catálogo</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {courses.map(course => (
            <div key={course.id_curso} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                height: '140px', 
                backgroundColor: 'var(--border-color)', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                backgroundImage: `url(${course.imagen || 'https://via.placeholder.com/400x200?text=LMS'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
              <h3 style={{ marginBottom: '0.5rem' }}>{course.nombre}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                Instructor: {course.usuarios?.nombre}
              </p>
              
              {dbUser.roles?.nombre_rol === 'Estudiante' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>Progreso</span>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>0%</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: '0%' }}></div>
                  </div>
                </div>
              )}

              <Link to={dbUser.roles?.nombre_rol === 'Docente' ? `/manage-course/${course.id_curso}` : `/course/${course.id_curso}`} className="btn btn-secondary" style={{ width: '100%' }}>
                {dbUser.roles?.nombre_rol === 'Estudiante' ? 'Ir al Curso' : 'Administrar Curso'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
