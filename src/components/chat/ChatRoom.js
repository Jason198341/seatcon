import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  getChatRoomById, 
  getChatMessages, 
  sendMessage, 
  subscribeToChatRoom,
  translateMessage
} from '../../services/chatService';
import { useAuth } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 채팅방 컴포넌트
 */
const ChatRoom = ({ id }) => {
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // 채팅방 정보 로딩
  useEffect(() => {
    const loadChatRoom = async () => {
      setLoading(true);
      try {
        const { data, error } = await getChatRoomById(id);
        if (error) throw error;
        setChatRoom(data);
      } catch (err) {
        console.error('채팅방 정보 로드 오류:', err);
        setError('채팅방 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatRoom();
  }, [id]);
  
  // 메시지 로딩
  useEffect(() => {
    if (!chatRoom) return;
    
    const loadMessages = async () => {
      setLoadingMore(true);
      try {
        const { data, error } = await getChatMessages(id, {
          limit: 20,
          offset: page * 20
        });
        
        if (error) throw error;
        
        if (data.length < 20) {
          setHasMore(false);
        }
        
        if (page === 0) {
          setMessages(data);
        } else {
          setMessages(prev => [...data, ...prev]);
        }
      } catch (err) {
        console.error('메시지 로드 오류:', err);
        setError('메시지를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingMore(false);
      }
    };
    
    loadMessages();
  }, [id, chatRoom, page]);
  
  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatRoom) return;
    
    const subscription = subscribeToChatRoom(id, async (newMsg) => {
      try {
        // 메시지 번역 (필요한 경우)
        let translatedText = null;
        if (newMsg.original_language !== currentLanguage) {
          const { translatedText: translated, error: translationError } = 
            await translateMessage(newMsg.message, newMsg.original_language, currentLanguage);
          
          if (!translationError) {
            translatedText = translated;
          }
        }
        
        // 사용자 정보 가져오기
        const { data: userData, error: userError } = await getChatRoomById(id);
        if (userError) throw userError;
        
        // 답장 메시지 가져오기 (존재하는 경우)
        let replyMessage = null;
        if (newMsg.reply_to) {
          // 여기에서 답장 메시지 정보를 가져옵니다.
          // 실제 구현에서는 API 호출을 통해 가져와야 합니다.
        }
        
        // 메시지 목록에 추가
        setMessages(prev => [...prev, {
          ...newMsg,
          translatedText,
          users: userData?.users,
          reply_message: replyMessage
        }]);
      } catch (err) {
        console.error('메시지 처리 오류:', err);
      }
    });
    
    // cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, [id, chatRoom, currentLanguage]);
  
  // 메시지 전송 처리
  const handleSendMessage = async (event) => {
    event.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    
    try {
      const messageData = {
        chat_room_id: id,
        user_id: user.id,
        message: newMessage,
        original_language: currentLanguage,
        reply_to: replyTo?.id || null
      };
      
      const { error } = await sendMessage(messageData);
      
      if (error) throw error;
      
      setNewMessage('');
      setReplyTo(null);
    } catch (err) {
      console.error('메시지 전송 오류:', err);
      setError('메시지를 전송하는 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };
  
  // 답장 메시지 설정
  const handleReply = (message) => {
    setReplyTo(message);
  };
  
  // 답장 취소
  const cancelReply = () => {
    setReplyTo(null);
  };
  
  // 더 많은 메시지 로드
  const loadMoreMessages = () => {
    if (loadingMore || !hasMore) return;
    setPage(prev => prev + 1);
  };
  
  // 스크롤 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    if (page === 0) {
      scrollToBottom();
    }
  }, [messages, page]);
  
  // 로딩 중 표시
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">{t('채팅방 정보를 불러오는 중...')}</p>
      </div>
    );
  }
  
  // 에러 표시
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-6" role="alert">
        <span className="block sm:inline">{t(error)}</span>
      </div>
    );
  }
  
  // 채팅방 정보가 없는 경우
  if (!chatRoom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('채팅방 정보를 찾을 수 없습니다.')}</p>
        <Link to="/chat" className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
          <svg className="-ml-1 mr-1 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t('채팅방 목록으로 돌아가기')}
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col h-[calc(100vh-250px)]">
      {/* 헤더 */}
      <div className="bg-indigo-600 px-4 py-4 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-white">
            {chatRoom.name}
          </h3>
          {chatRoom.description && (
            <p className="mt-1 text-sm text-indigo-100 line-clamp-1">
              {chatRoom.description}
            </p>
          )}
        </div>
        
        <Link
          to="/chat"
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t('나가기')}
        </Link>
      </div>
      
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMore && (
          <div className="text-center">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? t('불러오는 중...') : t('이전 메시지 불러오기')}
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">{t('아직 메시지가 없습니다.')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('첫 메시지를 보내보세요!')}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3/4 rounded-lg p-3 ${
                message.user_id === user.id ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                {/* 답장 메시지 표시 */}
                {message.reply_message && (
                  <div className="bg-gray-200 p-2 rounded-md mb-2 border-l-4 border-indigo-300 text-xs text-gray-700">
                    <p className="font-semibold">
                      {message.reply_message.users?.name || t('사용자')}:
                    </p>
                    <p className="line-clamp-2">{message.reply_message.message}</p>
                  </div>
                )}
                
                {/* 발신자 정보 */}
                {message.user_id !== user.id && (
                  <div className="flex items-center mb-1">
                    <div className="h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-800 mr-1">
                      {message.users?.name ? message.users.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      {message.users?.name || t('사용자')}
                    </p>
                  </div>
                )}
                
                {/* 메시지 내용 */}
                <div className="text-sm text-gray-800 whitespace-pre-line">
                  {message.message}
                </div>
                
                {/* 번역된 메시지 */}
                {message.translatedText && message.original_language !== currentLanguage && (
                  <div className="mt-1 text-xs italic text-gray-600 border-t border-gray-200 pt-1">
                    <p className="text-xs text-gray-500">{t('번역됨')}:</p>
                    <p>{message.translatedText}</p>
                  </div>
                )}
                
                {/* 메시지 시간 및 액션 */}
                <div className={`mt-1 flex items-center ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                  <button
                    type="button"
                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
                    onClick={() => handleReply(message)}
                  >
                    {t('답장')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 메시지 입력 폼 */}
      <div className="border-t border-gray-200 p-4">
        {/* 답장 표시 */}
        {replyTo && (
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md mb-2">
            <div className="flex-1 truncate">
              <span className="text-xs font-medium text-gray-700">
                {t('답장')}: {replyTo.users?.name || t('사용자')}
              </span>
              <p className="text-xs text-gray-600 truncate">{replyTo.message}</p>
            </div>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-600"
              onClick={cancelReply}
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder={t('메시지를 입력하세요...')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('전송 중...')}
              </span>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t('전송')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;