// src/controllers/chatController.js
const chatService = require('../services/chatService');
const translationService = require('../services/translationService');

/**
 * 최근 채팅 메시지 목록을 가져옵니다.
 */
async function getMessages(req, res) {
  try {
    const { roomId } = req.params;
    const { limit } = req.query;
    
    const messages = await chatService.getMessages(roomId, limit ? parseInt(limit) : 50);
    
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 메시지를 번역합니다.
 */
async function translateMessage(req, res) {
  try {
    const { messageId, targetLanguage } = req.body;
    
    // 메시지 조회
    const message = await chatService.getMessageById(messageId);
    
    const translatedMessage = await chatService.translateMessage(message, targetLanguage);
    
    res.status(200).json({ success: true, data: translatedMessage });
  } catch (error) {
    console.error('Error translating message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 지원 언어 목록을 가져옵니다.
 */
async function getSupportedLanguages(req, res) {
  try {
    const languages = await translationService.getSupportedLanguages();
    res.status(200).json({ success: true, data: languages });
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getMessages,
  translateMessage,
  getSupportedLanguages,
};