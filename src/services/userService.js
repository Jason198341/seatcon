// src/services/userService.js

// 메모리에 사용자 정보 저장
const users = {};

/**
 * 임시 사용자를 생성합니다.
 * @param {string} username - 사용자 이름
 * @param {string} preferredLanguage - 선호 언어
 * @returns {Promise<Object>} 생성된 사용자 정보
 */
async function createTemporaryUser(username, preferredLanguage) {
  const userId = generateUserId();
  
  const newUser = {
    id: userId,
    username: username,
    preferred_language: preferredLanguage,
    created_at: new Date().toISOString()
  };
  
  users[userId] = newUser;
  
  return newUser;
}

/**
 * 사용자 정보를 가져옵니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 사용자 정보
 */
async function getUser(userId) {
  if (!users[userId]) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  return users[userId];
}

/**
 * 사용자의 선호 언어를 업데이트합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} preferredLanguage - 새 선호 언어
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 */
async function updateUserLanguage(userId, preferredLanguage) {
  if (!users[userId]) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  users[userId].preferred_language = preferredLanguage;
  
  return users[userId];
}

/**
 * 고유한 사용자 ID를 생성합니다.
 * @returns {string} 생성된 사용자 ID
 */
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  createTemporaryUser,
  getUser,
  updateUserLanguage,
};