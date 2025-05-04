// 앱 초기화 및 서비스 연결
(async function() {
  await window.supabaseClient.init();
  await window.userService.loadUser();
  // 온라인 상태 갱신(2분마다)
  setInterval(() => {
    if(window.userService.user?.id) window.onlineStatus.setOnline(window.userService.user.id);
  }, 60000);
  // 컴포넌트 초기화 (auth.js, sidebar.js, chat.js 등은 즉시 실행 IIFE)
})();
