// 채팅 패널(메시지 표시/입력)
(function() {
  const root = document.getElementById('chat-panel');
  if (!root) return;
  root.innerHTML = `
    <div class="chat-header">${window.t('interpreter_panel')}</div>
    <div id="messages"></div>
    <form id="chat-form">
      <input id="chat-input" type="text" placeholder="${window.t('send')}..." autocomplete="off" required />
      <button type="submit">${window.t('send')}</button>
    </form>
  `;
  const messagesEl = document.getElementById('messages');
  function renderMessages(msgs) {
    messagesEl.innerHTML = msgs.map(m => `
      <div class="message${m.me ? ' me' : ''}">
        <div class="meta">${m.user || '통역가'} · ${m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</div>
        <div class="text">${m.text}</div>
      </div>
    `).join('');
  }
  // 최초 메시지 로드
  window.dataManager.getMessages('interpreter').then(renderMessages);
  // 실시간 구독
  window.chatManager.subscribeMessages('interpreter', msg => {
    window.dataManager.getMessages('interpreter').then(renderMessages);
  });
  document.getElementById('chat-form').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value;
    input.disabled = true;
    try {
      await window.chatManager.sendMessage(text, 'interpreter');
      window.showToast('메시지 전송 성공', 'success');
      input.value = '';
    } catch (err) {
      window.showToast('메시지 전송 실패', 'error');
    } finally {
      input.disabled = false;
    }
  };
})();
