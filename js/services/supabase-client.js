// Supabase 클라이언트 초기화 및 인증/DB 함수
// 반드시 https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm 로드 필요
if (!window.supabase) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';
  script.type = 'module';
  document.head.appendChild(script);
}
window.supabaseClient = {
  supabase: null,
  async init() {
    if (!window.APP_CONFIG.SUPABASE_URL || !window.APP_CONFIG.SUPABASE_ANON_KEY) return;
    // supabase-js v2 ESM 방식
    if (!window.supabase) {
      window.supabase = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm');
    }
    this.supabase = window.supabase.createClient(
      window.APP_CONFIG.SUPABASE_URL,
      window.APP_CONFIG.SUPABASE_ANON_KEY
    );
  },
  async signIn(email, password) {
    if (!this.supabase) return null;
    return await this.supabase.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    if (!this.supabase) return;
    await this.supabase.auth.signOut();
  },
  async getUser() {
    if (!this.supabase) return null;
    return (await this.supabase.auth.getUser()).data.user;
  },
  // 기타 DB 함수 추가 예정
};
