import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabaseClient';

const AITutor = () => {
  const { dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `¡Hola ${dbUser?.nombre || ''}! Soy Alex, tu AI Copilot. ¿En qué te ayudo hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemContext, setSystemContext] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  useEffect(() => {
    // Inicializar el contexto técnico del asistente dependiendo del rol
    const initContext = async () => {
      if (!dbUser?.roles?.nombre_rol) return;
      
      let ctx = "Eres un asistente virtual avanzado integrado en un LMS (Learning Management System). Hablas español fluidamente y eres muy servicial.";
      
      try {
        if (dbUser.roles.nombre_rol === 'Docente') {
          // Obtener los modulos de los cursos del docente
          const { data } = await supabase.from('modulos').select('id_modulo, titulo, cursos!inner(id_curso, nombre)').eq('cursos.id_docente', dbUser.id_usuario);
          const modulosInfo = (data || []).map(m => `- [Módulo: ${m.titulo}] ID Técnico: ${m.id_modulo} (Curso: ${m.cursos?.nombre})`).join('\n');
          ctx += `\nEres un Copiloto Administrativo para un Maestro. Aquí está la lista de módulos que impartes con sus IDs obligatorios:\n${modulosInfo}\nCRÍTICO: Si el maestro te pide crear una tarea o cuestionario, NO escribas simplemente la respuesta. DEBES usar OBLIGATORIAMENTE la herramienta 'create_task'. Esto interactúa con la base de datos real.`;
        } else if (dbUser.roles.nombre_rol === 'admin') {
          ctx += `\nEres un AI Admin Copilot Autónomo conectado a la Base de Datos. IMPORTANTE: Tienes herramientas activas en tu sistema. Cuando el usuario te ordene anunciar un aviso, enviar una alerta general, o crear una insignia, BAJO NINGUNA CIRCUNSTANCIA respondas únicamente redactando el texto. DEBES ejecutar la herramienta ('create_global_announcement' o 'create_badge') de lo contrario fallarás en tu misión.`;
        } else {
          ctx += `\nEres un AI Tutor de apoyo para el estudiante.`;
        }
      } catch (err) {
        console.error("Context build fail", err);
      }
      setSystemContext(ctx);
    };

    if (isOpen && !systemContext) {
      initContext();
    }
  }, [dbUser, isOpen, systemContext]);

  const handleToolExecution = async (toolCall) => {
    const fnName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    if (fnName === 'create_task') {
      await supabase.from('tareas').insert([{
        id_modulo: args.id_modulo,
        titulo: args.titulo,
        instrucciones: args.instrucciones,
        fecha_limite: args.fecha_limite || null,
      }]);
      return `✅ Tarea educativa "${args.titulo}" agendada exitosamente en la base de datos de Supabase.`;
    }
    
    if (fnName === 'create_global_announcement') {
      // Fetch all users to notify
      const { data: users } = await supabase.from('usuarios').select('id_usuario');
      if (users && users.length > 0) {
        const payload = users.map(u => ({
          id_usuario: u.id_usuario,
          mensaje: args.mensaje,
          tipo: 'global',
        }));
        await supabase.from('notificaciones').insert(payload);
        return `✅ Anuncio Global "${args.mensaje}" distribuido y guardado exitosamente a todos los usuarios.`;
      }
      return `❌ Hubo un error recuperando a los usuarios para el anuncio.`;
    }

    if (fnName === 'create_badge') {
      await supabase.from('insignias').insert([{
        nombre: args.nombre,
        descripcion_logro: args.descripcion_logro,
      }]);
      return `✅ Insignia global "${args.nombre}" forjada exitosamente en el sistema.`;
    }

    return "❌ No reconozco esta herramienta.";
  };

  const getToolsDef = () => {
    const role = dbUser?.roles?.nombre_rol;
    if (role === 'Docente') {
      return [{
        type: "function",
        function: {
          name: "create_task",
          description: "Crea automáticamente una tarea para los alumnos dentro del modulo de un curso",
          parameters: {
            type: "object",
            properties: {
              id_modulo: { type: "string", description: "El UUID del modulo (míralo en tu system prompt)" },
              titulo: { type: "string", description: "Titulo breve de la tarea" },
              instrucciones: { type: "string", description: "Instrucciones detalladas dictadas por el maestro" },
              fecha_limite: { type: "string", description: "Opcional. Fecha de vencimiento formato YYYY-MM-DD" },
            },
            required: ["id_modulo", "titulo", "instrucciones"]
          }
        }
      }];
    }
    if (role === 'admin') {
      return [
        {
          type: "function",
          function: {
            name: "create_global_announcement",
            description: "Dispara un mensaje o alerta general en las notificaciones de todos los estudiantes y maestros de la plataforma",
            parameters: {
              type: "object",
              properties: {
                mensaje: { type: "string", description: "El texto crudo de la notificación" }
              },
              required: ["mensaje"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_badge",
            description: "Crea una insignia dorada y nueva en la plataforma",
            parameters: {
              type: "object",
              properties: {
                nombre: { type: "string", description: "Nombre de la medalla" },
                descripcion_logro: { type: "string", description: "Qué hizo el alumno para ganarla" }
              },
              required: ["nombre", "descripcion_logro"]
            }
          }
        }
      ];
    }
    return undefined; // Estudiantes no tienen herramientas (tools) para modificar base de datos
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const currentQueue = [...messages, userMessage];
    setMessages(currentQueue);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) throw new Error("No Groq API Key found. Configure REACT_APP_GROQ_API_KEY en tu archivo .env");

      // Primer llamada al modelo API (esperando posible respuesta de Function-Calling)
      const payload = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: 'system', content: systemContext || 'Cargando directivas...' },
          ...currentQueue
        ],
        temperature: 0.1, // Baja temperatura para mejor precision estructurando JSON de base de datos
      };

      const toolsAvailable = getToolsDef();
      if (toolsAvailable && toolsAvailable.length > 0) {
        payload.tools = toolsAvailable;
        payload.tool_choice = "auto";
      }

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      const choice = response.data.choices[0];
      const resMessage = choice.message;

      // Si el LLM dictaminó ejecutar una función / herramienta de base de datos
      if (resMessage.tool_calls && resMessage.tool_calls.length > 0) {
        
        let operationsResult = '';
        
        for (const tool of resMessage.tool_calls) {
           const logResult = await handleToolExecution(tool);
           operationsResult += logResult + '\n';
        }
        
        // Push result message to UI to simulate it handled the backend job magically.
        setMessages(prev => [...prev, { role: 'assistant', content: operationsResult }]);

      } else {
        // Respuesta normal conversacional
        setMessages(prev => [...prev, { role: 'assistant', content: resMessage.content }]);
      }
      
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (err.response?.data?.error?.message) {
         errorMsg = err.response.data.error.message;
      } else if (!process.env.REACT_APP_GROQ_API_KEY) {
         errorMsg = "La llave REACT_APP_GROQ_API_KEY está vacía o no fue detectada por React. (Asegúrate de reiniciar la terminal).";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error de red: ${errorMsg}` }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: 'var(--accent-color)', color: 'white', display: isOpen ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer', border: 'none', zIndex: 1000
        }}
        className="animate-fade-in"
      >
        <MessageCircle size={30} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', height: '540px', backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', zIndex: 1000, border: '1px solid var(--border-color)'
          }}
          className="animate-fade-in"
        >
          {/* Header */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={24} />
              <span style={{ fontWeight: 'bold' }}>Angel AI Agent</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
            {messages.map((msg, index) => {
              const isMine = msg.role === 'user';
              const isSystemAction = msg.content.includes('✅') || msg.content.includes('❌ Error de red');
              
              if(isSystemAction && !isMine) {
                 return (
                    <div key={index} style={{ alignSelf: 'center', width: '90%', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.8rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
                       {msg.content}
                    </div>
                 );
              }

              return (
                <div key={index} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    backgroundColor: isMine ? 'var(--accent-color)' : 'white',
                    color: isMine ? 'white' : 'black',
                    padding: '0.75rem 1rem', fontSize: '0.9rem', lineHeight: '1.4',
                    borderRadius: isMine ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.8rem', backgroundColor: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--accent-color)' }}>
                <Bot size={14} className="animate-pulse" /> Procesando petición agente...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form style={{ display: 'flex', padding: '0.75rem', gap: '0.5rem', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }} onSubmit={handleSend}>
            <input
              style={{ flex: 1, padding: '0.75rem', borderRadius: '2rem', border: '1px solid var(--border-color)', outline: 'none' }}
              placeholder={dbUser?.roles?.nombre_rol === 'Estudiante' ? "Hazme una consulta académica..." : "Ordena una acción o chatea..."} 
              value={input} onChange={e => setInput(e.target.value)} disabled={loading}
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AITutor;
