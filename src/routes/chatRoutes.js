// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 채팅방의 메시지 목록 가져오기
router.get('/rooms/:roomId/messages', chatController.getMessages);

// 메시지 번역
router.post('/messages/translate', chatController.translateMessage);

// 지원 언어 목록 가져오기
router.get('/languages', chatController.getSupportedLanguages);

module.exports = router;