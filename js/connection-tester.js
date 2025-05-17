/**
 * Supabase 연결 테스터
 * 데이터베이스 연결 문제를 진단하고 해결하기 위한 도구
 */

class ConnectionTester {
  constructor() {
    this.status = {
      initialized: false,
      primaryTested: false,
      backupTested: false,
      primaryConnected: false,
      backupConnected: false,
      primaryError: null,
      backupError: null,
      activeConnection: null,
      lastTest: null
    };

    // 기본 Supabase URL과 Key
    this.primaryConfig = {
      url: 'https://dolywnpcrutdxuxkozae.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8'
    };

    // 백업 Supabase URL과 Key
    this.backupConfig = {
      url: 'https://veudhigojdukbqfgjeyh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao'
    };
  }

  /**
   * 초기화
   */
  async initialize() {
    console.log('ConnectionTester: 초기화 중...');
    
    // 필요한 종속성 확인
    if (typeof supabase === 'undefined') {
      console.error('ConnectionTester: Supabase 라이브러리를 찾을 수 없습니다.');
      this.status.initialized = false;
      return false;
    }
    
    this.status.initialized = true;
    console.log('ConnectionTester: 초기화 완료');
    return true;
  }

  /**
   * 기본 연결 테스트
   * - 기본 및 백업 URL 모두 테스트
   */
  async testConnections() {
    if (!this.status.initialized) {
      await this.initialize();
    }
    
    console.log('ConnectionTester: 연결 테스트 시작');
    
    // 기본 연결 테스트
    const primaryResult = await this.testConnection(
      this.primaryConfig.url, 
      this.primaryConfig.key, 
      'primary'
    );
    
    // 백업 연결 테스트
    const backupResult = await this.testConnection(
      this.backupConfig.url, 
      this.backupConfig.key, 
      'backup'
    );
    
    // 결과 업데이트
    this.status.primaryTested = true;
    this.status.backupTested = true;
    this.status.primaryConnected = primaryResult.success;
    this.status.backupConnected = backupResult.success;
    this.status.primaryError = primaryResult.error;
    this.status.backupError = backupResult.error;
    this.status.lastTest = new Date().toISOString();
    
    // 사용 가능한 연결 결정
    if (primaryResult.success) {
      this.status.activeConnection = 'primary';
    } else if (backupResult.success) {
      this.status.activeConnection = 'backup';
    } else {
      this.status.activeConnection = null;
    }
    
    console.log('ConnectionTester: 연결 테스트 완료', {
      primaryConnected: this.status.primaryConnected,
      backupConnected: this.status.backupConnected,
      activeConnection: this.status.activeConnection
    });
    
    return {
      primary: primaryResult,
      backup: backupResult,
      activeConnection: this.status.activeConnection
    };
  }

