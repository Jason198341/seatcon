import React from 'react';
import { ChatRoomList } from '../../components/chat';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 채팅방 목록 페이지
 */
const ChatRoomListPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('채팅방')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('컨퍼런스 참가자들과 채팅으로 소통하세요.')}
          </p>
        </div>
      </div>
      
      <ChatRoomList />
    </div>
  );
};

export default ChatRoomListPage;