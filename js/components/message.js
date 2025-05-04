// 메시지 단일 컴포넌트(템플릿화, 추후 확장)
window.renderMessage = function(msg) {
  return `<div class="message${msg.me ? ' me' : ''}">
    <div class="meta">${msg.user || '통역가'} · ${msg.time || ''}</div>
    <div class="text">${msg.text}</div>
  </div>`;
};