  /**
   * 단일 연결 테스트
   * @param {string} url Supabase URL
   * @param {string} key Supabase Key
   * @param {string} label 연결 레이블
   * @returns {Promise<{success: boolean, error: any, details: any}>} 테스트 결과
   */
  async testConnection(url, key, label) {
    try {
      console.log(`ConnectionTester: ${label} 연결 테스트 중...`);
      
      // Supabase 클라이언트 생성
      const testClient = supabase.createClient(url, key);
      
      // 연결 테스트 (chatrooms 테이블에 간단한 쿼리 실행)
      const { data, error, status } = await testClient
        .from('chatrooms')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error(`ConnectionTester: ${label} 연결 테스트 실패`, error);
        return {
          success: false,
          error: error,
          details: { status }
        };
      }
      
      // 채팅방 목록 가져와서 추가 테스트
      const { data: rooms, error: roomsError } = await testClient
        .from('chatrooms')
        .select('*')
        .limit(5);
      
      if (roomsError) {
        console.warn(`ConnectionTester: ${label} 연결로 채팅방 목록 가져오기 실패`, roomsError);
      }
      
      console.log(`ConnectionTester: ${label} 연결 테스트 성공`, { 
        status, 
        roomsCount: rooms ? rooms.length : 0 
      });
      
      return {
        success: true,
        error: null,
        details: {
          status,
          rooms: rooms || []
        }
      };
    } catch (error) {
      console.error(`ConnectionTester: ${label} 연결 테스트 중 오류 발생`, error);
      return {
        success: false,
        error: error,
        details: null
      };
    }
  }

  /**
   * 활성 연결 정보 가져오기
   * @returns {Object|null} 활성 연결 설정
   */
  getActiveConnection() {
    if (!this.status.initialized || !this.status.activeConnection) {
      return null;
    }
    
    return this.status.activeConnection === 'primary'
      ? this.primaryConfig
      : this.backupConfig;
  }

  /**
   * DB 서비스 연결 수정
   * - 테스트 결과에 따라 dbService의 연결 설정 수정
   */
  async fixDbServiceConnection() {
    if (!this.status.initialized) {
      await this.initialize();
    }
    
    // 아직 테스트가 수행되지 않았으면 테스트 수행
    if (!this.status.primaryTested || !this.status.backupTested) {
      await this.testConnections();
    }
    
    // 사용 가능한 연결이 없으면 실패
    if (!this.status.activeConnection) {
      console.error('ConnectionTester: 사용 가능한 연결이 없습니다.');
      return false;
    }
    
    // dbService가 초기화되었는지 확인
    if (typeof dbService === 'undefined') {
      console.error('ConnectionTester: dbService를 찾을 수 없습니다.');
      return false;
    }
    
    try {
      console.log('ConnectionTester: dbService 연결 수정 중...');
      
      // 활성 연결 정보 가져오기
      const activeConfig = this.getActiveConnection();
      
      // dbService 연결 설정 수정
      const result = await this.updateDbServiceConnection(activeConfig);
      
      console.log('ConnectionTester: dbService 연결 수정 완료', result);
      return result;
    } catch (error) {
      console.error('ConnectionTester: dbService 연결 수정 중 오류 발생', error);
      return false;
    }
  }

  /**
   * dbService 연결 설정 업데이트
   * @param {Object} config 연결 설정
   * @returns {Promise<boolean>} 성공 여부
   */
  async updateDbServiceConnection(config) {
    if (!config || !config.url || !config.key) {
      return false;
    }
    
    try {
      // 이전 연결 저장 (문제 발생 시 복원용)
      const previousSupabase = dbService.supabase;
      
      // 새 연결 생성
      dbService.supabase = supabase.createClient(config.url, config.key);
      
      // 연결 테스트
      const { data, error } = await dbService.supabase
        .from('chatrooms')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('ConnectionTester: 새 연결 테스트 실패, 이전 연결 복원', error);
        dbService.supabase = previousSupabase;
        return false;
      }
      
      // 초기화 상태 업데이트
      dbService.initialized = true;
      
      // 연결 상태 변경 알림
      if (dbService.onConnectionStatusChange) {
        dbService.onConnectionStatusChange(true);
      }
      
      console.log('ConnectionTester: 새 연결 설정 성공');
      return true;
    } catch (error) {
      console.error('ConnectionTester: 연결 설정 변경 중 오류 발생', error);
      return false;
    }
  }

  /**
   * 테이블 구조 검증
   */
  async validateTables() {
    if (!this.status.initialized) {
      await this.initialize();
    }
    
    // 아직 테스트가 수행되지 않았으면 테스트 수행
    if (!this.status.activeConnection) {
      await this.testConnections();
    }
    
    // 사용 가능한 연결이 없으면 실패
    if (!this.status.activeConnection) {
      console.error('ConnectionTester: 사용 가능한 연결이 없습니다.');
      return false;
    }
    
    try {
      console.log('ConnectionTester: 테이블 구조 검증 중...');
      
      // 활성 연결로 Supabase 클라이언트 생성
      const activeConfig = this.getActiveConnection();
      const client = supabase.createClient(activeConfig.url, activeConfig.key);
      
      // 테이블 검증
      const tables = ['chatrooms', 'messages', 'users', 'translations', 'admins'];
      const results = {};
      
      for (const table of tables) {
        try {
          const { data, error, status } = await client
            .from(table)
            .select('*')
            .limit(1);
          
          results[table] = {
            exists: !error,
            error: error,
            status: status,
            sample: data && data.length > 0 ? data[0] : null
          };
          
          console.log(`ConnectionTester: '${table}' 테이블 검증 ${results[table].exists ? '성공' : '실패'}`);
        } catch (tableError) {
          results[table] = {
            exists: false,
            error: tableError,
            status: null,
            sample: null
          };
          
          console.error(`ConnectionTester: '${table}' 테이블 검증 중 오류 발생`, tableError);
        }
      }
      
      // 결과 반환
      return {
        success: Object.values(results).every(r => r.exists),
        tables: results
      };
    } catch (error) {
      console.error('ConnectionTester: 테이블 구조 검증 중 오류 발생', error);
      return {
        success: false,
        error: error,
        tables: {}
      };
    }
  }

  /**
   * 연결 정보 출력
   */
  logConnectionInfo() {
    console.log('===== Supabase 연결 정보 =====');
    console.log('기본 URL:', this.primaryConfig.url);
    console.log('백업 URL:', this.backupConfig.url);
    console.log('기본 연결 상태:', this.status.primaryConnected ? '연결됨' : '연결 안됨');
    console.log('백업 연결 상태:', this.status.backupConnected ? '연결됨' : '연결 안됨');
    console.log('활성 연결:', this.status.activeConnection);
    console.log('마지막 테스트:', this.status.lastTest);
    console.log('==============================');
  }

  /**
   * 문제 해결
   * - 연결 테스트 및 수정 자동 수행
   */
  async troubleshoot() {
    if (!this.status.initialized) {
      await this.initialize();
    }
    
    console.log('ConnectionTester: 문제 해결 시작');
    
    // 1. 연결 테스트
    const connectionResults = await this.testConnections();
    
    // 2. 연결 문제가 있으면 수정
    if (!this.status.primaryConnected && !this.status.backupConnected) {
      console.error('ConnectionTester: 모든 연결에 문제가 있습니다.');
      return {
        success: false,
        problem: 'all_connections_failed',
        details: connectionResults
      };
    }
    
    // 3. dbService 연결 수정
    const dbServiceFixed = await this.fixDbServiceConnection();
    
    if (!dbServiceFixed) {
      console.error('ConnectionTester: dbService 연결 수정 실패');
      return {
        success: false,
        problem: 'dbservice_update_failed',
        details: connectionResults
      };
    }
    
    // 4. 테이블 구조 검증
    const tablesValidation = await this.validateTables();
    
    if (!tablesValidation.success) {
      console.error('ConnectionTester: 테이블 구조 검증 실패');
      return {
        success: false,
        problem: 'schema_validation_failed',
        details: {
          connections: connectionResults,
          tables: tablesValidation
        }
      };
    }
    
    // 성공
    console.log('ConnectionTester: 문제 해결 완료, 모든 검증 통과');
    return {
      success: true,
      activeConnection: this.status.activeConnection,
      tables: tablesValidation.tables
    };
  }
}

// 싱글톤 인스턴스 생성
const connectionTester = new ConnectionTester();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  connectionTester.initialize().then(() => {
    // 초기화 성공 시 로그
    console.log('ConnectionTester 초기화됨');
  });
});

// 전역 객체로 노출
window.connectionTester = connectionTester;

console.log('ConnectionTester 모듈 로드됨');
