/**
 * app-i18n.js
 * Global SeatCon 2025 Conference Chat
 * 다국어 처리 모듈
 */

// APP 객체가 정의되어 있지 않으면 생성
const APP = window.APP || {};

// 다국어 처리 모듈
APP.i18n = (() => {
    // 기본 설정
    const supportedLanguages = [];
    let dictionary = null;
    let currentLanguage = 'en';
    
    // 번역 함수
    const translate = function(key) {
        if (!dictionary) return key;
        
        const langDict = dictionary[currentLanguage] || dictionary['en'];
        if (!langDict) return key;
        
        return langDict[key] || key;
    };
    
    // 언어 사전 로드
    const loadLanguageDictionary = async function(language) {
        // 기본 언어는 영어
        language = language || 'en';
        currentLanguage = language;
        
        try {
            // 언어 사전 설정
            dictionary = {
                'ko': {
                    'app.title': 'Global SeatCon 2025',
                    'login.subtitle': '컨퍼런스 채팅',
                    'login.username': '사용자 이름',
                    'login.username.placeholder': '이름을 입력하세요',
                    'login.language': '선호 언어',
                    'login.chatroom': '채팅방 선택',
                    'login.chatroom.select': '채팅방을 선택하세요',
                    'login.chatroom.loading': '로딩 중...',
                    'login.accessCode': '접근 코드',
                    'login.accessCode.placeholder': '비공개 채팅방 코드 입력',
                    'login.button': '입장하기',
                    'login.error.username': '사용자 이름을 입력해주세요.',
                    'login.error.room': '채팅방을 선택해주세요.',
                    'login.error.accessCode': '접근 코드가 올바르지 않습니다.',
                    'login.error.general': '로그인 중 오류가 발생했습니다.',
                    'languages.korean': '한국어',
                    'languages.english': '영어',
                    'languages.japanese': '일본어',
                    'languages.chinese': '중국어',
                    'chat.language': '언어',
                    'chat.users': '사용자 목록',
                    'chat.noUsers': '사용자 없음',
                    'chat.messageInput.placeholder': '메시지를 입력하세요...',
                    'chat.sending': '전송 중...',
                    'chat.syncing': '동기화 중...',
                    'chat.sendFailed': '전송 실패',
                    'chat.translated': '번역됨',
                    'chat.showOriginal': '원본 보기',
                    'chat.originalMessage': '원본 메시지',
                    'chat.reply': '답장',
                    'chat.noMessages': '채팅방에 메시지가 없습니다. 대화를 시작해보세요!',
                    'chat.loading': '로딩 중...',
                    'connection.online': '온라인',
                    'connection.offline': '오프라인',
                    'connection.connecting': '연결 중...',
                    'connection.syncing': '동기화 중...',
                    'modal.changeLanguage.title': '언어 변경',
                    'modal.changeLanguage.selectLanguage': '선호 언어 선택',
                    'modal.save': '저장',
                    'modal.cancel': '취소',
                    'error.enterRoom': '채팅방 입장에 실패했습니다.',
                    'error.sendMessage': '메시지 전송에 실패했습니다.',
                    'error.loadRooms': '채팅방 목록을 불러오는데 실패했습니다.',
                    'error.servicesNotReady': '서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.',
                    'error.logout': '로그아웃 중 오류가 발생했습니다.',
                    'error.changeLanguage': '언어 변경에 실패했습니다.',
                    'error.initFailed': '애플리케이션 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.'
                },
                'en': {
                    'app.title': 'Global SeatCon 2025',
                    'login.subtitle': 'Conference Chat',
                    'login.username': 'Username',
                    'login.username.placeholder': 'Enter your name',
                    'login.language': 'Preferred Language',
                    'login.chatroom': 'Select Chatroom',
                    'login.chatroom.select': 'Select a chat room',
                    'login.chatroom.loading': 'Loading...',
                    'login.accessCode': 'Access Code',
                    'login.accessCode.placeholder': 'Enter private chatroom code',
                    'login.button': 'Enter',
                    'login.error.username': 'Please enter your username.',
                    'login.error.room': 'Please select a chat room.',
                    'login.error.accessCode': 'The access code is incorrect.',
                    'login.error.general': 'An error occurred during login.',
                    'languages.korean': 'Korean',
                    'languages.english': 'English',
                    'languages.japanese': 'Japanese',
                    'languages.chinese': 'Chinese',
                    'chat.language': 'Language',
                    'chat.users': 'User List',
                    'chat.noUsers': 'No users',
                    'chat.messageInput.placeholder': 'Type your message...',
                    'chat.sending': 'Sending...',
                    'chat.syncing': 'Syncing...',
                    'chat.sendFailed': 'Send Failed',
                    'chat.translated': 'Translated',
                    'chat.showOriginal': 'Show Original',
                    'chat.originalMessage': 'Original message',
                    'chat.reply': 'Reply',
                    'chat.noMessages': 'No messages in this chat room yet. Start the conversation!',
                    'chat.loading': 'Loading...',
                    'connection.online': 'Online',
                    'connection.offline': 'Offline',
                    'connection.connecting': 'Connecting...',
                    'connection.syncing': 'Syncing...',
                    'modal.changeLanguage.title': 'Change Language',
                    'modal.changeLanguage.selectLanguage': 'Select Preferred Language',
                    'modal.save': 'Save',
                    'modal.cancel': 'Cancel',
                    'error.enterRoom': 'Failed to enter the chat room.',
                    'error.sendMessage': 'Failed to send the message.',
                    'error.loadRooms': 'Failed to load the list of chat rooms.',
                    'error.servicesNotReady': 'Services are being prepared. Please try again in a moment.',
                    'error.logout': 'An error occurred during logout.',
                    'error.changeLanguage': 'Failed to change the language.',
                    'error.initFailed': 'An error occurred during application initialization. Please refresh the page.'
                },
                'ja': {
                    'app.title': 'Global SeatCon 2025',
                    'login.subtitle': 'カンファレンスチャット',
                    'login.username': 'ユーザー名',
                    'login.username.placeholder': '名前を入力してください',
                    'login.language': '希望言語',
                    'login.chatroom': 'チャットルーム選択',
                    'login.chatroom.select': 'チャットルームを選択',
                    'login.chatroom.loading': '読み込み中...',
                    'login.accessCode': 'アクセスコード',
                    'login.accessCode.placeholder': 'プライベートルームコードを入力',
                    'login.button': '入場',
                    'login.error.username': 'ユーザー名を入力してください。',
                    'login.error.room': 'チャットルームを選択してください。',
                    'login.error.accessCode': 'アクセスコードが正しくありません。',
                    'login.error.general': 'ログイン中にエラーが発生しました。',
                    'languages.korean': '韓国語',
                    'languages.english': '英語',
                    'languages.japanese': '日本語',
                    'languages.chinese': '中国語',
                    'chat.language': '言語',
                    'chat.users': 'ユーザーリスト',
                    'chat.noUsers': 'ユーザーがいません',
                    'chat.messageInput.placeholder': 'メッセージを入力...',
                    'chat.sending': '送信中...',
                    'chat.syncing': '同期中...',
                    'chat.sendFailed': '送信失敗',
                    'chat.translated': '翻訳済み',
                    'chat.showOriginal': '原文を表示',
                    'chat.originalMessage': '原文メッセージ',
                    'chat.reply': '返信',
                    'chat.noMessages': 'このチャットルームにはまだメッセージがありません。会話を始めましょう！',
                    'chat.loading': '読み込み中...',
                    'connection.online': 'オンライン',
                    'connection.offline': 'オフライン',
                    'connection.connecting': '接続中...',
                    'connection.syncing': '同期中...',
                    'modal.changeLanguage.title': '言語変更',
                    'modal.changeLanguage.selectLanguage': '希望言語を選択',
                    'modal.save': '保存',
                    'modal.cancel': 'キャンセル',
                    'error.enterRoom': 'チャットルームへの入室に失敗しました。',
                    'error.sendMessage': 'メッセージの送信に失敗しました。',
                    'error.loadRooms': 'チャットルーム一覧の読み込みに失敗しました。',
                    'error.servicesNotReady': 'サービスの準備中です。しばらくしてからもう一度お試しください。',
                    'error.logout': 'ログアウト中にエラーが発生しました。',
                    'error.changeLanguage': '言語変更に失敗しました。',
                    'error.initFailed': 'アプリケーションの初期化中にエラーが発生しました。ページを更新してください。'
                },
                'zh': {
                    'app.title': 'Global SeatCon 2025',
                    'login.subtitle': '会议聊天',
                    'login.username': '用户名',
                    'login.username.placeholder': '请输入姓名',
                    'login.language': '首选语言',
                    'login.chatroom': '选择聊天室',
                    'login.chatroom.select': '选择聊天室',
                    'login.chatroom.loading': '加载中...',
                    'login.accessCode': '访问代码',
                    'login.accessCode.placeholder': '输入私人聊天室代码',
                    'login.button': '进入',
                    'login.error.username': '请输入用户名。',
                    'login.error.room': '请选择聊天室。',
                    'login.error.accessCode': '访问代码不正确。',
                    'login.error.general': '登录时发生错误。',
                    'languages.korean': '韩语',
                    'languages.english': '英语',
                    'languages.japanese': '日语',
                    'languages.chinese': '中文',
                    'chat.language': '语言',
                    'chat.users': '用户列表',
                    'chat.noUsers': '没有用户',
                    'chat.messageInput.placeholder': '输入消息...',
                    'chat.sending': '发送中...',
                    'chat.syncing': '同步中...',
                    'chat.sendFailed': '发送失败',
                    'chat.translated': '已翻译',
                    'chat.showOriginal': '显示原文',
                    'chat.originalMessage': '原始消息',
                    'chat.reply': '回复',
                    'chat.noMessages': '此聊天室还没有消息。开始对话吧！',
                    'chat.loading': '加载中...',
                    'connection.online': '在线',
                    'connection.offline': '离线',
                    'connection.connecting': '连接中...',
                    'connection.syncing': '同步中...',
                    'modal.changeLanguage.title': '更改语言',
                    'modal.changeLanguage.selectLanguage': '选择首选语言',
                    'modal.save': '保存',
                    'modal.cancel': '取消',
                    'error.enterRoom': '进入聊天室失败。',
                    'error.sendMessage': '发送消息失败。',
                    'error.loadRooms': '加载聊天室列表失败。',
                    'error.servicesNotReady': '服务正在准备中。请稍后再试。',
                    'error.logout': '登出过程中发生错误。',
                    'error.changeLanguage': '更改语言失败。',
                    'error.initFailed': '应用程序初始化过程中发生错误。请刷新页面。'
                }
            };
            
            // 언어 사전 적용
            applyLanguageDictionary(language);
            
            return true;
        } catch (error) {
            console.error('언어 사전 로드 실패:', error);
            return false;
        }
    };
    
    // 언어 사전 적용
    const applyLanguageDictionary = function(language) {
        // 해당 언어의 사전이 없으면 영어로 대체
        if (!dictionary) return;
        
        const langDict = dictionary[language] || dictionary['en'];
        if (!langDict) return;
        
        // 현재 언어 설정
        currentLanguage = language;
        
        // 모든 i18n 요소에 적용
        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.dataset.i18n;
            if (langDict[key]) {
                element.textContent = langDict[key];
            }
        });
        
        // placeholder 속성이 있는 요소에 적용
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            if (langDict[key]) {
                element.placeholder = langDict[key];
            }
        });
        
        // 상태 표시에 적용
        if (APP.chat && typeof APP.chat.updateConnectionStatus === 'function') {
            APP.chat.updateConnectionStatus();
        }
    };
    
    // 언어 모달 열기
    const openLanguageModal = function() {
        // 현재 선택된 언어 설정
        if (APP.elements.modalLanguageSelect) {
            APP.elements.modalLanguageSelect.value = APP.state.preferredLanguage;
        }
        
        // 모달 표시
        if (APP.elements.languageModal) {
            APP.elements.languageModal.classList.remove('hidden');
        }
    };
    
    // 언어 변경 저장
    const saveLanguage = async function() {
        if (!APP.elements.modalLanguageSelect) return;
        
        const newLanguage = APP.elements.modalLanguageSelect.value;
        
        try {
            // 로딩 표시
            APP.ui.showLoading(true);
            
            // 로그인 상태인 경우 사용자 정보 업데이트
            if (APP.state.isLoggedIn && APP.state.servicesReady) {
                await userService.changePreferredLanguage(newLanguage);
            }
            
            // 선호 언어 변경
            APP.state.preferredLanguage = newLanguage;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('preferredLanguage', newLanguage);
            
            // 언어 사전 로드 및 적용
            await loadLanguageDictionary(newLanguage);
            
            // 언어 표시 업데이트
            updateLanguageDisplay();
            
            // 현재 메시지 번역 갱신
            if (APP.state.isLoggedIn && APP.state.currentRoomId && APP.state.servicesReady) {
                // 메시지 다시 불러오기
                await chatService.loadMessages();
            }
            
            // 모달 닫기
            APP.ui.closeModals();
        } catch (error) {
            console.error('언어 변경 실패:', error);
            APP.ui.showError(translate('error.changeLanguage') || 'Failed to change the language.');
        } finally {
            // 로딩 종료
            APP.ui.showLoading(false);
        }
    };
    
    // 언어 표시 업데이트
    const updateLanguageDisplay = function() {
        if (!APP.state.servicesReady || !APP.elements.currentLanguage) return;
        
        const languageName = translationService.getLanguageName(APP.state.preferredLanguage);
        APP.elements.currentLanguage.textContent = languageName;
    };
    
    // 공개 API
    return {
        translate,
        loadLanguageDictionary,
        applyLanguageDictionary,
        openLanguageModal,
        saveLanguage,
        updateLanguageDisplay,
        supportedLanguages,
        currentLanguage
    };
})();

// 글로벌 객체로 노출
window.APP = APP;
