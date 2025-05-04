// 채팅 메시지 실시간 관리
window.chatManager = {
  subscribeMessages(role, callback) {
    // Supabase 실시간 구독
    const channel = window.supabaseClient.supabase.channel('comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `user_role=eq.${role}` }, payload => {
        callback(payload.new);
      })
      .subscribe();
    return channel;
  },
  async sendMessage(text, role) {
    // Supabase에 메시지 전송
    await window.supabaseClient.supabase.from('comments').insert([{ text, user_role: role }]);
  }
};
