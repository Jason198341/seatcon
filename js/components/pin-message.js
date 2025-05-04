// 공지/핀 메시지 기능(상단 고정)
(function() {
  window.pinMessage = function(msg) {
    const pin = document.getElementById('pin-message');
    if(pin) pin.remove();
    const el = document.createElement('div');
    el.id = 'pin-message';
    el.style = 'background:#ffe082;color:#222;padding:0.7rem 1.2rem;border-radius:10px;margin:0.7rem 2rem 0.7rem 0;box-shadow:0 2px 8px rgba(0,0,0,0.08);font-weight:bold;';
    el.innerText = msg.text;
    document.getElementById('chat-panel').prepend(el);
  };
})();
