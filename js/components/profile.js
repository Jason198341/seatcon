// 로그인 후 이름/언어 등 필수 정보 입력 패널
(function() {
  const showProfileForm = (user) => {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = `
      <div style="position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1001;">
        <form id="profile-form" style="background:#fff;padding:2rem 2.5rem;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:1.2rem;min-width:320px;">
          <h2>${window.t('profile')}</h2>
          <input id="profile-name" type="text" placeholder="${window.t('name')}" value="${user?.name||''}" required />
          <input id="profile-email" type="email" placeholder="${window.t('email')}" value="${user?.email||''}" required />
          <select id="profile-lang" required>
            ${window.APP_CONFIG.SUPPORTED_LANGUAGES.map(l => `<option value="${l}" ${user?.language===l?'selected':''}>${l}</option>`).join('')}
          </select>
          <button type="submit">${window.t('save')}</button>
        </form>
      </div>
    `;
    document.getElementById('profile-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value;
      const email = document.getElementById('profile-email').value;
      const language = document.getElementById('profile-lang').value;
      // participants 테이블에 upsert
      await window.supabaseClient.supabase.from('participants').upsert({
        id: user?.id,
        email, name, language, role: user?.role||'attendee'
      });
      modalRoot.innerHTML = '';
      location.reload();
    };
  };
  // 로그인 후, userService.user에 정보 없으면 강제 입력
  window.addEventListener('DOMContentLoaded', async () => {
    const user = await window.userService.loadUser();
    if (!user?.name || !user?.email || !user?.language) {
      showProfileForm(user);
    }
  });
})();
