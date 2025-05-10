import { supabase } from '../../services/supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Supabase 데이터베이스에 스키마 및 초기 데이터를 설정하는 함수
 */
const setupDatabase = async () => {
  try {
    console.log('=== 데이터베이스 초기화 시작... ===');

    // SQL 파일 읽기
    console.log('SQL 파일 읽는 중...');
    const usersSql = fs.readFileSync(
      path.resolve(__dirname, 'create_users_table.sql'),
      'utf8'
    );
    const exhibitsSql = fs.readFileSync(
      path.resolve(__dirname, 'create_exhibits_table.sql'),
      'utf8'
    );
    const presentationsSql = fs.readFileSync(
      path.resolve(__dirname, 'create_presentations_table.sql'),
      'utf8'
    );
    const schedulesSql = fs.readFileSync(
      path.resolve(__dirname, 'create_schedules_table.sql'),
      'utf8'
    );
    const chatSql = fs.readFileSync(
      path.resolve(__dirname, 'create_chat_tables.sql'),
      'utf8'
    );

    // 테이블 생성 순서대로 실행
    console.log('1. 사용자 테이블 생성 중...');
    const usersResult = await supabase.rpc('exec_sql', { query: usersSql });
    if (usersResult.error) {
      throw new Error(`사용자 테이블 생성 실패: ${usersResult.error.message}`);
    }
    console.log('사용자 테이블 생성 완료');

    console.log('2. 전시물 테이블 생성 중...');
    const exhibitsResult = await supabase.rpc('exec_sql', { query: exhibitsSql });
    if (exhibitsResult.error) {
      throw new Error(`전시물 테이블 생성 실패: ${exhibitsResult.error.message}`);
    }
    console.log('전시물 테이블 생성 완료');

    console.log('3. 발표 테이블 생성 중...');
    const presentationsResult = await supabase.rpc('exec_sql', { query: presentationsSql });
    if (presentationsResult.error) {
      throw new Error(`발표 테이블 생성 실패: ${presentationsResult.error.message}`);
    }
    console.log('발표 테이블 생성 완료');

    console.log('4. 일정 테이블 생성 중...');
    const schedulesResult = await supabase.rpc('exec_sql', { query: schedulesSql });
    if (schedulesResult.error) {
      throw new Error(`일정 테이블 생성 실패: ${schedulesResult.error.message}`);
    }
    console.log('일정 테이블 생성 완료');

    console.log('5. 채팅 테이블 생성 중...');
    const chatResult = await supabase.rpc('exec_sql', { query: chatSql });
    if (chatResult.error) {
      throw new Error(`채팅 테이블 생성 실패: ${chatResult.error.message}`);
    }
    console.log('채팅 테이블 생성 완료');

    console.log('=== 데이터베이스 초기화 완료! ===');
    return true;
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return false;
  }
};

/**
 * Supabase에 RLS 정책 설정 함수
 */
