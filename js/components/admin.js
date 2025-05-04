// 관리자 패널(사용자/메시지/공지/통계 관리)
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if(window.userService.user?.role !== 'admin') return;
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    adminPanel.style = 'position:fixed;top:3.5rem;right:1.5rem;z-index:2000;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.18);padding:1.2rem 2rem;min-width:320px;';
    adminPanel.innerHTML = `
      <h2 style="margin-top:0">관리자 패널</h2>
      <button id="show-users">사용자 관리</button>
      <button id="show-messages">메시지 관리</button>
      <button id="show-notices">공지 관리</button>
      <button id="show-stats">통계</button>
      <div id="admin-content" style="margin-top:1.2rem;"></div>
    `;
    document.body.appendChild(adminPanel);
    // 각 버튼별 관리 기능(실제 구현 필요)
  });
})();
