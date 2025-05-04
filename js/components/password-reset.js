// 비밀번호 찾기/재설정
(function() {
  const root = document.getElementById('sidebar');
  if (!root) return;
  const panel = document.createElement('div');
  panel.id = 'pwreset-panel';
  panel.style = 'margin-bottom:2rem;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:2rem 1.5rem;';
  panel.innerHTML = `
    <h2>비밀번호 찾기</h2>
    <input id="pwreset-email" type="email" placeholder="이메일" required />
    <button id="pwreset-btn">재설정 메일 발송</button>
    <div id="pwreset-msg" style="margin-top:1rem;color:#e57373;"></div>
  `;
  root.appendChild(panel);
  document.getElementById('pwreset-btn').onclick = async () => {
    const email = document.getElementById('pwreset-email').value;
    if (!email) return;
    try {
      const { error } = await window.supabaseClient.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      document.getElementById('pwreset-msg').style.color = '#4caf50';
      document.getElementById('pwreset-msg').innerText = '재설정 메일 발송 완료';
    } catch (err) {
      document.getElementById('pwreset-msg').style.color = '#e57373';
      document.getElementById('pwreset-msg').innerText = err.message || '실패';
    }
  };
})();
