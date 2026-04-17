import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Search } from 'lucide-react';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { dbUser } = useAuth();
  
  const role = dbUser?.roles?.nombre_rol;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*, usuarios(nombre)');
        
      if (!error && data) {
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEnroll = async (courseId) => {
    try {
      await supabase.from('inscripciones').insert([
        { id_curso: courseId, id_usuario: dbUser.id_usuario }
      ]);
      alert('Te has inscrito correctamente');
    } catch (err) {
      alert('Error en la inscripción');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Catálogo de Cursos</h1>
        
        {/* Advanced Feature: Búsqueda */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '10px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar cursos..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando catálogo...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredCourses.map(course => (
            <div key={course.id_curso} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                height: '160px', 
                backgroundColor: 'var(--border-color)', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                backgroundImage: `url(${course.imagen || 'https://via.placeholder.com/400x200?text=LMS+Course'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
              <h3 style={{ marginBottom: '0.5rem' }}>{course.nombre}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                {course.descripcion || 'Sin descripción'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Por: {course.usuarios?.nombre || 'Docente Anónimo'}
                </span>
                
                {role === 'Estudiante' && (
                  <button onClick={() => handleEnroll(course.id_curso)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Inscribirse
                  </button>
                )}
                {role === 'Docente' && dbUser.id_usuario === course.id_docente && (
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredCourses.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              No se encontraron cursos que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
