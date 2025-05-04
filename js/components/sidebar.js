// 사이드바(참가자/역할/공지 등)
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  root.innerHTML = `<h2>${window.t('participants')}</h2><div class="user-list" id="user-list"></div>`;
  window.dataManager.getParticipants().then(users => {
    const list = document.getElementById('user-list');
    if (!list) return;
    window.onlineStatus.getOnlineUsers().then(onlineUsers => {
      list.innerHTML = users.map(u => {
        const isOnline = onlineUsers.some(ou => ou.id === u.id);
        return `
          <div class="user">
            <span class="name">${u.name || u.email || '익명'}</span>
            <span class="role">${u.role}</span>
            <span class="lang">${u.language || ''}</span>
            <span class="status" style="color:${isOnline?'#4caf50':'#aaa'};font-size:0.9em;">${isOnline?'● 온라인':'오프라인'}</span>
          </div>
        `;
      }).join('');
    });
  });
  // 실시간 온라인 상태 갱신
  window.onlineStatus.subscribePresence(onlineUsers => {
    window.dataManager.getParticipants().then(users => {
      const list = document.getElementById('user-list');
      if (!list) return;
      list.innerHTML = users.map(u => {
        const isOnline = onlineUsers.some(ou => ou.id === u.id);
        return `
          <div class="user">
            <span class="name">${u.name || u.email || '익명'}</span>
            <span class="role">${u.role}</span>
            <span class="lang">${u.language || ''}</span>
            <span class="status" style="color:${isOnline?'#4caf50':'#aaa'};font-size:0.9em;">${isOnline?'● 온라인':'오프라인'}</span>
          </div>
        `;
      }).join('');
    });
  });
})();
