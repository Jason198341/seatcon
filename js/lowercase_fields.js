// main.js - 열 이름 소문자 버전 (일부 수정)

// 메시지 전송 함수 (수정 버전)
async function sendMessage() {
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  try {
    debug('메시지 전송 중...', message);
    
    // 공지사항 여부 확인 (관리자만 가능)
    const isAnnouncement = currentUser.id === ADMIN_ID && message.startsWith('/공지 ');
    
    // 메시지 객체 생성 (소문자 필드 이름 사용)
    const messageObj = {
      room_id: currentRoom,
      user_id: currentUser.id,
      username: currentUser.username,
      message: isAnnouncement ? message.substring(4) : message,
      language: currentUser.language,
      created_at: new Date().toISOString(),
      isannouncement: isAnnouncement, // 소문자로 변경
      reply_to: replyingToMessage ? {
        id: replyingToMessage.id,
        username: replyingToMessage.username,
        message: replyingToMessage.message
      } : null
    };
    
    // Supabase에 메시지 저장
    const { data, error } = await supabase
      .from('messages')
      .insert(messageObj)
      .select();
    
    if (error) {
      debug('메시지 저장 오류:', error);
      debug('오류 메시지:', error.message);
      debug('오류 세부정보:', error.details);
      throw error;
    }
    
    debug('메시지 저장 완료:', data);
    
    // 내가 보낸 메시지 표시
    displayMessage(data[0]);
    
    // 공지사항이면 공지사항 영역에 추가
    if (isAnnouncement) {
      addAnnouncement(data[0]);
    }
    
    // 입력창 초기화
    messageInput.value = '';
    
    // 답장 모드 취소
    if (replyingToMessage) {
      replyPopover.classList.add('hidden');
      replyingToMessage = null;
    }
    
    // 스크롤을 최하단으로
    scrollToBottom();
    
    // 마지막 메시지 타임스탬프 업데이트
    lastMessageTimestamp = data[0].created_at;
  } catch (error) {
    console.error('Error sending message:', error);
    
    // 오류 발생 시 로컬에만 저장
    debug('로컬에 메시지 저장');
    
    // 메시지 객체 생성
    const localMessage = {
      id: `local_${Date.now()}`,
      room_id: currentRoom,
      user_id: currentUser.id,
      username: currentUser.username,
      message: message,
      language: currentUser.language,
      created_at: new Date().toISOString(),
      isannouncement: false // 소문자로 변경
    };
    
    // 답장 정보 추가
    if (replyingToMessage) {
      localMessage.reply_to = {
        id: replyingToMessage.id,
        username: replyingToMessage.username,
        message: replyingToMessage.message
      };
      
      // 답장 모드 취소
      replyPopover.classList.add('hidden');
      replyingToMessage = null;
    }
    
    // 로컬 메시지 저장
    const messages = getLocalMessages(currentRoom);
    messages.push(localMessage);
    saveLocalMessages(currentRoom, messages);
    
    // 메시지 표시
    displayMessage(localMessage);
    
    // 입력창 초기화
    messageInput.value = '';
    
    // 스크롤을 최하단으로
    scrollToBottom();
    
    // 사용자에게 알림
    showStatus('메시지 전송 중 오류가 발생했습니다. 로컬에만 저장됩니다.', true);
  }
}

// 공지사항 가져오기 (수정 버전)
async function fetchAnnouncements(roomId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', ADMIN_ID)
      .eq('isannouncement', true) // 소문자로 변경
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      debug('공지사항 오류:', error);
      debug('오류 메시지:', error.message);
      throw error;
    }
    
    if (data && data.length > 0) {
      addAnnouncement(data[0]);
    }
  } catch (error) {
    console.error('공지사항 가져오기 오류:', error);
  }
}