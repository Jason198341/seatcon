// js/init-supabase.js
(function() {
  'use strict';
  
  /**
   * Supabase 초기화 및 테이블 생성 모듈
   * 
   * 설명: 이 모듈은 Supabase 연결을 초기화하고 필요한 경우 테이블을 자동으로 생성합니다.
   */
  
  // 설정 불러오기
  const config = window.appConfig;
  
  // Supabase 클라이언트
  let supabase = null;
  
  // 초기화 상태
  let initialized = false;
  
  // 디버그 로깅
  function debug(...args) {
    if (config.isDebugMode()) {
      console.log('[Supabase Init]', ...args);
    }
  }
  
  // Supabase 클라이언트 초기화
  async function initializeSupabase() {
    if (initialized) {
      return supabase;
    }
    
    try {
      debug('Supabase 클라이언트 초기화 중...');
      
      // Supabase 클라이언트 생성
      supabase = window.supabase.createClient(
        config.getSupabaseUrl(),
        config.getSupabaseKey()
      );
      
      // 테이블 존재 여부 확인 및 생성
      await checkAndCreateTables();
      
      initialized = true;
      debug('Supabase 초기화 완료');
      
      return supabase;
    } catch (error) {
      debug('Supabase 초기화 오류:', error);
      console.error('Supabase 초기화 실패:', error);
      
      // 오류 발생 시 로컬 모드로 진행
      return null;
    }
  }
  
  // 테이블 존재 여부 확인 및 생성
  async function checkAndCreateTables() {
    try {
      debug('테이블 존재 여부 확인 중...');
      
      // users 테이블 확인
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      // messages 테이블 확인
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);
      
      // 테이블이 존재하면 더 이상 진행하지 않음
      if (!usersError && !messagesError) {
        debug('필요한 테이블이 모두 존재함');
        return;
      }
      
      debug('일부 테이블이 없음. 테이블 생성 시도...');
      
      // SQL 쿼리 정의
      const createTablesSql = `
        -- 사용자 테이블
        CREATE TABLE IF NOT EXISTS public.users (
          id VARCHAR PRIMARY KEY,
          username VARCHAR NOT NULL,
          preferred_language VARCHAR NOT NULL DEFAULT 'ko',
          room_id VARCHAR NOT NULL DEFAULT 'general',
          last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- 메시지 테이블
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          username VARCHAR NOT NULL,
          message TEXT NOT NULL,
          language VARCHAR NOT NULL DEFAULT 'ko',
          isannouncement BOOLEAN DEFAULT false,
          reply_to JSONB DEFAULT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS messages_room_id_idx ON public.messages(room_id);
        CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
        CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
        CREATE INDEX IF NOT EXISTS messages_isannouncement_idx ON public.messages(isannouncement);
        CREATE INDEX IF NOT EXISTS users_room_id_idx ON public.users(room_id);
        CREATE INDEX IF NOT EXISTS users_last_activity_idx ON public.users(last_activity);
        
        -- RLS 정책 적용 (Row Level Security)
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        -- 누구나 사용자를 생성하고 조회할 수 있음
        CREATE POLICY "Anyone can create users" ON public.users
          FOR INSERT WITH CHECK (true);
          
        CREATE POLICY "Anyone can read users" ON public.users
          FOR SELECT USING (true);
        
        CREATE POLICY "Anyone can update users" ON public.users
          FOR UPDATE USING (true);
        
        -- 누구나 메시지를 읽고 쓸 수 있음
        CREATE POLICY "Anyone can insert messages" ON public.messages
          FOR INSERT WITH CHECK (true);
          
        CREATE POLICY "Anyone can read messages" ON public.messages
          FOR SELECT USING (true);
      `;
      
      // 사용자 권한으로는 테이블 생성 불가
      debug('사용자 권한으로는 테이블을 자동으로 생성할 수 없습니다.');
      debug('관리자가 Supabase 대시보드에서 테이블을 생성해야 합니다.');
      
      // localStorage에 오류 알림 저장
      localStorage.setItem('supabase_setup_required', 'true');
      
      throw new Error('Supabase 테이블 셋업이 필요합니다.');
    } catch (error) {
      debug('테이블 확인/생성 오류:', error);
      console.error('테이블 확인/생성 실패:', error);
      
      // 오류 발생 시 알림만 하고 진행
      return;
    }
  }
  
  // 초기화 함수 내보내기
  window.supabaseInit = {
    initialize: initializeSupabase
  };
})();