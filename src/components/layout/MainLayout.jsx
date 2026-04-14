import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AITutor from '../AITutor';

const MainLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ 
          flex: 1, 
          marginLeft: 'var(--sidebar-width)',
          padding: '2rem',
          backgroundColor: 'var(--bg-primary)',
          minHeight: 'calc(100vh - var(--navbar-height))'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
        <AITutor />
      </div>
    </div>
  );
};

export default MainLayout;
