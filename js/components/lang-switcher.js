// 언어 전환 드롭다운
(function() {
  const langBtn = document.createElement('select');
  langBtn.style = 'margin-left:1rem;font-size:1rem;padding:0.2rem 0.5rem;border-radius:6px;';
  window.APP_CONFIG.SUPPORTED_LANGUAGES.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.innerText = l;
    langBtn.appendChild(opt);
  });
  langBtn.onchange = () => {
    if(window.userService.user) {
      window.supabaseClient.supabase.from('participants').update({language: langBtn.value}).eq('id', window.userService.user.id);
      window.userService.user.language = langBtn.value;
      location.reload();
    }
  };
  window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (header) header.appendChild(langBtn);
    if(window.userService.user) langBtn.value = window.userService.user.language || window.APP_CONFIG.DEFAULT_LANGUAGE;
  });
})();
