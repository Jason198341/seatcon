// 참가자 온라인/오프라인 상태 및 입장/퇴장 알림
window.onlineStatus = {
  async setOnline(userId) {
    await window.supabaseClient.supabase.from('participants').update({last_active: new Date().toISOString()}).eq('id', userId);
  },
  async getOnlineUsers() {
    const { data } = await window.supabaseClient.supabase.from('participants')
      .select('*').gte('last_active', new Date(Date.now()-1000*60*2).toISOString());
    return data || [];
  },
  subscribePresence(callback) {
    // 2분 이내 last_active 갱신된 참가자만 온라인
    setInterval(async () => {
      const users = await window.onlineStatus.getOnlineUsers();
      callback(users);
    }, 5000);
  }
};
