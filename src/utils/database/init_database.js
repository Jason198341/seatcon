import { supabase } from '../../services/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Supabase 데이터베이스에 스키마 및 초기 데이터를 설정하는 함수
 */
const initDatabase = async () => {
  try {
    console.log('데이터베이스 초기화 시작...');

    // SQL 파일 읽기
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
    console.log('사용자 테이블 생성 중...');
    await supabase.rpc('exec_sql', { query: usersSql });

    console.log('전시물 테이블 생성 중...');
    await supabase.rpc('exec_sql', { query: exhibitsSql });

    console.log('발표 테이블 생성 중...');
    await supabase.rpc('exec_sql', { query: presentationsSql });

    console.log('일정 테이블 생성 중...');
    await supabase.rpc('exec_sql', { query: schedulesSql });

    console.log('채팅 테이블 생성 중...');
    await supabase.rpc('exec_sql', { query: chatSql });

    console.log('데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
  }
};

// 커맨드 라인에서 실행 시
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('초기화 실패:', error);
      process.exit(1);
    });
}

export default initDatabase;