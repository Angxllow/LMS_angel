import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, BookOpen, MessageSquare, PlusSquare, Settings, Award, CalendarDays, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { dbUser } = useAuth();
  const role = dbUser?.roles?.nombre_rol;
  let links = [
    { to: '/', icon: <Home size={20} />, label: 'Inicio' },
    { to: '/catalog', icon: <Compass size={20} />, label: 'Catálogo' },
    { to: '/my-courses', icon: <BookOpen size={20} />, label: 'Mis Cursos' },
    { to: '/forums', icon: <MessageSquare size={20} />, label: 'Foros' },
    { to: '/calendar', icon: <CalendarDays size={20} />, label: 'Calendario' },
    { to: '/chat', icon: <MessageCircle size={20} />, label: 'Chat Interno' }
  ];

  if (role === 'Docente') {
    links.push({ to: '/create-course', icon: <PlusSquare size={20} />, label: 'Crear Curso' });
  } else if (role === 'Administrador') {
    links.push({ to: '/admin', icon: <Settings size={20} />, label: 'Panel Admin' });
  } else if (role === 'Estudiante') {
    links.push({ to: '/grades', icon: <Award size={20} />, label: 'Calificaciones' });
  }

  const activeStyle = {
    backgroundColor: 'var(--accent-color)',
    color: 'white',
  };

  const idleStyle = {
    color: 'var(--text-secondary)',
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      height: 'calc(100vh - var(--navbar-height))',
      padding: '1.5rem 1rem',
      position: 'fixed',
      overflowY: 'auto'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              ...(isActive ? activeStyle : idleStyle)
            })}
          >
            {link.icon}
            <span style={{ fontWeight: 500 }}>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
