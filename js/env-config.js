/**
 * env-config.js
 * 환경 변수에서 API 키를 로드하는 스크립트
 * GitHub Pages에서 사용할 경우 적절한 방식으로 배포 전에 이 파일을 수정해야 합니다.
 */

// 환경 변수가 있으면 사용하고, 없으면 기본값 사용
window.ENV_CONFIG = {
  SUPABASE_URL: typeof process !== 'undefined' && process.env 
    ? process.env.SUPABASE_URL 
    : 'https://dolywnpcrutdxuxkozae.supabase.co',
  
  SUPABASE_KEY: typeof process !== 'undefined' && process.env 
    ? process.env.SUPABASE_KEY 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
  
  TRANSLATION_API_KEY: typeof process !== 'undefined' && process.env 
    ? process.env.TRANSLATION_API_KEY 
    : 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs'
};

// 보안 알림: 실제 운영 환경에서는 API 키를 이 파일에 하드코딩하지 마세요.
// GitHub Secrets 또는 환경 변수 등을 사용하여 관리하는 것이 좋습니다.
