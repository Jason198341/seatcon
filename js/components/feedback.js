// 메시지 전송 로딩/에러/성공 피드백 토스트
window.showToast = function(msg, type = 'info') {
  let toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  Object.assign(toast.style, {
    position: 'fixed', left: '50%', bottom: '2.5rem', transform: 'translateX(-50%)',
    background: type==='error' ? '#e57373' : type==='success' ? '#4caf50' : '#232946',
    color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)', zIndex: 2000, opacity: 0.98
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2200);
};