const setupRLS = async () => {
  try {
    console.log('=== RLS 정책 설정 시작... ===');

    // RLS 정책 설정
    const enableRLS = `
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    `;

    const createUsersPolicies = `
      -- 사용자는 자신의 프로필만 읽을 수 있음
      CREATE POLICY users_select_own ON users
        FOR SELECT
        USING (auth.uid() = id OR auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      -- 사용자는 자신의 프로필만 업데이트할 수 있음 (역할 변경 제외)
      CREATE POLICY users_update_own ON users
        FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id AND (role IS NULL OR role = 'user'));

      -- 관리자는 모든 사용자 정보를 읽고 업데이트할 수 있음
      CREATE POLICY users_admin_all ON users
        FOR ALL
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));
    `;

    const createExhibitsPolicies = `
      -- 모든 인증된 사용자는 전시물을 읽을 수 있음
      CREATE POLICY exhibits_select_all ON exhibits
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- 관리자만 전시물을 추가/수정/삭제할 수 있음
      CREATE POLICY exhibits_insert_admin ON exhibits
        FOR INSERT
        WITH CHECK (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY exhibits_update_admin ON exhibits
        FOR UPDATE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY exhibits_delete_admin ON exhibits
        FOR DELETE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));
    `;

    const createPresentationsPolicies = `
      -- 모든 인증된 사용자는 발표를 읽을 수 있음
      CREATE POLICY presentations_select_all ON presentations
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- 관리자만 발표를 추가/수정/삭제할 수 있음
      CREATE POLICY presentations_insert_admin ON presentations
        FOR INSERT
        WITH CHECK (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY presentations_update_admin ON presentations
        FOR UPDATE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY presentations_delete_admin ON presentations
        FOR DELETE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));
    `;

    const createSchedulesPolicies = `
      -- 모든 인증된 사용자는 일정을 읽을 수 있음
      CREATE POLICY schedules_select_all ON schedules
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- 관리자만 일정을 추가/수정/삭제할 수 있음
      CREATE POLICY schedules_insert_admin ON schedules
        FOR INSERT
        WITH CHECK (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY schedules_update_admin ON schedules
        FOR UPDATE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY schedules_delete_admin ON schedules
        FOR DELETE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));
    `;

    const createChatPolicies = `
      -- 모든 인증된 사용자는 채팅방을 읽을 수 있음
      CREATE POLICY chat_rooms_select_all ON chat_rooms
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- 관리자만 채팅방을 생성/수정/삭제할 수 있음
      CREATE POLICY chat_rooms_insert_admin ON chat_rooms
        FOR INSERT
        WITH CHECK (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY chat_rooms_update_admin ON chat_rooms
        FOR UPDATE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      CREATE POLICY chat_rooms_delete_admin ON chat_rooms
        FOR DELETE
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));

      -- 모든 인증된 사용자는 메시지를 읽을 수 있음
      CREATE POLICY messages_select_all ON messages
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- 모든 인증된 사용자는 메시지를 생성할 수 있음
      CREATE POLICY messages_insert_all ON messages
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

      -- 사용자는 자신의 메시지만 수정/삭제할 수 있음
      CREATE POLICY messages_update_own ON messages
        FOR UPDATE
        USING (auth.uid() = user_id);

      CREATE POLICY messages_delete_own ON messages
        FOR DELETE
        USING (auth.uid() = user_id);

      -- 관리자는 모든 메시지를 수정/삭제할 수 있음
      CREATE POLICY messages_admin_all ON messages
        FOR ALL
        USING (auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        ));
    `;

    console.log('RLS 활성화 중...');
    const rlsResult = await supabase.rpc('exec_sql', { query: enableRLS });
    if (rlsResult.error) {
      throw new Error(`RLS 활성화 실패: ${rlsResult.error.message}`);
    }

    console.log('사용자 테이블 정책 설정 중...');
    const usersPoliciesResult = await supabase.rpc('exec_sql', { query: createUsersPolicies });
    if (usersPoliciesResult.error) {
      throw new Error(`사용자 정책 설정 실패: ${usersPoliciesResult.error.message}`);
    }

    console.log('전시물 테이블 정책 설정 중...');
    const exhibitsPoliciesResult = await supabase.rpc('exec_sql', { query: createExhibitsPolicies });
    if (exhibitsPoliciesResult.error) {
      throw new Error(`전시물 정책 설정 실패: ${exhibitsPoliciesResult.error.message}`);
    }

    console.log('발표 테이블 정책 설정 중...');
    const presentationsPoliciesResult = await supabase.rpc('exec_sql', { query: createPresentationsPolicies });
    if (presentationsPoliciesResult.error) {
      throw new Error(`발표 정책 설정 실패: ${presentationsPoliciesResult.error.message}`);
    }

    console.log('일정 테이블 정책 설정 중...');
    const schedulesPoliciesResult = await supabase.rpc('exec_sql', { query: createSchedulesPolicies });
    if (schedulesPoliciesResult.error) {
      throw new Error(`일정 정책 설정 실패: ${schedulesPoliciesResult.error.message}`);
    }

    console.log('채팅 테이블 정책 설정 중...');
    const chatPoliciesResult = await supabase.rpc('exec_sql', { query: createChatPolicies });
    if (chatPoliciesResult.error) {
      throw new Error(`채팅 정책 설정 실패: ${chatPoliciesResult.error.message}`);
    }

    console.log('실시간 구독 설정 중...');
    const realtimeSetup = `
      -- 실시간 구독을 위한 publications 생성
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    `;
    const realtimeResult = await supabase.rpc('exec_sql', { query: realtimeSetup });
    if (realtimeResult.error) {
      throw new Error(`실시간 구독 설정 실패: ${realtimeResult.error.message}`);
    }

    console.log('=== RLS 정책 설정 완료! ===');
    return true;
  } catch (error) {
    console.error('RLS 정책 설정 오류:', error);
    return false;
  }
};

/**
 * 데이터베이스 초기 설정 및 RLS 정책 설정을 실행하는 함수
 */
const initializeDatabase = async () => {
  const dbSetupResult = await setupDatabase();
  if (!dbSetupResult) {
    console.error('데이터베이스 초기화 실패');
    return false;
  }

  const rlsSetupResult = await setupRLS();
  if (!rlsSetupResult) {
    console.error('RLS 정책 설정 실패');
    return false;
  }

  console.log('데이터베이스 및 RLS 정책 설정이 성공적으로 완료되었습니다.');
  return true;
};

// 스크립트가 직접 실행될 때 초기화 함수 실행
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(result => {
      if (result) {
        console.log('데이터베이스 설정이 성공적으로 완료되었습니다.');
        process.exit(0);
      } else {
        console.error('데이터베이스 설정 중 오류가 발생했습니다.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('치명적인 오류:', error);
      process.exit(1);
    });
}

export { setupDatabase, setupRLS, initializeDatabase };
