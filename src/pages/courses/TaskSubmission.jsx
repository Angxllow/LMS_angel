import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { uploadFile } from '../../services/uploadService';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 

const TaskSubmission = () => {
  const { idTarea } = useParams();
  const [task, setTask] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  
  // API Translator States
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTask();
  }, [idTarea]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tareas')
        .select('*')
        .eq('id_tarea', idTarea)
        .single();
        
      setTask(data);

      if (data.fecha_limite && new Date() > new Date(data.fecha_limite)) {
        setIsPastDeadline(true);
      }

      // Check if already submitted
      const { data: existingSubmission } = await supabase
        .from('entregas')
        .select('*')
        .eq('id_tarea', idTarea)
        .eq('id_usuario', dbUser.id_usuario);
        
      if (existingSubmission && existingSubmission.length > 0) {
        setSubmitted(true);
        setContent(existingSubmission[existingSubmission.length - 1].contenido_texto || '');
        setFileUrl(existingSubmission[existingSubmission.length - 1].url_archivo_adjunto || '');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Debes escribir algo para enviar tu tarea.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl = null;
      if (file) {
        uploadedUrl = await uploadFile(file, 'entregas');
      }

      // Necesitamos asegurar que existe al menos un "tipo_entrega" en la BD.
      // Ya que id_tipo_entrega es obligatorio en entregas. Buscamos uno por defecto.
      const { data: tipos } = await supabase.from('tipos_entrega').select('id_tipo_entrega').limit(1);
      
      let tipoId = tipos?.[0]?.id_tipo_entrega;

      // Si no hay tipos de entrega registrados, simulamos que hay uno creando uno por defecto
      if (!tipoId) {
        const { data: createdTipo } = await supabase.from('tipos_entrega').insert([{ nombre_tipo: 'Texto Enriquecido' }]).select();
        if(createdTipo) tipoId = createdTipo[0].id_tipo_entrega;
      }

      await supabase.from('entregas').insert([
        {
          id_tarea: idTarea,
          id_usuario: dbUser.id_usuario,
          id_tipo_entrega: tipoId,
          contenido_texto: content,
          url_archivo_adjunto: uploadedUrl
        }
      ]);
      
      // Update local progress table for Advanced Features
      await supabase.from('progreso_tarea').insert([
        { id_usuario: dbUser.id_usuario, id_tarea: idTarea, estado_completado: true }
      ]);

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error enviando tu tarea.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando tarea...</div>;

  const handleTranslate = async () => {
    if(!task?.instrucciones) return;
    setIsTranslating(true);
    try {
      const resp = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(task.instrucciones)}&langpair=en|es`);
      setTranslatedText(resp.data.responseData.translatedText);
    } catch(err) {
      console.error(err);
      setTranslatedText("Error en el API de traducción educativa. Reintenta más tarde.");
    }
    setIsTranslating(false);
  };

  if (!task) return <div style={{ padding: '2rem' }}>Tarea no encontrada.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>{task.titulo}</h1>
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', marginBottom: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
             <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Instrucciones:</h3>
             <button onClick={handleTranslate} disabled={isTranslating} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', backgroundColor: 'transparent' }}>
               {isTranslating ? 'Traduciendo...' : '🌐 API Traductor (EN a ES)'}
             </button>
          </div>
          <p>{task.instrucciones}</p>
          
          {translatedText && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderLeft: '3px solid var(--accent-color)', backgroundColor: 'var(--bg-secondary)', borderRadius: '0 0.5rem 0.5rem 0' }}>
               <strong>Traducción API:</strong> <p style={{ marginTop: '0.5rem' }}>{translatedText}</p>
            </div>
          )}

          {task.fecha_limite && (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: 600 }}>
              Fecha límite: {new Date(task.fecha_limite).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Tu Entrega</h2>
        
        {submitted ? (
          <div>
            <div style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '2rem', fontWeight: 500, marginBottom: '1.5rem' }}>
              ✓ Tarea entregada
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} dangerouslySetInnerHTML={{ __html: content }} />
            {fileUrl && (
              <div style={{ marginTop: '1rem' }}>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  📎 Ver/Descargar Archivo Entregado
                </a>
              </div>
            )}
            <div style={{ marginTop: '2rem' }}>
              <button onClick={() => navigate(-1)} className="btn btn-secondary">Volver al Curso</button>
            </div>
          </div>
        ) : isPastDeadline ? (
          <div>
            <div style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '2rem', fontWeight: 500, marginBottom: '1.5rem' }}>
              ⚠ Fecha límite superada
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Esta tarea ha cerrado y ya no puede recibir más entregas.</p>
            <div style={{ marginTop: '2rem' }}>
              <button onClick={() => navigate(-1)} className="btn btn-secondary">Volver al Curso</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', color: 'black' }}>
               {/* Advanced feature: Rich Editor */}
               <ReactQuill 
                 theme="snow" 
                 value={content} 
                 onChange={setContent} 
                 style={{ height: '250px', marginBottom: '3rem' }}
               />
            </div>
            <div style={{ marginBottom: '2rem' }}>
               <label className="form-label">Adjuntar Archivo Obcional (PDF, DOCX, ZIP, etc)</label>
               <input 
                 type="file" 
                 className="form-input" 
                 onChange={e => setFile(e.target.files[0])}
                 disabled={submitting}
               />
               {file && <p style={{ fontSize: '0.85rem', color: 'var(--success-color)', marginTop: '0.5rem' }}>Archivo seleccionado: {file.name}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => navigate(-1)} className="btn btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Tarea'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSubmission;
