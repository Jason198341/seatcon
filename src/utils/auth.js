import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

// 인증 컨텍스트 생성
const AuthContext = createContext(null);

/**
 * 인증 컨텍스트 제공자 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 세션 및 사용자 로딩
  useEffect(() => {
    const loadSession = async () => {
      try {
        // 현재 세션 가져오기
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setSession(session);
        
        if (session) {
          // 사용자 프로필 정보 가져오기
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('사용자 프로필 로드 오류:', profileError);
          }
          
          // 사용자 정보 설정
          setUser({
            ...session.user,
            profile
          });
        }
      } catch (error) {
        console.error('세션 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // 세션 변경 이벤트 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        // 사용자 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('사용자 프로필 로드 오류:', profileError);
        }
        
        // 사용자 정보 설정
        setUser({
          ...session.user,
          profile
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 구독 취소
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * 이메일과 비밀번호로 로그인
   * @param {string} email - 이메일
   * @param {string} password - 비밀번호
   * @returns {Promise<{ data, error }>} 로그인 결과
   */
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // 마지막 로그인 시간 업데이트
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('로그인 오류:', error);
      return { data: null, error };
    }
  };

  /**
   * 회원가입
   * @param {string} email - 이메일
   * @param {string} password - 비밀번호
   * @param {Object} profile - 프로필 정보 (이름, 선호 언어 등)
   * @returns {Promise<{ data, error }>} 회원가입 결과
   */
  const signUp = async (email, password, profile) => {
    try {
      // 인증 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // 사용자 프로필 생성
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name: profile.name,
              preferred_language: profile.preferred_language || 'ko',
              role: 'user', // 기본 역할
              created_at: new Date().toISOString()
            }
          ]);
        
        if (profileError) {
          console.error('사용자 프로필 생성 오류:', profileError);
          // 롤백을 위한 사용자 삭제 (옵션)
          await supabase.auth.admin.deleteUser(data.user.id);
          throw profileError;
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { data: null, error };
    }
  };

  /**
   * 비밀번호 재설정 메일 전송
   * @param {string} email - 이메일
   * @returns {Promise<{ data, error }>} 결과
   */
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      return { data: null, error };
    }
  };

  /**
   * 로그아웃
   * @returns {Promise<{ error }>} 로그아웃 결과
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      
      return { error: null };
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return { error };
    }
  };

  /**
   * 사용자 프로필 업데이트
   * @param {Object} updates - 업데이트할 프로필 정보
   * @returns {Promise<{ data, error }>} 업데이트 결과
   */
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('로그인한 사용자가 없습니다.');
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // 사용자 정보 업데이트
      setUser(prev => ({
        ...prev,
        profile: { ...prev.profile, ...updates }
      }));
      
      return { data, error: null };
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      return { data: null, error };
    }
  };

  // 컨텍스트 값
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * 인증 컨텍스트 훅
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
  }
  
  return context;
};
