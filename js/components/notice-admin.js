// 공지사항 작성/수정/삭제(관리자만)
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if(window.userService.user?.role !== 'admin') return;
    let panel = document.createElement('div');
    panel.id = 'notice-admin-panel';
    panel.style = 'background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:2rem 1.5rem;margin:2rem auto;max-width:480px;';
    panel.innerHTML = `
      <h2>공지사항 관리</h2>
      <input id="notice-title" type="text" placeholder="제목" style="margin-bottom:0.7rem;" />
      <textarea id="notice-content" placeholder="내용" style="min-height:80px;margin-bottom:0.7rem;"></textarea>
      <button id="notice-add">공지 등록</button>
      <div id="notice-admin-msg" style="margin-top:1rem;color:#e57373;"></div>
      <div id="notice-list"></div>
    `;
    document.body.appendChild(panel);
    // 기존 공지 목록 표시
    async function renderList() {
      const notices = await window.dataManager.getNotices();
      const list = panel.querySelector('#notice-list');
      list.innerHTML = notices.map(n => `<div style='margin:0.5rem 0;'><b>${n.title}</b> - ${n.content} <button data-id='${n.id}' class='notice-del'>삭제</button></div>`).join('');
      list.querySelectorAll('.notice-del').forEach(btn => {
        btn.onclick = async () => {
          await window.supabaseClient.supabase.from('notices').delete().eq('id', btn.dataset.id);
          renderList();
        };
      });
    }
    renderList();
    // 공지 등록
    panel.querySelector('#notice-add').onclick = async () => {
      const title = panel.querySelector('#notice-title').value;
      const content = panel.querySelector('#notice-content').value;
      if(!title||!content) return;
      await window.supabaseClient.supabase.from('notices').insert({title,content});
      panel.querySelector('#notice-title').value = '';
      panel.querySelector('#notice-content').value = '';
      panel.querySelector('#notice-admin-msg').style.color = '#4caf50';
      panel.querySelector('#notice-admin-msg').innerText = '등록 완료';
      renderList();
    };
  });
})();
