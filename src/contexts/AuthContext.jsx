import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    // Get active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        fetchDbUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          fetchDbUser(session.user);
        } else {
          setDbUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchDbUser = async (sessionUser) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, roles(nombre_rol)')
        .eq('id_usuario', sessionUser.id)
        .single();
      
      if (!error && data) {
        setDbUser(data);
        // Insert Access log
        supabase.from('historial_accesos').insert([{ id_usuario: sessionUser.id, ip: 'Local/Client', dispositivo: navigator.userAgent }]).then();
      } else if (error && error.code === 'PGRST116') {
        // Condición de Carrera: Posiblemente Register.jsx apenas está insertando.
        // Hacemos una pausa corta y reintentamos.
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { data: retryData, error: retryError } = await supabase.from('usuarios').select('*, roles(nombre_rol)').eq('id_usuario', sessionUser.id).single();

        if (!retryError && retryData) {
           setDbUser(retryData);
           supabase.from('historial_accesos').insert([{ id_usuario: sessionUser.id, ip: 'Local/Client', dispositivo: navigator.userAgent }]).then();
        } else {
           // Si AUN NO ESTA, entonces sí fue un Autologin puro (Google OAuth)
           const defaultRole = '82e0c2d4-acbe-4b1c-9b6c-b9f7d9d11f81'; // Estudiante
           const { data: newUser, error: insertError } = await supabase.from('usuarios').insert([
             {
               id_usuario: sessionUser.id,
               nombre: sessionUser.user_metadata?.full_name || 'Usuario Google',
               correo: sessionUser.email,
               id_rol: defaultRole
             }
           ]).select('*, roles(nombre_rol)').single();

           if (!insertError && newUser) {
             setDbUser(newUser);
             await supabase.from('configuraciones_usuario').insert([{ id_usuario: sessionUser.id, preferencias: { theme: 'light' } }]);
             supabase.from('historial_accesos').insert([{ id_usuario: sessionUser.id, ip: 'Local/Client', dispositivo: navigator.userAgent }]).then();
           }
        }
      }
    } catch (err) {
      console.error('Error fetching/creating user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const loginWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  const logout = async () => {
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, dbUser, loading, login, loginWithGoogle, logout, supabase }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
