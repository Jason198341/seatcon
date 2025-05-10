import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getChatRooms } from '../../services/chatService';
import { useAuth } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 채팅방 목록 컴포넌트
 */
const ChatRoomList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // 채팅방 데이터 로딩
  useEffect(() => {
    const loadChatRooms = async () => {
      setLoading(true);
      try {
        const { data, error } = await getChatRooms();
        if (error) throw error;
        setChatRooms(data);
      } catch (err) {
        console.error('채팅방 목록 로드 오류:', err);
        setError('채팅방 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatRooms();
  }, []);
  
  // 검색어에 따라 채팅방 필터링
  const filteredChatRooms = chatRooms.filter(room => {
    const term = searchTerm.toLowerCase();
    return room.name.toLowerCase().includes(term) || 
      (room.description && room.description.toLowerCase().includes(term));
  });
  
  return (
    <div className="space-y-6">
      {/* 검색 필드 */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder={t('채팅방 검색...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* 관리자 버튼 */}
      {user?.profile?.role === 'admin' && (
        <div className="flex justify-end">
          <Link
            to="/admin/chat-rooms/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('새 채팅방 만들기')}
          </Link>
        </div>
      )}
      
      {/* 로딩 및 에러 */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">{t('채팅방 목록을 불러오는 중...')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{t(error)}</span>
        </div>
      )}
      
      {/* 채팅방 목록 */}
      {!loading && !error && filteredChatRooms.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {searchTerm ? t('검색 결과가 없습니다.') : t('표시할 채팅방이 없습니다.')}
          </p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-1">{t('다른 검색어를 시도해 보세요.')}</p>
          )}
        </div>
      )}
      
      {!loading && !error && filteredChatRooms.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredChatRooms.map((room) => (
              <li key={room.id} className="hover:bg-gray-50">
                <Link to={`/chat/rooms/${room.id}`} className="block">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-indigo-600">
                            {room.name}
                          </p>
                          {room.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {room.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>
                          {format(new Date(room.created_at), 'yyyy년 M월 d일', { locale: ko })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChatRoomList;