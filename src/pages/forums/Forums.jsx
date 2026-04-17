import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Send } from 'lucide-react';

const Forums = () => {
  const [forums, setForums] = useState([]);
  const [activeForum, setActiveForum] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { dbUser } = useAuth();

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('foros').select('*, cursos(nombre)');
      setForums(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadForumThread = async (forum) => {
    setActiveForum(forum);
    try {
      const { data } = await supabase
        .from('mensajes')
        .select('*, usuarios(nombre, roles(nombre_rol))')
        .eq('id_foro', forum.id_foro)
        .order('fecha_envio', { ascending: true });
        
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data } = await supabase.from('mensajes').insert([
        {
          id_foro: activeForum.id_foro,
          id_usuario: dbUser.id_usuario,
          contenido: newMessage
        }
      ]).select('*, usuarios(nombre, roles(nombre_rol))');

      if (data) {
        setMessages([...messages, data[0]]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando foros...</div>;
  if (!dbUser) return null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '2rem', height: '100%' }}>
      {/* Sidebar de Foros */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Foros de Discusión</h2>
        {forums.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay foros disponibles.</p>}
        {forums.map(forum => (
          <div 
            key={forum.id_foro} 
            className="card" 
            style={{ 
              cursor: 'pointer', 
              padding: '1rem',
              borderLeft: activeForum?.id_foro === forum.id_foro ? '4px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: activeForum?.id_foro === forum.id_foro ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
              transition: 'all 0.2s ease'
            }}
            onClick={() => loadForumThread(forum)}
          >
            <h4 style={{ marginBottom: '0.25rem' }}>{forum.titulo}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Curso: {forum.cursos?.nombre}</p>
          </div>
        ))}
      </div>

      {/* Area principal de mensajes */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', padding: 0, overflow: 'hidden' }}>
        {activeForum ? (
          <>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{activeForum.titulo}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activeForum.descripcion}</p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {messages.length === 0 ? (
                 <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                   Sé el primero en escribir en este foro.
                 </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.id_usuario === dbUser.id_usuario;
                  return (
                    <div key={msg.id_mensaje} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                        {isMine ? 'Tú' : msg.usuarios?.nombre} • {new Date(msg.fecha_envio).toLocaleTimeString()}
                      </span>
                      <div style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        backgroundColor: isMine ? 'var(--accent-color)' : 'var(--bg-primary)',
                        color: isMine ? 'white' : 'var(--text-primary)',
                        border: isMine ? 'none' : '1px solid var(--border-color)',
                        borderBottomRightRadius: isMine ? '0' : '1rem',
                        borderBottomLeftRadius: isMine ? '1rem' : '0'
                      }}>
                        {msg.contenido}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ flex: 1, borderRadius: '2rem', padding: '0.75rem 1.5rem' }}
                  placeholder="Escribe tu mensaje aquí..." 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '2rem', padding: '0 1.5rem' }} disabled={!newMessage.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Selecciona un foro del panel izquierdo para ver la conversación</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forums;
