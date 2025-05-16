// src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const chatService = require('./services/chatService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API 라우트
app.use('/', routes);

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 소켓.io 설정
io.on('connection', (socket) => {
  console.log('새로운 사용자가 연결되었습니다:', socket.id);

  // 채팅방 참가
  socket.on('join_room', async (data) => {
    const { roomId, userId, username, language } = data;
    socket.join(roomId);
    console.log(`사용자 ${username}(${userId})가 방 ${roomId}에 참가했습니다`);
    
    // 참가 메시지 방송
    io.to(roomId).emit('user_joined', {
      userId,
      username,
      message: `${username}님이 입장했습니다.`
    });
  });

  // 메시지 수신 및 브로드캐스트
  socket.on('send_message', async (data) => {
    try {
      const { roomId, userId, username, message, language } = data;
      
      // 메시지 저장
      const savedMessage = await chatService.saveMessage(
        roomId, 
        userId, 
        username, 
        message, 
        language
      );
      
      // 메시지 브로드캐스트
      io.to(roomId).emit('receive_message', {
        ...savedMessage,
        needsTranslation: true
      });
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: '메시지 처리 중 오류가 발생했습니다.' });
    }
  });
  
  // 메시지 번역 요청
  socket.on('translate_message', async (data) => {
    try {
      const { messageId, targetLanguage } = data;
      
      // 메시지 조회
      const message = await chatService.getMessageById(messageId);
      
      // 메시지 번역
      const translatedMessage = await chatService.translateMessage(
        message, 
        targetLanguage
      );
      
      // 번역된 메시지 전송
      socket.emit('translated_message', translatedMessage);
    } catch (error) {
      console.error('Error translating message:', error);
      socket.emit('error', { message: '메시지 번역 중 오류가 발생했습니다.' });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자가 연결을 해제했습니다:', socket.id);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});