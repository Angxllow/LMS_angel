import React, { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '82e0c2d4-acbe-4b1c-9b6c-b9f7d9d11f81' // Default: Estudiante
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const ROLES = {
    ESTUDIANTE: '82e0c2d4-acbe-4b1c-9b6c-b9f7d9d11f81',
    DOCENTE: '4e5b9fb3-bb1a-4829-85a7-9eceed27791e',
    ADMINISTRADOR: 'a74814c3-eacf-454f-9ff5-07c24313d057'
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. SignUp en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insertar en tabla usuarios
        const { error: dbError } = await supabase.from('usuarios').insert([
          {
            id_usuario: authData.user.id,
            nombre: formData.nombre,
            correo: formData.email,
            id_rol: formData.rol
          }
        ]);

        if (dbError) throw dbError;
        
        // 3. Crear configuracion de usuario basica
        await supabase.from('configuraciones_usuario').insert([
          {
            id_usuario: authData.user.id,
            preferencias: { theme: 'light' }
          }
        ]);

        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card animate-fade-in" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Registro</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Crea una cuenta en LMS Angel</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'var(--danger-color)', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input 
              name="nombre"
              type="text" 
              className="form-input" 
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input 
              name="email"
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              name="password"
              type="password" 
              className="form-input" 
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Tipo de Cuenta</label>
            <select 
              name="rol" 
              className="form-select" 
              value={formData.rol}
              onChange={handleChange}
            >
              <option value={ROLES.ESTUDIANTE}>Estudiante</option>
              <option value={ROLES.DOCENTE}>Docente</option>
              <option value={ROLES.ADMINISTRADOR}>Administrador</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Completar Registro'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>O</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={loginWithGoogle}
          className="btn" 
          style={{ 
            width: '100%', 
            backgroundColor: 'white', 
            color: '#333', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          type="button"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', marginRight: '8px' }} />
          Registrarse con Google
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>¿Ya tienes una cuenta? </span>
          <Link to="/login">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
