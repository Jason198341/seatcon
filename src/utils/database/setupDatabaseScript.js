const { initializeDatabase } = require('./setupDatabase');

/**
 * 데이터베이스 초기화 스크립트
 * 
 * 이 스크립트는 Supabase에 테이블을 생성하고 초기 데이터를 삽입합니다.
 * 다음과 같이 실행할 수 있습니다:
 * node src/utils/database/setupDatabaseScript.js
 */
async function main() {
  console.log('데이터베이스 초기화를 시작합니다...');
  
  try {
    const result = await initializeDatabase();
    
    if (result) {
      console.log('데이터베이스 초기화가 성공적으로 완료되었습니다.');
      process.exit(0);
    } else {
      console.error('데이터베이스 초기화 중 오류가 발생했습니다.');
      process.exit(1);
    }
  } catch (error) {
    console.error('치명적인 오류:', error);
    process.exit(1);
  }
}

main();
