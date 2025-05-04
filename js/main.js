// 앱 초기화 및 서비스 연결
(async function() {
  await window.supabaseClient.init();
  await window.userService.loadUser();
  // 컴포넌트 초기화 (auth.js, sidebar.js, chat.js 등은 즉시 실행 IIFE)
})();
