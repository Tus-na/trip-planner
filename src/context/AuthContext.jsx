import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          await fetchCurrentUser(session.user.id);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchCurrentUser = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current user profile:', error.message);
      setCurrentUser(null);
    } else {
      setCurrentUser(data);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const register = async ({ email, password, full_name, role, assigned_role }) => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      throw authError;
    }

    // If user is created, update their profile with additional data
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name, role, assigned_role })
        .eq('id', authData.user.id);

      if (profileError) {
        // Optionally, handle this error more gracefully, e.g., delete the auth.user
        console.error("Error updating user profile after signup:", profileError.message);
        setLoading(false);
        throw profileError;
      }
    }
    setLoading(false);
    return authData;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw error;
  };

  const fetchAllMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });
    setLoading(false);
    if (error) {
      console.error('Error fetching all members:', error.message);
      return [];
    }
    return data;
  };

  const value = {
    session,
    currentUser,
    loading,
    login,
    register,
    logout,
    fetchAllMembers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};