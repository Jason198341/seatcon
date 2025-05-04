// 인증 세션 만료/로그아웃 버튼 및 처리 강화
(function() {
  const logoutBtn = document.createElement('button');
  logoutBtn.innerText = '로그아웃';
  logoutBtn.style = 'margin-left:1rem;font-size:1rem;padding:0.3rem 1rem;border-radius:6px;background:#e57373;color:#fff;border:none;cursor:pointer;';
  logoutBtn.onclick = async () => {
    await window.supabaseClient.signOut();
    window.showToast('로그아웃 완료', 'success');
    setTimeout(() => location.reload(), 1000);
  };
  window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if(header && window.userService.user) header.appendChild(logoutBtn);
  });
  // 세션 만료 감지(30분)
  setInterval(async () => {
    const user = await window.supabaseClient.getUser();
    if(!user) {
      window.showToast('세션 만료, 재로그인 필요', 'error');
      setTimeout(() => location.reload(), 1500);
    }
  }, 1000*60*30);
})();
