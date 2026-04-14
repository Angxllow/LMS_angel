import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const QuizSubmission = () => {
  const { idCuestionario } = useParams();
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  const [cuestionario, setCuestionario] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [intentoId, setIntentoId] = useState(null);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCuestionario]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      // Validar si ya hizo un intento finalizado
      const { data: previousResult } = await supabase.from('resultados_cuestionario')
        .select('*').eq('id_cuestionario', idCuestionario).eq('id_usuario', dbUser.id_usuario).single();
      
      if (previousResult) {
        setResultadoFinal(previousResult.calificacion_final);
        setLoading(false);
        return; // ya no deja dar el examen de nuevo
      }

      // Traer cuestionario
      const { data: cData } = await supabase.from('cuestionarios').select('*').eq('id_cuestionario', idCuestionario).single();
      setCuestionario(cData);

      // Traer preguntas y respuestas (sin revelar es_correcta al Frontend si fuera hiper estricto, pero para este demo traeremos todo para calcular rápido, o podemos calcular en el submit)
      const { data: pData } = await supabase.from('preguntas').select('*, respuestas(*)').eq('id_cuestionario', idCuestionario);
      setPreguntas(pData || []);

      // Iniciar intento
      const { data: intentoData } = await supabase.from('intentos_cuestionario').insert([{
        id_usuario: dbUser.id_usuario,
        id_cuestionario: idCuestionario
      }]).select().single();
      
      setIntentoId(intentoData.id_intento);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectAnswer = (preguntaId, respuestaId) => {
    setAnswers({ ...answers, [preguntaId]: respuestaId });
  };

  const submitQuiz = async () => {
    // Check si respondio todas
    if (Object.keys(answers).length < preguntas.length) {
      if (!window.confirm("Aún tienes preguntas sin responder. ¿Enviar de todas formas?")) return;
    }

    setSubmitting(true);
    try {
      // 1. Calcular calificacion
      let correctCount = 0;
      const total = preguntas.length;

      const respuestasGuardar = [];

      preguntas.forEach(p => {
        const userResId = answers[p.id_pregunta];
        if (userResId) {
          respuestasGuardar.push({
            id_intento: intentoId,
            id_pregunta: p.id_pregunta,
            id_respuesta: userResId
          });

          const resObj = p.respuestas.find(r => r.id_respuesta === userResId);
          if (resObj && resObj.es_correcta) {
            correctCount++;
          }
        }
      });

      const calificacion = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      // 2. Guardar respuestas del usuario (respuestas_usuario)
      if (respuestasGuardar.length > 0) {
        await supabase.from('respuestas_usuario').insert(respuestasGuardar);
      }

      // 3. Update Intento (intentos_cuestionario)
      await supabase.from('intentos_cuestionario').update({
        fecha_fin: new Date().toISOString(),
        calificacion_obtenida: calificacion
      }).eq('id_intento', intentoId);

      // 4. Guardar Resultados Finales (resultados_cuestionario + calificaciones general)
      await supabase.from('resultados_cuestionario').insert([{
        id_usuario: dbUser.id_usuario,
        id_cuestionario: idCuestionario,
        calificacion_final: calificacion
      }]);

      await supabase.from('calificaciones').insert([{
        id_usuario: dbUser.id_usuario,
        id_cuestionario: idCuestionario,
        calificacion_valor: calificacion
      }]);

      // Progress Tracker
      const currentLevel = await supabase.from('progreso_usuario').select('porcentaje_avance').eq('id_usuario', dbUser.id_usuario).eq('id_curso', cuestionario.id_curso).single();
      const nProgress = currentLevel?.data ? Number(currentLevel.data.porcentaje_avance) + 10 : 10;
      await supabase.from('progreso_usuario').upsert({ id_usuario: dbUser.id_usuario, id_curso: cuestionario.id_curso, porcentaje_avance: nProgress > 100 ? 100 : nProgress }, { onConflict: 'id_progreso' });

      setResultadoFinal(calificacion);
    } catch(err) {
      console.error(err);
      alert('Error al enviar el examen.');
    }
    setSubmitting(false);
  };

  if(loading) return <div>Cargando evaluación...</div>;

  if (resultadoFinal !== null) {
    return (
      <div className="animate-fade-in card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ marginBottom: '1rem', color: resultadoFinal >= 60 ? 'var(--success-color)' : 'var(--danger-color)' }}>
          {resultadoFinal >= 60 ? '¡Cuestionario Completado!' : 'Cuestionario Finalizado'}
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Tu calificación es:</p>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: resultadoFinal >= 60 ? 'var(--success-color)' : 'var(--danger-color)', marginBottom: '2rem' }}>
          {resultadoFinal} / 100
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/my-courses')}>Volver a Mis Cursos</button>
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div className="card">
        <h3>{cuestionario?.titulo}</h3>
        <p>Este examen aún no tiene preguntas elaboradas por el docente.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Examen: {cuestionario?.titulo}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Responde todas las preguntas antes de enviar.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {preguntas.map((p, idx) => (
          <div key={p.id_pregunta} className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{idx + 1}. {p.texto_pregunta}</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {p.respuestas?.map(r => (
                <label 
                  key={r.id_respuesta} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', 
                    border: '1px solid', borderColor: answers[p.id_pregunta] === r.id_respuesta ? 'var(--accent-color)' : 'var(--border-color)', 
                    borderRadius: '0.5rem', cursor: 'pointer',
                    backgroundColor: answers[p.id_pregunta] === r.id_respuesta ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="radio" 
                    name={`pregunta_${p.id_pregunta}`} 
                    value={r.id_respuesta} 
                    checked={answers[p.id_pregunta] === r.id_respuesta}
                    onChange={() => handleSelectAnswer(p.id_pregunta, r.id_respuesta)}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                  />
                  <span>{r.texto_respuesta}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>Abandonar</button>
        <button className="btn btn-primary" onClick={submitQuiz} disabled={submitting}>
          {submitting ? 'Evaluando...' : 'Enviar Examen y Ver Nota'}
        </button>
      </div>
    </div>
  );
};

export default QuizSubmission;
