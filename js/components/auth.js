// 인증/로그인 UI 및 로직
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  // 로그인/회원가입 탭
  const tabPanel = document.createElement('div');
  tabPanel.style = 'display:flex;gap:1rem;margin-bottom:1rem;';
  const loginTab = document.createElement('button');
  loginTab.innerText = '로그인';
  loginTab.style = 'font-weight:bold;';
  const signupTab = document.createElement('button');
  signupTab.innerText = '회원가입';
  tabPanel.appendChild(loginTab);
  tabPanel.appendChild(signupTab);
  root.appendChild(tabPanel);
  // 로그인 패널
  const panel = document.createElement('div');
  panel.id = 'auth-panel';
  panel.innerHTML = `
    <h2>${window.t('login')}</h2>
    <input id="auth-email" type="email" placeholder="${window.t('email')}" required />
    <input id="auth-password" type="password" placeholder="${window.t('password')}" required />
    <select id="auth-role">
      ${window.APP_CONFIG.ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
    </select>
    <button id="auth-login-btn">${window.t('login')}</button>
  `;
  root.appendChild(panel);
  // 회원가입 패널(초기엔 숨김)
  const signupPanel = document.getElementById('signup-panel');
  if(signupPanel) signupPanel.style.display = 'none';
  // 탭 전환
  loginTab.onclick = () => {
    panel.style.display = '';
    if(signupPanel) signupPanel.style.display = 'none';
  };
  signupTab.onclick = () => {
    panel.style.display = 'none';
    if(signupPanel) signupPanel.style.display = '';
  };
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
  // 첫 진입시 회원가입 탭 자동 활성화(가입자 없을 때)
  window.dataManager.getParticipants().then(users => {
    if(!users.length && signupPanel) {
      panel.style.display = 'none';
      signupPanel.style.display = '';
    }
  });
})();
