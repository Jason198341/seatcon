// src/services/chatService.js
const { translateText } = require('./translationService');

// 메모리에 메시지 저장
const messages = {};

/**
 * 채팅 메시지를 저장합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 ID
 * @param {string} username - 사용자 이름
 * @param {string} message - 메시지 내용
 * @param {string} language - 메시지 언어
 * @returns {Promise<Object>} 저장된 메시지
 */
async function saveMessage(roomId, userId, username, message, language) {
  if (!messages[roomId]) {
    messages[roomId] = [];
  }
  
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    room_id: roomId,
    user_id: userId,
    username,
    message,
    language,
    created_at: new Date().toISOString()
  };
  
  messages[roomId].push(newMessage);
  
  return newMessage;
}

/**
 * 특정 채팅방의 최근 메시지를 가져옵니다.
 * @param {string} roomId - 채팅방 ID
 * @param {number} limit - 가져올 메시지 수 (기본값: 50)
 * @returns {Promise<Array>} 메시지 목록
 */
async function getMessages(roomId, limit = 50) {
  if (!messages[roomId]) {
    messages[roomId] = [];
  }
  
  return messages[roomId].slice(-limit);
}

/**
 * 메시지를 대상 언어로 번역합니다.
 * @param {Object} message - 번역할 메시지 객체
 * @param {string} targetLanguage - 번역 대상 언어 코드
 * @returns {Promise<Object>} 번역된 메시지 객체
 */
async function translateMessage(message, targetLanguage) {
  if (message.language === targetLanguage) {
    return { ...message, translatedMessage: message.message };
  }

  try {
    const translatedText = await translateText(message.message, targetLanguage);
    return { ...message, translatedMessage: translatedText };
  } catch (error) {
    console.error('Error translating message:', error);
    return { ...message, translatedMessage: message.message };
  }
}

/**
 * 메시지 ID로 메시지를 가져옵니다.
 * @param {string} messageId - 메시지 ID
 * @returns {Promise<Object>} 메시지 객체
 */
async function getMessageById(messageId) {
  for (const roomId in messages) {
    const message = messages[roomId].find(m => m.id === messageId);
    if (message) {
      return message;
    }
  }
  
  throw new Error('메시지를 찾을 수 없습니다.');
}

module.exports = {
  saveMessage,
  getMessages,
  translateMessage,
  getMessageById
};