// 메시지 단일 컴포넌트(아바타, 카드형, 고급화)
// md5 해시 함수(Gravatar용)
function md5(str) {
  return CryptoJS.MD5(str).toString();
}
window.renderMessage = function(msg) {
  // 아바타(이메일 기반, 없으면 기본)
  const avatarUrl = msg.avatar || `https://www.gravatar.com/avatar/${msg.email ? md5(msg.email.trim().toLowerCase()) : '000'}?d=identicon`;
  return `<div class="message${msg.me ? ' me' : ''}">
    <img class="avatar" src="${avatarUrl}" alt="avatar" />
    <div class="meta">${msg.user || '통역가'} · ${msg.time || ''}</div>
    <div class="text">${msg.text}</div>
  </div>`;
};
