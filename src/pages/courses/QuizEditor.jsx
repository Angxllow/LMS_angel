import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';

const QuizEditor = () => {
  const { idCuestionario } = useParams();
  const [cuestionario, setCuestionario] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newPregunta, setNewPregunta] = useState({ texto: '', tipo: 'Opcion Multiple' });

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCuestionario]);

  const fetchQuiz = async () => {
    const { data: qData } = await supabase.from('cuestionarios').select('*').eq('id_cuestionario', idCuestionario).single();
    setCuestionario(qData);

    const { data: pData } = await supabase.from('preguntas').select('*, respuestas(*)').eq('id_cuestionario', idCuestionario);
    setPreguntas(pData || []);
    setLoading(false);
  };

  const addPregunta = async (e) => {
    e.preventDefault();
    if (!newPregunta.texto) return;

    try {
      const { data, error } = await supabase.from('preguntas').insert([{
        id_cuestionario: idCuestionario,
        texto_pregunta: newPregunta.texto,
        tipo_pregunta: newPregunta.tipo
      }]).select();
      
      if (error) throw error;
      
      if (data) {
        setPreguntas([...preguntas, { ...data[0], respuestas: [] }]);
        setNewPregunta({ texto: '', tipo: 'Opcion Multiple' });
      }
    } catch(err) {
      console.error(err);
      alert('Error añadiendo pregunta: ' + (err.message || 'Error desconocido'));
    }
  };

  const addRespuesta = async (preguntaId, texto, esCorrecta) => {
    if(!texto) return;
    try {
      const { error } = await supabase.from('respuestas').insert([{
        id_pregunta: preguntaId, texto_respuesta: texto, es_correcta: esCorrecta
      }]);
      if (error) throw error;
      fetchQuiz(); // recharge to get nested
    } catch (err) {
      console.error(err);
      alert('Error añadiendo respuesta: ' + (err.message || 'Desconocido'));
    }
  };

  if(loading) return <div>Cargando editor del examen...</div>;

  return (
    <div className="animate-fade-in card">
      <h2 style={{ marginBottom: '1.5rem' }}>Editor de Examen: {cuestionario?.titulo}</h2>
      
      <form onSubmit={addPregunta} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input className="form-input" style={{ flex: 1 }} placeholder="Escribe la pregunta aquí..." value={newPregunta.texto} onChange={e=>setNewPregunta({...newPregunta, texto: e.target.value})} required />
        <button type="submit" className="btn btn-primary">Añadir Pregunta</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {preguntas.map((p, idx) => (
          <div key={p.id_pregunta} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ marginBottom: '1rem' }}>{idx + 1}. {p.texto_pregunta}</h4>
            
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {p.respuestas?.map(r => (
                <li key={r.id_respuesta} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: r.es_correcta ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                    {r.es_correcta ? '✅' : '❌'}
                  </span>
                  <span>{r.texto_respuesta}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={e => {
              e.preventDefault();
              addRespuesta(p.id_pregunta, e.target.newRespuesta.value, e.target.correcta.checked);
              e.target.reset();
            }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input name="newRespuesta" className="form-input" style={{ flex: 1, padding: '0.4rem 0.8rem' }} placeholder="Escribe una opción de respuesta..." required />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input name="correcta" type="checkbox" /> Es Correcta
              </label>
              <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Añadir</button>
            </form>
          </div>
        ))}
        {preguntas.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Aún no has agregado preguntas a este examen.</p>}
      </div>
    </div>
  );
};

export default QuizEditor;
