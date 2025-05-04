// 관리자만 사용자 역할 변경
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if(window.userService.user?.role !== 'admin') return;
    const panel = document.createElement('div');
    panel.id = 'role-change-panel';
    panel.style = 'background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:1.2rem 1.5rem;margin:2rem auto;max-width:420px;';
    panel.innerHTML = `
      <h2>사용자 권한 변경</h2>
      <input id="role-email" type="email" placeholder="이메일" style="margin-bottom:0.7rem;" />
      <select id="role-new">
        ${window.APP_CONFIG.ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <button id="role-change-btn">권한 변경</button>
      <div id="role-change-msg" style="margin-top:1rem;"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('#role-change-btn').onclick = async () => {
      const email = panel.querySelector('#role-email').value;
      const role = panel.querySelector('#role-new').value;
      if(!email||!role) return;
      const { error } = await window.supabaseClient.supabase.from('participants').update({role}).eq('email',email);
      panel.querySelector('#role-change-msg').style.color = error ? '#e57373' : '#4caf50';
      panel.querySelector('#role-change-msg').innerText = error ? '실패' : '변경 완료';
    };
  });
})();
