// 사용자별 테마(다크/라이트) 설정
(function() {
  const toggleBtn = document.createElement('button');
  toggleBtn.innerText = '🌙';
  toggleBtn.style = 'margin-left:1rem;font-size:1.3rem;background:none;border:none;cursor:pointer;';
  let dark = false;
  function setTheme(isDark) {
    document.body.style.background = isDark ? '#181a20' : '';
    document.body.style.color = isDark ? '#eee' : '';
    document.getElementById('app').style.background = isDark ? '#232946' : '';
    toggleBtn.innerText = isDark ? '☀️' : '🌙';
    dark = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
  toggleBtn.onclick = () => setTheme(!dark);
  window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (header) header.appendChild(toggleBtn);
    setTheme(localStorage.getItem('theme') === 'dark');
  });
})();
