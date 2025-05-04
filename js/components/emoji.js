// 이모지 피커 및 메시지 입력창에 삽입
(function() {
  const emojiBtn = document.createElement('button');
  emojiBtn.innerText = '😊';
  emojiBtn.style = 'margin-left:0.5rem;font-size:1.3rem;background:none;border:none;cursor:pointer;';
  const emojiList = ['😀','😂','😍','👍','🙏','🎉','😎','😢','🔥','💯','🤔','🙌','🥳','😡','😱','👏','😇','😅','😜','😏','😴'];
  let picker = null;
  emojiBtn.onclick = () => {
    if (picker) { picker.remove(); picker = null; return; }
    picker = document.createElement('div');
    picker.style = 'position:absolute;bottom:3.5rem;left:50%;transform:translateX(-50%);background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.18);padding:0.7rem 1rem;z-index:3000;display:flex;gap:0.5rem;flex-wrap:wrap;';
    emojiList.forEach(e => {
      const btn = document.createElement('button');
      btn.innerText = e;
      btn.style = 'font-size:1.3rem;background:none;border:none;cursor:pointer;';
      btn.onclick = () => {
        const input = document.getElementById('chat-input');
        if(input) input.value += e;
        picker.remove(); picker = null;
      };
      picker.appendChild(btn);
    });
    document.body.appendChild(picker);
    document.addEventListener('click', function handler(ev) {
      if (!picker.contains(ev.target) && ev.target!==emojiBtn) { picker.remove(); picker = null; document.removeEventListener('click', handler); }
    });
  };
  window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    if(form) form.appendChild(emojiBtn);
  });
})();
