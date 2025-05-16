// 컨퍼런스 채팅 애플리케이션 통합 환경 설정
//
// 주의: 이 파일은 배포 전에 .gitignore에 추가해야 합니다.
// 프로덕션 환경에서는 환경 변수나 비밀 관리 서비스를 사용하세요.

// Supabase 설정
const SUPABASE_URL = "https://dolywnpcrutdxuxkozae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8";

// Google Translate API 설정
const GOOGLE_TRANSLATE_API_KEY = "AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs";
const GOOGLE_TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

// 서버 설정
const PORT = 3030;

// 애플리케이션 설정
const APP_CONFIG = {
  mode: "static", // 'static' 또는 'server'
  defaultLanguage: "ko",
  defaultRoom: "general",
  adminId: "kcmmer1",
  debug: true, // 개발 환경에서는 true, 프로덕션에서는 false
  pollingInterval: 3000,
  announcementTag: "/공지 ",
  maxMessagesInMemory: 100
};

// 지원 언어
const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh"];

// 환경 설정 내보내기
module.exports = {
  SUPABASE_URL,
  SUPABASE_KEY,
  GOOGLE_TRANSLATE_API_KEY,
  GOOGLE_TRANSLATE_ENDPOINT,
  PORT,
  APP_CONFIG,
  SUPPORTED_LANGUAGES
};
