// 메시지/참가자 검색 기능
(function() {
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = '검색...';
  searchInput.style = 'margin:1rem 0.5rem 1rem 0;width:90%;padding:0.6rem 1rem;border-radius:8px;border:1px solid #e0e0e0;';
  window.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.prepend(searchInput);
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase();
      const users = sidebar.querySelectorAll('.user');
      users.forEach(u => {
        const text = u.innerText.toLowerCase();
        u.style.display = text.includes(q) ? '' : 'none';
      });
    };
  });
})();
