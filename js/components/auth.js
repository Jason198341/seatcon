// 인증/로그인 UI 및 로직
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  const panel = document.createElement('div');
  panel.id = 'auth-panel';
  panel.innerHTML = `
    <h2>로그인</h2>
    <input id="auth-email" type="email" placeholder="이메일" required />
    <input id="auth-password" type="password" placeholder="비밀번호" required />
    <select id="auth-role">
      ${window.APP_CONFIG.ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
    </select>
    <button id="auth-login-btn">로그인</button>
  `;
  root.appendChild(panel);
  document.getElementById('auth-login-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const role = document.getElementById('auth-role').value;
    const res = await window.supabaseClient.signIn(email, password);
    if (res?.data?.user) {
      window.userService.setRole(role);
      location.reload();
    } else {
      alert('로그인 실패');
    }
  };
})();
