// 사이드바(참가자/역할/공지 등)
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  root.innerHTML = `<h2>참가자 목록</h2><div class="user-list" id="user-list"></div>`;
  window.dataManager.getParticipants().then(users => {
    const list = document.getElementById('user-list');
    if (!list) return;
    list.innerHTML = users.map(u => `
      <div class="user">
        <span class="name">${u.name || u.email || '익명'}</span>
        <span class="role">${u.role}</span>
        <span class="lang">${u.language || ''}</span>
      </div>
    `).join('');
  });
})();
