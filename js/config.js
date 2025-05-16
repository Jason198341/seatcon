/**
 * config.js
 * 애플리케이션 설정 및 API 키 관리
 */

const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
    
    // Google Cloud Translation API 설정
    TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
    TRANSLATION_API_URL: 'https://translation.googleapis.com/language/translate/v2',
    
    // 관리자 계정 정보
    ADMIN_ID: 'kcmmer',
    ADMIN_PASSWORD: 'rnrud9881@@HH',
    
    // 지원 언어
    SUPPORTED_LANGUAGES: [
        { code: 'ko', name: '한국어' },
        { code: 'en', name: '영어' },
        { code: 'ja', name: '일본어' },
        { code: 'zh', name: '중국어' }
    ]
};

// 실제 프로덕션 환경에서는 이 파일을 .gitignore에 추가하고
// GitHub Secrets 또는 환경변수를 사용하여 관리해야 합니다.