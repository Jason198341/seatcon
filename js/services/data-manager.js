// 데이터 관리(참가자, 메시지, 공지 등)
window.dataManager = {
  async getParticipants() {
    // Supabase에서 참가자 목록 조회
    const { data, error } = await window.supabaseClient.supabase
      .from('participants')
      .select('*');
    return data || [];
  },
  async getMessages(role = null) {
    // Supabase에서 메시지 목록 조회 (role별 필터)
    let query = window.supabaseClient.supabase.from('comments').select('*').order('created_at', { ascending: true });
    if (role) query = query.eq('user_role', role);
    const { data, error } = await query;
    return data || [];
  },
  async getNotices() {
    // Supabase에서 공지사항 조회
    const { data, error } = await window.supabaseClient.supabase
      .from('notices')
      .select('*');
    return data || [];
  }
};
