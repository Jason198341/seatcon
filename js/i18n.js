// i18n.js - 다국어 지원 시스템
document.addEventListener('DOMContentLoaded', () => {
  // 번역 데이터
  const translations = {
    en: {
      // 로그인 화면
      "login.subtitle": "Connect Globally, Chat Locally",
      "login.join": "Join Chat",
      "login.username": "Username",
      "login.language": "Preferred Language",
      "login.roomId": "Chat Room ID",
      "login.join_button": "Join Chat",
      
      // 채팅 화면
      "chat.language": "Language:",
      "chat.message_placeholder": "Type a message...",
      "chat.send": "Send",
      "chat.refresh": "Refresh",
      "chat.logout": "Logout",
      "chat.replying_to": "Replying to",
      
      // 상태 메시지
      "status.connected": "Connected to real-time chat",
      "status.connection_error": "Connection error. Using local mode.",
      "status.new_messages": "{count} new messages",
      "status.no_new_messages": "No new messages",
      
      // 시스템 메시지
      "system.user_joined": "{username} has joined",
      "system.user_left": "{username} has left",
      
      // 메시지 관련
      "message.admin": "ADMIN",
      "message.announcement": "Announcement",
      "message.translated": "Translating...",
      "message.translation_failed": "Translation failed",
      
      // 공지사항
      "announcement.title": "Announcement",
      
      // 버튼 및 컨트롤
      "button.cancel": "Cancel",
      "button.reply": "Reply"
    },
    ko: {
      // 로그인 화면
      "login.subtitle": "글로벌하게 연결하고, 로컬하게 대화하세요",
      "login.join": "채팅 참가",
      "login.username": "사용자 이름",
      "login.language": "선호 언어",
      "login.roomId": "채팅방 ID",
      "login.join_button": "참가하기",
      
      // 채팅 화면
      "chat.language": "언어:",
      "chat.message_placeholder": "메시지를 입력하세요...",
      "chat.send": "전송",
      "chat.refresh": "새로고침",
      "chat.logout": "로그아웃",
      "chat.replying_to": "회신 대상:",
      
      // 상태 메시지
      "status.connected": "실시간 채팅에 연결되었습니다",
      "status.connection_error": "연결 오류. 로컬 모드로 작동합니다.",
      "status.new_messages": "새 메시지 {count}개",
      "status.no_new_messages": "새 메시지가 없습니다",
      
      // 시스템 메시지
      "system.user_joined": "{username}님이 입장했습니다",
      "system.user_left": "{username}님이 퇴장했습니다",
      
      // 메시지 관련
      "message.admin": "관리자",
      "message.announcement": "공지사항",
      "message.translated": "번역 중...",
      "message.translation_failed": "번역 실패",
      
      // 공지사항
      "announcement.title": "공지사항",
      
      // 버튼 및 컨트롤
      "button.cancel": "취소",
      "button.reply": "답장"
    },
    ja: {
      // 로그인 화면
      "login.subtitle": "グローバルにつながり、ローカルにチャット",
      "login.join": "チャットに参加",
      "login.username": "ユーザー名",
      "login.language": "優先言語",
      "login.roomId": "チャットルームID",
      "login.join_button": "参加する",
      
      // 채팅 화면
      "chat.language": "言語:",
      "chat.message_placeholder": "メッセージを入力...",
      "chat.send": "送信",
      "chat.refresh": "更新",
      "chat.logout": "ログアウト",
      "chat.replying_to": "返信先:",
      
      // 상태 메시지
      "status.connected": "リアルタイムチャットに接続しました",
      "status.connection_error": "接続エラー。ローカルモードで動作します。",
      "status.new_messages": "新しいメッセージ {count}件",
      "status.no_new_messages": "新しいメッセージはありません",
      
      // 시스템 메시지
      "system.user_joined": "{username}さんが入室しました",
      "system.user_left": "{username}さんが退室しました",
      
      // 메시지 관련
      "message.admin": "管理者",
      "message.announcement": "お知らせ",
      "message.translated": "翻訳中...",
      "message.translation_failed": "翻訳失敗",
      
      // 공지사항
      "announcement.title": "お知らせ",
      
      // 버튼 및 컨트롤
      "button.cancel": "キャンセル",
      "button.reply": "返信"
    },
    zh: {
      // 로그인 화면
      "login.subtitle": "全球连接，本地聊天",
      "login.join": "加入聊天",
      "login.username": "用户名",
      "login.language": "首选语言",
      "login.roomId": "聊天室ID",
      "login.join_button": "加入",
      
      // 채팅 화면
      "chat.language": "语言:",
      "chat.message_placeholder": "输入消息...",
      "chat.send": "发送",
      "chat.refresh": "刷新",
      "chat.logout": "登出",
      "chat.replying_to": "回复给:",
      
      // 상태 메시지
      "status.connected": "已连接到实时聊天",
      "status.connection_error": "连接错误。使用本地模式。",
      "status.new_messages": "{count}条新消息",
      "status.no_new_messages": "没有新消息",
      
      // 시스템 메시지
      "system.user_joined": "{username}已加入",
      "system.user_left": "{username}已离开",
      
      // 메시지 관련
      "message.admin": "管理员",
      "message.announcement": "公告",
      "message.translated": "翻译中...",
      "message.translation_failed": "翻译失败",
      
      // 공지사항
      "announcement.title": "公告",
      
      // 버튼 및 컨트롤
      "button.cancel": "取消",
      "button.reply": "回复"
    }
  };
  
  // 현재 언어 설정
  let currentLanguage = 'en';
  
  // 텍스트 번역 함수
  function translate(key, params = {}) {
    // 현재 언어에 해당하는 번역 데이터 가져오기
    const languageData = translations[currentLanguage];
    
    // 키에 해당하는 번역 텍스트 가져오기
    let text = languageData[key];
    
    // 번역 텍스트가 없으면 영어 버전 사용
    if (!text && currentLanguage !== 'en') {
      text = translations.en[key];
    }
    
    // 번역 텍스트가 여전히 없으면 키 그대로 반환
    if (!text) {
      return key;
    }
    
    // 매개변수 치환
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, value);
    }
    
    return text;
  }
  
  // 페이지의 모든 텍스트 업데이트
  function updatePageTexts() {
    // data-i18n 속성이 있는 모든 요소 찾기
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = translate(key);
    });
    
    // placeholder 번역
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = translate(key);
    });
    
    // 타이틀 번역
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = translate(key);
    });
  }
  
  // 언어 변경 함수
  function changeLanguage(language) {
    if (translations[language]) {
      currentLanguage = language;
      updatePageTexts();
      
      // 이벤트 발생
      const event = new CustomEvent('languageChanged', { detail: { language } });
      document.dispatchEvent(event);
    }
  }
  
  // 언어 선택 이벤트 리스너 설정
  document.querySelectorAll('.language-selector').forEach(select => {
    select.addEventListener('change', (e) => {
      changeLanguage(e.target.value);
    });
  });
  
  // 초기 언어 설정 (저장된 설정이 있으면 사용)
  const savedLanguage = localStorage.getItem('preferred_language');
  if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
    
    // 언어 선택기 업데이트
    document.querySelectorAll('.language-selector').forEach(select => {
      select.value = currentLanguage;
    });
  }
  
  // 초기 텍스트 업데이트
  updatePageTexts();
  
  // 전역으로 사용할 수 있도록 i18n 객체 노출
  window.i18n = {
    translate,
    changeLanguage,
    getCurrentLanguage: () => currentLanguage
  };
});