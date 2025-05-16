// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 임시 사용자 생성
router.post('/', userController.createUser);

// 사용자 정보 가져오기
router.get('/:userId', userController.getUser);

// 사용자 선호 언어 업데이트
router.patch('/:userId/language', userController.updateUserLanguage);

module.exports = router;