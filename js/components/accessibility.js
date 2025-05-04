// 접근성: 키보드 포커스, 스크린리더 등
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    // 채팅 입력창 엔터로 전송
    const input = document.getElementById('chat-input');
    if(input) input.setAttribute('aria-label', '메시지 입력');
    // 사이드바/채팅/공지 등 주요 영역에 role/aria-label 부여
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.setAttribute('role', 'navigation');
    const chat = document.getElementById('chat-panel');
    if(chat) chat.setAttribute('role', 'main');
    const notice = document.getElementById('notice-bar');
    if(notice) notice.setAttribute('role', 'status');
  });
})();
