import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const DirectChat = () => {
  const { dbUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch all interactable users
    supabase.from('usuarios').select('id_usuario, nombre').neq('id_usuario', dbUser.id_usuario)
      .then(({data}) => setUsers(data || []));
  }, [dbUser]);

  useEffect(() => {
    if(!selectedUser) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling for simplicity since websocket is heavy to setup
    return () => clearInterval(interval);
  }, [selectedUser]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('mensajes_directos')
      .select('*')
      .or(`and(id_remitente.eq.${dbUser.id_usuario},id_destinatario.eq.${selectedUser.id_usuario}),and(id_remitente.eq.${selectedUser.id_usuario},id_destinatario.eq.${dbUser.id_usuario})`)
      .order('fecha_envio', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    if(messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if(!msgInput.trim() || !selectedUser) return;
    const cacheMsg = msgInput;
    setMsgInput('');
    await supabase.from('mensajes_directos').insert([{
      id_remitente: dbUser.id_usuario,
      id_destinatario: selectedUser.id_usuario,
      contenido: cacheMsg
    }]);
    fetchMessages();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      
      {/* Sidebar de Contactos */}
      <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Contactos (Global)</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.map(u => (
            <button 
              key={u.id_usuario}
              onClick={() => setSelectedUser(u)}
              style={{
                background: selectedUser?.id_usuario === u.id_usuario ? 'var(--accent-color)' : 'transparent',
                color: selectedUser?.id_usuario === u.id_usuario ? 'white' : 'var(--text-primary)',
                border: 'none', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              📞 {u.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de Chat */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0 }}>Conversación con {selectedUser.nombre}</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              {messages.map(m => {
                const isMine = m.id_remitente === dbUser.id_usuario;
                return (
                  <div key={m.id_mensaje} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{
                      backgroundColor: isMine ? 'var(--accent-color)' : 'var(--bg-secondary)',
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: isMine ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {m.contenido}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(m.fecha_envio).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              <input 
                className="form-input" 
                style={{ flex: 1 }} 
                placeholder={`Escribe un mensaje a ${selectedUser.nombre}...`}
                value={msgInput} 
                onChange={e => setMsgInput(e.target.value)} 
              />
              <button className="btn btn-primary" type="submit">Enviar 🚀</button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <h2>Selecciona un contacto para iniciar un chat directo</h2>
          </div>
        )}
      </div>

    </div>
  );
};

export default DirectChat;
