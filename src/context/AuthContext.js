import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children, value }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { session } = value || {};

  useEffect(() => {
    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [session]);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const register = async (email, password, name, preferredLanguage = 'ko', role = 'user') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            preferred_language: preferredLanguage,
            role,
          },
        },
      });

      if (error) throw error;
      
      // 새 사용자를 사용자 테이블에도 저장
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            name,
            email,
            preferred_language: preferredLanguage,
            role,
          },
        ]);

      if (profileError) throw profileError;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateUserProfile = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    getUserProfile,
    updateUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
