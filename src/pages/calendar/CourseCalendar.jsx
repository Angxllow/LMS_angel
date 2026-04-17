import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const locales = {
  'es': es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CourseCalendar = () => {
  const [events, setEvents] = useState([]);
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [dbUser]);

  const fetchTasks = async () => {
    try {
      // 1. Obtenemos todas las tareas con fecha de limite
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('*, modulos(cursos(nombre))')
        .not('fecha_limite', 'is', null);

      // 2. Obtenemos las entregas del usuario actual
      const { data: entregasUsuario } = await supabase
        .from('entregas')
        .select('id_tarea')
        .eq('id_usuario', dbUser.id_usuario);
        
      const tareasEntregadas = (entregasUsuario || []).map(e => e.id_tarea);

      if (tareasData) {
        // Filtramos para quitar las que ya entrego el alumno (dejando el calendario limpio)
        const unsubmittedTasks = tareasData.filter(t => !tareasEntregadas.includes(t.id_tarea));

        const agendadas = unsubmittedTasks.map(tarea => {
          const expirationDate = new Date(tarea.fecha_limite);
          return {
            id_tarea: tarea.id_tarea,
            title: `[${tarea.modulos?.cursos?.nombre || 'Curso'}] ${tarea.titulo}`,
            start: expirationDate,
            end: expirationDate,
            allDay: true,
          };
        });
        setEvents(agendadas);
      }
    } catch (err) {
      console.error('Error fetching calendar updates', err);
    }
  };

  const handleEventClick = (event) => {
    navigate(`/task/${event.id_tarea}`);
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Cronograma de Tareas (LMS)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Días límite de cierre para entregas agendadas. Toca uno para entregar (las tareas enviadas se ocultan visualmente).</p>
      
      <div className="card" style={{ height: '100%', padding: '1rem' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          onSelectEvent={handleEventClick}
          style={{ height: '100%' }}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay tareas programadas en este rango."
          }}
        />
      </div>
    </div>
  );
};

export default CourseCalendar;
