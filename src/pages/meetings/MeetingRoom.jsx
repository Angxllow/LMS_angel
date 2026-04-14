import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../../contexts/AuthContext';

const MeetingRoom = () => {
  const { idCurso } = useParams();
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [meetingStarted, setMeetingStarted] = useState(false);

  const domain = 'meet.jit.si';
  const rawRoomName = `LMSAngel_Meeting_Course_${idCurso}`;
  
  // Clean room name to avoid alphanumeric strict issues
  const roomName = rawRoomName.replace(/[^a-zA-Z0-9]/g, '');

  if(!meetingStarted) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Sala de Reuniones del Curso</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px' }}>
          Únete a la sesión en vivo estilo Teams. Podrás compartir pantalla, usar el pizarrón colaborativo, encender tu cámara y hablar con tus compañeros y docentes.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Volver al Curso</button>
          <button className="btn btn-primary" onClick={() => setMeetingStarted(true)} style={{ fontSize: '1.2rem', padding: '0.75rem 2rem' }}>
            📹 Unirse a la Sesión (Iniciar WebRTC)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 80px)', backgroundColor: '#000', borderRadius: '1rem', overflow: 'hidden', padding: 0 }}>
      {/* Jitsi Meeting Wrapper */}
      <JitsiMeeting
        domain={domain}
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: true,
          enableEmailInStats: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          SHOW_JITSI_WATERMARK: false,
        }}
        userInfo={{
          displayName: dbUser?.nombre || 'Usuario LMS'
        }}
        onApiReady={(externalApi) => {
          // Listen to the call ended event
          externalApi.addListener('readyToClose', () => {
            navigate('/dashboard');
          });
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = 'none';
        }}
      />
    </div>
  );
};

export default MeetingRoom;
