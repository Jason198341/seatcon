// 관리자/스태프만 초대코드 생성 및 참가자 초대
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    if(!['admin','staff'].includes(window.userService.user?.role)) return;
    const panel = document.createElement('div');
    panel.id = 'invite-panel';
    panel.style = 'background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:1.2rem 1.5rem;margin:2rem auto;max-width:420px;';
    panel.innerHTML = `
      <h2>참가자 초대</h2>
      <input id="invite-role" type="text" placeholder="역할(예: attendee)" value="attendee" style="margin-bottom:0.7rem;" />
      <button id="invite-generate">초대코드 생성</button>
      <div id="invite-code" style="margin-top:1rem;font-weight:bold;"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('#invite-generate').onclick = async () => {
      const role = panel.querySelector('#invite-role').value || 'attendee';
      // 초대코드(랜덤+역할)
      const code = Math.random().toString(36).slice(2,8) + '-' + role;
      // DB에 저장(초대코드 테이블 필요)
      await window.supabaseClient.supabase.from('invites').insert({code,role,used:false});
      panel.querySelector('#invite-code').innerText = '초대코드: ' + code;
    };
  });
})();
