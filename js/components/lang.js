// 다국어 UI/사용자별 언어 설정
window.langs = {
  ko: {
    login: '로그인', name: '이름', email: '이메일', password: '비밀번호', role: '역할', language: '언어', send: '전송',
    profile: '기본 정보 입력', save: '저장', success: '성공', fail: '실패',
    msg_send_success: '메시지 전송 성공', msg_send_fail: '메시지 전송 실패',
    participants: '참가자 목록', interpreter_panel: '통역가 메시지 패널',
  },
  en: {
    login: 'Login', name: 'Name', email: 'Email', password: 'Password', role: 'Role', language: 'Language', send: 'Send',
    profile: 'Profile Info', save: 'Save', success: 'Success', fail: 'Fail',
    msg_send_success: 'Message sent', msg_send_fail: 'Send failed',
    participants: 'Participants', interpreter_panel: 'Interpreter Panel',
  },
  ja: {
    login: 'ログイン', name: '名前', email: 'メール', password: 'パスワード', role: '役割', language: '言語', send: '送信',
    profile: '基本情報入力', save: '保存', success: '成功', fail: '失敗',
    msg_send_success: '送信成功', msg_send_fail: '送信失敗',
    participants: '参加者リスト', interpreter_panel: '通訳者パネル',
  },
  zh: {
    login: '登录', name: '姓名', email: '邮箱', password: '密码', role: '角色', language: '语言', send: '发送',
    profile: '基本信息输入', save: '保存', success: '成功', fail: '失败',
    msg_send_success: '发送成功', msg_send_fail: '发送失败',
    participants: '参与者列表', interpreter_panel: '口译员面板',
  }
};
window.t = function(key) {
  const lang = window.userService?.user?.language || window.APP_CONFIG.DEFAULT_LANGUAGE;
  return (window.langs[lang] && window.langs[lang][key]) || window.langs.ko[key] || key;
};
