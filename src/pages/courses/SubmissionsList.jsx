import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';

const SubmissionsList = () => {
  const { idTarea } = useParams();
  const [entregas, setEntregas] = useState([]);
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchEntregas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idTarea]);

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      const { data: tData } = await supabase.from('tareas').select('titulo').eq('id_tarea', idTarea).single();
      setTarea(tData);

      const { data: eData } = await supabase
        .from('entregas')
        .select('*, usuarios(nombre)')
        .eq('id_tarea', idTarea);
        
      const { data: cData } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('id_tarea', idTarea);

      const mappedEntregas = (eData || []).map(ent => ({
        ...ent,
        calificaciones: (cData || []).filter(c => c.id_usuario === ent.id_usuario)
      }));
        
      setEntregas(mappedEntregas);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openGrading = (entrega) => {
    setSelectedEntrega(entrega);
    setGrade(entrega.calificaciones?.[0]?.calificacion_valor || '');
    setComment('');
    setModalOpen(true);
  };

  const saveGrade = async (e) => {
    e.preventDefault();
    setSavingGrade(true);
    try {
      if (selectedEntrega.calificaciones && selectedEntrega.calificaciones.length > 0) {
        // Update
        await supabase.from('calificaciones')
          .update({ calificacion_valor: parseFloat(grade) })
          .eq('id_calificacion', selectedEntrega.calificaciones[0].id_calificacion);
      } else {
        // Insert
        await supabase.from('calificaciones').insert([{
          id_usuario: selectedEntrega.id_usuario,
          id_tarea: idTarea,
          calificacion_valor: parseFloat(grade)
        }]);
      }
      
      // Añadir comentario opcional
      if (comment.trim() !== '') {
        await supabase.from('comentarios_tarea').insert([{
          id_entrega: selectedEntrega.id_entrega,
          id_usuario: selectedEntrega.id_usuario,
          comentario: comment
        }]);
      }

      alert('Calificación guardada exitosamente.');
      setModalOpen(false);
      fetchEntregas();
    } catch (err) {
      console.error(err);
      alert('Error guardando calificación');
    } finally {
      setSavingGrade(false);
    }
  };

  if(loading) return <div>Cargando entregas...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Entregas para: {tarea?.titulo}</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Evalúa a los estudiantes de este curso.</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Estudiante</th>
              <th style={{ padding: '1rem' }}>Fecha de Entrega</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Calificación</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entregas.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aún no hay entregas para esta tarea.</td></tr>}
            {entregas.map(ent => {
              const hasGrade = ent.calificaciones && ent.calificaciones.length > 0;
              return (
                <tr key={ent.id_entrega} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{ent.usuarios?.nombre}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(ent.fecha_entrega).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    {hasGrade ? 
                      <span style={{ color: 'white', backgroundColor: 'var(--success-color)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>Calificado</span> : 
                      <span style={{ color: 'white', backgroundColor: 'var(--warning-color)', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>Pendiente</span>
                    }
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{hasGrade ? `${ent.calificaciones[0].calificacion_valor} / 100` : '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => openGrading(ent)}>
                      {hasGrade ? 'Modificar' : 'Evaluar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Evaluación de {selectedEntrega?.usuarios?.nombre}</h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contenido Entregado:</h4>
              <div dangerouslySetInnerHTML={{ __html: selectedEntrega?.contenido_texto || "<i>Sin contenido adjunto</i>" }} />
              {selectedEntrega?.url_archivo_adjunto && (
                <div style={{ marginTop: '1rem' }}>
                  <a href={selectedEntrega.url_archivo_adjunto} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    📎 Descargar Archivo Adjunto
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={saveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Calificación (0 - 100)</label>
                <input type="number" min="0" max="100" className="form-input" required value={grade} onChange={e => setGrade(e.target.value)} />
              </div>
              
              <div>
                <label className="form-label">Comentario de retroalimentación (Opcional)</label>
                <textarea className="form-textarea" rows="3" placeholder="Muy buen análisis, pero faltan referencias..." value={comment} onChange={e => setComment(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingGrade}>{savingGrade ? 'Guardando...' : 'Asignar Nota'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
