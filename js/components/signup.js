// 회원가입(이메일/비번/이름/언어) 폼 및 로직
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  const panel = document.createElement('div');
  panel.id = 'signup-panel';
  panel.style = 'margin-bottom:2rem;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:2rem 1.5rem;';
  panel.innerHTML = `
    <h2>${window.t('signup')||'회원가입'}</h2>
    <input id="signup-name" type="text" placeholder="${window.t('name')}" required />
    <input id="signup-email" type="email" placeholder="${window.t('email')}" required />
    <input id="signup-password" type="password" placeholder="${window.t('password')}" required />
    <select id="signup-lang" required>
      ${window.APP_CONFIG.SUPPORTED_LANGUAGES.map(l => `<option value="${l}">${l}</option>`).join('')}
    </select>
    <button id="signup-btn">${window.t('signup')||'회원가입'}</button>
    <div id="signup-msg" style="margin-top:1rem;color:#e57373;"></div>
  `;
  root.prepend(panel);
  document.getElementById('signup-btn').onclick = async () => {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const language = document.getElementById('signup-lang').value;
    if (!name || !email || !password) return;
    try {
      const { data, error } = await window.supabaseClient.supabase.auth.signUp({ email, password });
      if (error) throw error;
      // participants 테이블에 정보 저장
      await window.supabaseClient.supabase.from('participants').upsert({ email, name, language, role: 'attendee' });
      document.getElementById('signup-msg').style.color = '#4caf50';
      document.getElementById('signup-msg').innerText = window.t('signup_success')||'회원가입 성공! 로그인 해주세요.';
    } catch (err) {
      document.getElementById('signup-msg').style.color = '#e57373';
      document.getElementById('signup-msg').innerText = err.message || (window.t('signup_fail')||'회원가입 실패');
    }
  };
})();
