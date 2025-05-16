// src/controllers/userController.js
const userService = require('../services/userService');

/**
 * 임시 사용자를 생성합니다.
 */
async function createUser(req, res) {
  try {
    const { username, preferredLanguage } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: '사용자 이름은 필수입니다.' });
    }
    
    const user = await userService.createTemporaryUser(
      username, 
      preferredLanguage || 'ko'
    );
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 사용자 정보를 가져옵니다.
 */
async function getUser(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await userService.getUser(userId);
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 사용자의 선호 언어를 업데이트합니다.
 */
async function updateUserLanguage(req, res) {
  try {
    const { userId } = req.params;
    const { preferredLanguage } = req.body;
    
    if (!preferredLanguage) {
      return res.status(400).json({ success: false, error: '선호 언어는 필수입니다.' });
    }
    
    const user = await userService.updateUserLanguage(userId, preferredLanguage);
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user language:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createUser,
  getUser,
  updateUserLanguage,
};