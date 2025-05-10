import { supabase } from './supabase';

/**
 * 사용자 로그인 함수
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<{data: Object, error: Error}>} 로그인 결과 또는 에러
 */
export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 회원가입 함수
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @param {Object} userData - 추가 사용자 데이터
 * @returns {Promise<{data: Object, error: Error}>} 회원가입 결과 또는 에러
 */
export const registerUser = async (email, password, userData) => {
  try {
    // Supabase Auth를 통한 사용자 등록
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          preferred_language: userData.preferred_language || 'ko'
        }
      }
    });

    if (authError) throw authError;

    // 사용자 프로필 데이터 저장
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: userData.name,
          email: email,
          preferred_language: userData.preferred_language || 'ko',
          role: userData.role || 'user', // 기본값은 일반 사용자
          created_at: new Date().toISOString()
        }]);

      if (profileError) throw profileError;
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 로그아웃 함수
 * @returns {Promise<{error: Error}>} 로그아웃 결과 또는 에러
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { error };
  }
};

/**
 * 현재 로그인한 사용자 정보 조회
 * @returns {Promise<{data: Object, error: Error}>} 사용자 정보 또는 에러
 */
export const getCurrentUser = async () => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!authData?.user) return { data: null, error: null };
    
    // 사용자 프로필 정보 조회
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) throw profileError;
    
    return { 
      data: {
        ...authData.user,
        profile: profileData
      }, 
      error: null 
    };
  } catch (error) {
    console.error('현재 사용자 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 비밀번호 재설정 이메일 전송
 * @param {string} email - 사용자 이메일
 * @returns {Promise<{data: Object, error: Error}>} 결과 또는 에러
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('비밀번호 재설정 이메일 전송 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 비밀번호 변경
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<{data: Object, error: Error}>} 결과 또는 에러
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 프로필 정보 업데이트
 * @param {string} userId - 사용자 ID
 * @param {Object} updates - 업데이트할 프로필 데이터
 * @returns {Promise<{data: Object, error: Error}>} 업데이트된 프로필 또는 에러
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // 관리자 권한 변경 시 추가 검증 필요
    if (updates.role && updates.role === 'admin') {
      const { data: currentUser } = await getCurrentUser();
      if (!currentUser || currentUser.profile?.role !== 'admin') {
        throw new Error('관리자 권한이 필요합니다.');
      }
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    
    // 언어 선호도 업데이트 시 Supabase Auth 사용자 메타데이터도 업데이트
    if (updates.preferred_language) {
      await supabase.auth.updateUser({
        data: { preferred_language: updates.preferred_language }
      });
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 모든 사용자 목록 조회 (관리자용)
 * @param {number} page - 페이지 번호
 * @param {number} limit - 페이지당 사용자 수
 * @returns {Promise<{data: Array, count: number, error: Error}>} 사용자 목록, 총 사용자 수, 또는 에러
 */
export const getAllUsers = async (page = 1, limit = 20) => {
  try {
    // 권한 검증 필요
    const { data: currentUser } = await getCurrentUser();
    if (!currentUser || currentUser.profile?.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    const offset = (page - 1) * limit;
    
    // 총 사용자 수 조회
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // 페이지네이션된 사용자 목록 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, count, error: null };
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return { data: null, count: 0, error };
  }
};

/**
 * 사용자 ID로 사용자 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{data: Object, error: Error}>} 사용자 정보 또는 에러
 */
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 계정 삭제 (관리자용)
 * @param {string} userId - 삭제할 사용자 ID
 * @returns {Promise<{error: Error}>} 에러 정보
 */
export const deleteUser = async (userId) => {
  try {
    // 권한 검증 필요
    const { data: currentUser } = await getCurrentUser();
    if (!currentUser || currentUser.profile?.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    // 해당 사용자의 메시지 삭제
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);
    
    if (messagesError) throw messagesError;
    
    // 사용자 삭제
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) throw userError;
    
    // Supabase Auth에서도 사용자 삭제 (관리자 API 필요)
    // 이 부분은 Supabase Admin API를 사용해야 하므로 백엔드 구현 필요
    
    return { error: null };
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    return { error };
  }
};

/**
 * 사용자 검색
 * @param {string} keyword - 검색 키워드
 * @returns {Promise<{data: Array, error: Error}>} 검색 결과 또는 에러
 */
export const searchUsers = async (keyword) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 로그인 이력 조회 (관리자용)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{data: Array, error: Error}>} 로그인 이력 또는 에러
 */
export const getUserLoginHistory = async (userId) => {
  try {
    // 권한 검증 필요
    const { data: currentUser } = await getCurrentUser();
    if (!currentUser || currentUser.profile?.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    // 이 기능은 Supabase에서 기본 제공하지 않으므로
    // auth.users 테이블의 last_sign_in_at 정보만 제공
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, last_sign_in_at')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('사용자 로그인 이력 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 사용자 통계 조회 (관리자용)
 * @returns {Promise<{data: Object, error: Error}>} 사용자 통계 또는 에러
 */
export const getUserStats = async () => {
  try {
    // 권한 검증 필요
    const { data: currentUser } = await getCurrentUser();
    if (!currentUser || currentUser.profile?.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    // 총 사용자 수
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // 관리자 수
    const { count: adminCount, error: adminError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    
    if (adminError) throw adminError;
    
    // 최근 가입자 (10명)
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) throw recentError;
    
    // 언어별 사용자 통계
    const { data: languageStats, error: langError } = await supabase
      .from('users')
      .select('preferred_language, count')
      .select('preferred_language')
      .select()
      .count()
      .group('preferred_language');
    
    if (langError) throw langError;
    
    return {
      data: {
        totalUsers,
        adminCount,
        recentUsers,
        languageStats
      },
      error: null
    };
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    return { data: null, error };
  }
};
