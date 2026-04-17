import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
    id_categoria: ''
  });
  
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await supabase.from('categorias').select('*');
      setCategorias(data || []);
      if(data && data.length > 0) {
        setFormData(prev => ({...prev, id_categoria: data[0].id_categoria}));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Necesitamos un id_estado. En una de las tablas existe "estados_curso"
      // Simulo obteniendo el primer estado por defecto para agilizar.
      const { data: estadoData } = await supabase.from('estados_curso').select('*').limit(1);
      let estadoDefecto = estadoData?.[0]?.id_estado;
      
      if (!estadoDefecto) {
         // Si no existe ninguno, creamos 'Activo'
         const { data: nEs } = await supabase.from('estados_curso').insert([{nombre_estado: 'Activo'}]).select();
         if(nEs) estadoDefecto = nEs[0].id_estado;
      }

      // Insertar curso
      const { data: courseData, error: courseError } = await supabase.from('cursos').insert([{
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        imagen: formData.imagen,
        id_docente: dbUser.id_usuario,
        id_estado: estadoDefecto
      }]).select().single();

      if (courseError) throw courseError;

      // Vincular categoría si existe categorias en DB y seleccionó una
      if (formData.id_categoria && courseData) {
        await supabase.from('categorias_curso').insert([{
          id_curso: courseData.id_curso,
          id_categoria: formData.id_categoria
        }]);
      }

      alert('Curso creado con éxito');
      navigate('/my-courses');
    } catch (err) {
      console.error(err);
      alert('Error creando el curso');
    } finally {
      setLoading(false);
    }
  };

  if (!dbUser) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Crear Nuevo Curso</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Curso</label>
            <input name="nombre" className="form-input" required value={formData.nombre} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea name="descripcion" className="form-textarea" rows="4" required value={formData.descripcion} onChange={handleChange}></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Imagen (URL)</label>
            <input name="imagen" type="url" className="form-input" placeholder="https://ejemplo.com/foto.jpg" value={formData.imagen} onChange={handleChange} />
          </div>

          {categorias.length > 0 && (
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select name="id_categoria" className="form-select" value={formData.id_categoria} onChange={handleChange}>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Publicar Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
