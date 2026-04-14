import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { uploadFile } from '../../services/uploadService';

const ManageCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('estructura');

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const { data: courseData } = await supabase.from('cursos').select('*').eq('id_curso', id).single();
      setCourse(courseData);
    } catch(err) {
      console.error(err);
    }
  };

  if(!course) return <div>Cargando gestor...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Gestionar: {course.nombre}</h1>
        <button onClick={() => navigate(`/meeting/${id}`)} className="btn btn-primary" style={{ backgroundColor: '#8b5cf6' }}>📹 Iniciar Sesión WebRTC</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['estructura', 'ajustes', 'alumnos', 'materiales_quiz'].map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500,
              color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('_', ' & ')}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        {activeTab === 'estructura' && <TabEstructura courseId={id} />}
        {activeTab === 'ajustes' && <TabAjustes course={course} refresh={fetchCourseData} />}
        {activeTab === 'alumnos' && <TabAlumnos courseId={id} />}
        {activeTab === 'materiales_quiz' && <TabMaterialesQuiz courseId={id} />}
      </div>
    </div>
  );
};

const TabEstructura = ({ courseId }) => {
  const [modules, setModules] = useState([]);
  const [forums, setForums] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [taskData, setTaskData] = useState({ id_modulo: '', titulo: '', instrucciones: '', fecha_limite: '' });
  const [forumData, setForumData] = useState({ titulo: '', descripcion: '' });
  const [materialData, setMaterialData] = useState({ id_modulo: '', titulo: '', descripcion: '' });
  const [materialFile, setMaterialFile] = useState(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  useEffect(() => { fetchEstr(); }, [courseId]);

  const fetchEstr = async () => {
    const { data: mods } = await supabase.from('modulos').select('*, tareas(*), materiales(*), cuestionarios(*)').eq('id_curso', courseId).order('orden');
    const { data: f } = await supabase.from('foros').select('*').eq('id_curso', courseId);
    setModules(mods || []);
    setForums(f || []);
  };

  const addModule = async (e) => {
    e.preventDefault();
    await supabase.from('modulos').insert([{ id_curso: courseId, titulo: newTitle, orden: modules.length + 1 }]);
    setNewTitle(''); fetchEstr();
  };

  const addTask = async (e) => {
    e.preventDefault();
    await supabase.from('tareas').insert([{...taskData, fecha_limite: taskData.fecha_limite ? new Date(taskData.fecha_limite).toISOString() : null}]);
    setTaskData({ id_modulo: '', titulo: '', instrucciones: '', fecha_limite: '' }); fetchEstr();
  };

  const addForum = async (e) => {
    e.preventDefault();
    await supabase.from('foros').insert([{ id_curso: courseId, titulo: forumData.titulo, descripcion: forumData.descripcion }]);
    setForumData({ titulo: '', descripcion: '' }); fetchEstr();
  };

  const addMaterial = async (e) => {
    e.preventDefault();
    if (!materialData.id_modulo || !materialFile) return alert('Por favor complete modulo y adjunte un archivo');
    setUploadingMaterial(true);
    try {
      // Find a valid type ID dynamically
      const { data: typeData } = await supabase.from('tipos_material').select('id_tipo_material').limit(1).single();
      const typeId = typeData?.id_tipo_material || '346ec3a1-5822-4ac5-875b-64607f6c6c27';

      const url = await uploadFile(materialFile, 'course-materials');
      
      const { error } = await supabase.from('materiales').insert([{
        id_modulo: materialData.id_modulo,
        id_tipo_material: typeId,
        titulo: materialData.titulo,
        contenido_texto: materialData.descripcion,
        url_archivo_adjunto: url,
      }]);
      
      if (error) { throw error; }

      setMaterialData({ id_modulo: '', titulo: '', descripcion: '' });
      setMaterialFile(null);
      e.target.reset();
      fetchEstr();
      alert("Material subido exitosamente a los estudiantes.");
    } catch (err) {
      console.error(err);
      alert('Error al insertar el material en la base de datos');
    }
    setUploadingMaterial(false);
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div className="card">
        <h3>Estructura del Curso (Módulos)</h3>
        <ul style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {modules.map(mod => (
            <li key={mod.id_modulo} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
              <h4 style={{ color: 'var(--accent-color)' }}>{mod.titulo}</h4>
              <div style={{ marginLeft: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tareas: {mod.tareas?.length} | Materiales: {mod.materiales?.length} | Cuestionarios: {mod.cuestionarios?.length}
                {mod.tareas?.map(t => (
                  <div key={t.id_tarea} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>📝 {t.titulo}</span>
                    <Link to={`/manage-task/${t.id_tarea}/submissions`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Entregas</Link>
                  </div>
                ))}
                {mod.cuestionarios?.map(q => (
                  <div key={q.id_cuestionario} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>❓ Examen: {q.titulo}</span>
                    <Link to={`/manage-quiz/${q.id_cuestionario}`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Redactar</Link>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={addModule} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <input className="form-input" style={{ flex: 1 }} placeholder="Ej. Tema 1" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <button type="submit" className="btn btn-primary">Añadir Módulo</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3>Asignar Tarea</h3>
          <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select className="form-select" value={taskData.id_modulo} onChange={e => setTaskData({...taskData, id_modulo: e.target.value})} required>
              <option value="">Seleccione Módulo...</option>
              {modules.map(m => <option key={m.id_modulo} value={m.id_modulo}>{m.titulo}</option>)}
            </select>
            <input className="form-input" placeholder="Título de Tarea" value={taskData.titulo} onChange={e => setTaskData({...taskData, titulo: e.target.value})} required />
            <textarea className="form-textarea" rows="3" placeholder="Instrucciones" value={taskData.instrucciones} onChange={e => setTaskData({...taskData, instrucciones: e.target.value})} required></textarea>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.85rem'}}>Vencimiento (Opcional)</label>
              <input type="datetime-local" className="form-input" value={taskData.fecha_limite} onChange={e => setTaskData({...taskData, fecha_limite: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Asignar Tarea</button>
          </form>
        </div>

        <div className="card">
          <h3>Subir Material</h3>
          <form onSubmit={addMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select className="form-select" value={materialData.id_modulo} onChange={e => setMaterialData({...materialData, id_modulo: e.target.value})} required>
              <option value="">Seleccione Módulo...</option>
              {modules.map(m => <option key={m.id_modulo} value={m.id_modulo}>{m.titulo}</option>)}
            </select>
            <input className="form-input" placeholder="Título del Apunte (Ej. Diapositivas)" value={materialData.titulo} onChange={e => setMaterialData({...materialData, titulo: e.target.value})} required />
            <textarea className="form-textarea" rows="2" placeholder="Descripción breve" value={materialData.descripcion} onChange={e => setMaterialData({...materialData, descripcion: e.target.value})} />
            <input type="file" className="form-input" onChange={e => setMaterialFile(e.target.files[0])} required />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={uploadingMaterial}>
              {uploadingMaterial ? 'Subiendo...' : 'Publicar Material'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Foros (Chat/Debate)</h3>
          <form onSubmit={addForum} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input className="form-input" placeholder="Título Foro" value={forumData.titulo} onChange={e => setForumData({...forumData, titulo: e.target.value})} required />
            <textarea className="form-textarea" rows="2" placeholder="Descripción" value={forumData.descripcion} onChange={e => setForumData({...forumData, descripcion: e.target.value})} required></textarea>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Crear Foro</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const TabAjustes = ({ course, refresh }) => {
  const [formData, setFormData] = useState({ nombre: course.nombre, descripcion: course.descripcion || '', imagen: course.imagen || '' });
  
  const update = async (e) => {
    e.preventDefault();
    await supabase.from('cursos').update(formData).eq('id_curso', course.id_curso);
    alert('Curso actualizado'); refresh();
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Propiedades del Curso</h3>
      <form onSubmit={update} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="nombre" className="form-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
        <textarea name="descripcion" className="form-textarea" rows="4" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
        <input name="imagen" type="url" className="form-input" placeholder="URL imagen" value={formData.imagen} onChange={e => setFormData({...formData, imagen: e.target.value})} />
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Guardar Cambios</button>
      </form>
    </div>
  );
};

const TabAlumnos = ({ courseId }) => {
  const [inscritos, setInscritos] = useState([]);
  const [insignias, setInsignias] = useState([]);
  
  useEffect(() => {
    supabase.from('inscripciones').select('*, usuarios(nombre, correo)').eq('id_curso', courseId).then(({data}) => setInscritos(data || []));
    supabase.from('insignias').select('*').then(({data}) => setInsignias(data || []));
  }, [courseId]);

  const grantBadge = async (userId, badgeId) => {
    if(!badgeId) return;
    try {
      await supabase.from('usuarios_insignias').insert([{ id_usuario: userId, id_insignia: badgeId }]);
      alert('Insignia otorgada exitosamente');
    } catch(err) {
      console.error(err);
      alert('Error o el alumno ya tiene esta insignia');
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem' }}>Alumnos Inscritos</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem' }}>Nombre</th>
              <th style={{ padding: '0.75rem' }}>Correo</th>
              <th style={{ padding: '0.75rem' }}>Fecha Ingreso</th>
              <th style={{ padding: '0.75rem' }}>Recompensar</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map(i => (
              <tr key={i.id_inscripcion} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>{i.usuarios?.nombre}</td>
                <td style={{ padding: '0.75rem' }}>{i.usuarios?.correo}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(i.fecha_inscripcion).toLocaleDateString()}</td>
                <td style={{ padding: '0.75rem' }}>
                  <select className="form-select" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'inline-block', width: 'auto' }} onChange={(e) => {
                     grantBadge(i.id_usuario, e.target.value);
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
            {inscritos.length === 0 && <tr><td colSpan="4" style={{padding: '1rem'}}>Nadie se ha inscrito aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabMaterialesQuiz = ({ courseId }) => {
  const [modules, setModules] = useState([]);
  const [matData, setMatData] = useState({ id_modulo: '', titulo: '', contenido_texto: '' });
  const [matFile, setMatFile] = useState(null);
  const [matUploading, setMatUploading] = useState(false);
  const [quizData, setQuizData] = useState({ id_modulo: '', titulo: '' });
  
  useEffect(() => {
    supabase.from('modulos').select('*').eq('id_curso', courseId).order('orden').then(({data}) => setModules(data || []));
  }, [courseId]);

  const addMat = async (e) => {
    e.preventDefault();
    setMatUploading(true);
    try {
      let uploadedUrl = null;
      if (matFile) {
        uploadedUrl = await uploadFile(matFile, 'materials');
      }

      await supabase.from('materiales').insert([{...matData, url_archivo_adjunto: uploadedUrl}]);
      setMatData({ id_modulo: '', titulo: '', contenido_texto: '' }); 
      setMatFile(null);
      alert('Material guardado');
    } catch (err) {
      console.error(err);
      alert('Error guardando material');
    } finally {
      setMatUploading(false);
    }
  };

  const addQuiz = async (e) => {
    e.preventDefault();
    await supabase.from('cuestionarios').insert([quizData]);
    setQuizData({ id_modulo: '', titulo: '' }); alert('Cuestionario guardado (Requiere BD externa para inyectar preguntas manuales)');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      <div className="card">
        <h3>Subir Material Didáctico</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Sube documentos (pdf, docx) o redacta instrucciones.</p>
          <form onSubmit={addMat} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select className="form-select" value={matData.id_modulo} onChange={e => setMatData({...matData, id_modulo: e.target.value})} required>
              <option value="">Seleccione Módulo...</option>
              {modules.map(m => <option key={m.id_modulo} value={m.id_modulo}>{m.titulo}</option>)}
            </select>
            <input className="form-input" placeholder="Título del Material" value={matData.titulo} onChange={e => setMatData({...matData, titulo: e.target.value})} required />
            <textarea className="form-textarea" rows="3" placeholder="Instrucciones o Enlace Externo" value={matData.contenido_texto} onChange={e => setMatData({...matData, contenido_texto: e.target.value})}></textarea>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.85rem'}}>Archivo Adjunto (Opcional)</label>
              <input type="file" className="form-input" onChange={e => setMatFile(e.target.files[0])} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={matUploading}>
              {matUploading ? 'Subiendo...' : 'Publicar Material'}
            </button>
          </form>
      </div>

      <div className="card">
        <h3>Crear Cuestionario / Examen</h3>
        <form onSubmit={addQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <select className="form-select" value={quizData.id_modulo} onChange={e => setQuizData({...quizData, id_modulo: e.target.value})} required>
            <option value="">Seleccione Módulo...</option>
            {modules.map(m => <option key={m.id_modulo} value={m.id_modulo}>{m.titulo}</option>)}
          </select>
          <input className="form-input" placeholder="Título del Examen" value={quizData.titulo} onChange={e => setQuizData({...quizData, titulo: e.target.value})} required />
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Asignar Examen</button>
        </form>
      </div>
    </div>
  );
};

export default ManageCourse;
