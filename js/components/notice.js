// 공지사항 상단 표시 및 실시간 갱신
(function() {
  async function renderNotice() {
    const notices = await window.dataManager.getNotices();
    if(!notices.length) return;
    const latest = notices[0];
    let el = document.getElementById('notice-bar');
    if(!el) {
      el = document.createElement('div');
      el.id = 'notice-bar';
      el.style = 'background:#232946;color:#fff;padding:0.7rem 2rem;font-weight:bold;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
      document.body.prepend(el);
    }
    el.innerText = '공지: ' + latest.title + ' - ' + latest.content;
  }
  window.addEventListener('DOMContentLoaded', renderNotice);
  setInterval(renderNotice, 15000);
})();
