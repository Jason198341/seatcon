/**
 * userService.js
 * 사용자 관리 및 인증을 담당하는 서비스
 */

const userService = (() => {
    // 사용자 정보 저장 키
    const USER_DATA_KEY = 'conference_chat_user';
    
    // 현재 사용자 정보
    let currentUser = null;
    
    /**
     * 사용자 초기화
     * @returns {Promise<Object|null>} 현재 사용자 정보
     */
    const initializeUser = async () => {
        // localStorage에서 사용자 정보 로드
        const savedUser = localStorage.getItem(USER_DATA_KEY);
        
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                currentUser = userData;
                
                // 사용자 정보 업데이트
                await updateUserData();
                
                return currentUser;
            } catch (error) {
                console.error('저장된 사용자 정보 로드 실패:', error);
                localStorage.removeItem(USER_DATA_KEY);
            }
        }
        
        return null;
    };
    
    /**
     * 사용자 로그인
     * @param {string} username - 사용자 이름
     * @param {string} preferredLanguage - 선호 언어
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<Object>} 로그인 결과
     */
    const login = async (username, preferredLanguage, roomId) => {
        if (!username || username.trim() === '') {
            throw new Error('사용자 이름을 입력해주세요');
        }
        
        try {
            // 사용자 ID 생성 (UUID 형식)
            const userId = crypto.randomUUID();
            
            // 사용자 정보 생성
            const userData = {
                id: userId,
                username: username.trim(),
                preferred_language: preferredLanguage,
                room_id: roomId,
                last_activity: new Date().toISOString() // 로그인 시간을 last_activity로 변경
            };
            
            // 데이터베이스에 사용자 정보 저장
            const savedUser = await dbService.saveUser(userData);
            
            // 현재 사용자 업데이트 및 localStorage에 저장
            currentUser = savedUser;
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
            
            console.log('사용자 로그인 성공:', currentUser);
            return currentUser;
        } catch (error) {
            console.error('사용자 로그인 실패:', error);
            throw new Error('로그인에 실패했습니다');
        }
    };
    
    /**
     * 사용자 로그아웃
     * @returns {Promise<boolean>} 로그아웃 성공 여부
     */
    const logout = async () => {
        if (!currentUser) {
            return true;
        }
        
        try {
            // 사용자 정보에서 채팅방 ID 제거 (방식 변경)
            if (currentUser && currentUser.id) {
                try {
                    await dbService.saveUser({
                        ...currentUser,
                        room_id: null
                    });
                } catch (e) {
                    console.warn('로그아웃 중 사용자 정보 업데이트 실패:', e);
                }
            }
            
            // localStorage에서 사용자 정보 제거
            localStorage.removeItem(USER_DATA_KEY);
            currentUser = null;
            
            return true;
        } catch (error) {
            console.error('사용자 로그아웃 실패:', error);
            return false;
        }
    };
    
    /**
     * 현재 사용자 정보 가져오기
     * @returns {Object|null} 현재 사용자 정보
     */
    const getCurrentUser = () => {
        return currentUser;
    };
    
    /**
     * 사용자 선호 언어 변경
     * @param {string} language - 변경할 언어 코드
     * @returns {Promise<Object>} 업데이트된 사용자 정보
     */
    const changePreferredLanguage = async (language) => {
        if (!currentUser) {
            throw new Error('로그인되지 않았습니다');
        }
        
        try {
            // 사용자 정보 업데이트
            const updatedUser = {
                ...currentUser,
                preferred_language: language
            };
            
            // 데이터베이스 업데이트
            const savedUser = await dbService.saveUser(updatedUser);
            
            // 현재 사용자 업데이트 및 localStorage에 저장
            currentUser = savedUser;
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
            
            return currentUser;
        } catch (error) {
            console.error('선호 언어 변경 실패:', error);
            throw new Error('언어 변경에 실패했습니다');
        }
    };
    
    /**
     * 채팅방 변경
     * @param {string} roomId - 변경할 채팅방 ID
     * @returns {Promise<Object>} 업데이트된 사용자 정보
     */
    const changeRoom = async (roomId) => {
        if (!currentUser) {
            throw new Error('로그인되지 않았습니다');
        }
        
        try {
            // 사용자 정보 업데이트
            const updatedUser = {
                ...currentUser,
                room_id: roomId
            };
            
            // 데이터베이스 업데이트
            const savedUser = await dbService.saveUser(updatedUser);
            
            // 현재 사용자 업데이트 및 localStorage에 저장
            currentUser = savedUser;
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
            
            return currentUser;
        } catch (error) {
            console.error('채팅방 변경 실패:', error);
            throw new Error('채팅방 변경에 실패했습니다');
        }
    };
    
    /**
     * 채팅방 내 사용자 목록 가져오기
     * @param {string} roomId - 채팅방 ID
     * @param {boolean} activeOnly - 활성 사용자만 가져올지 여부
     * @returns {Promise<Array>} 사용자 목록
     */
    const getRoomUsers = async (roomId, activeOnly = true) => {
        try {
            return await dbService.getUsers({
                roomId,
                activeOnly
            });
        } catch (error) {
            console.error('채팅방 사용자 목록 조회 실패:', error);
            throw new Error('사용자 목록을 불러오는데 실패했습니다');
        }
    };
    
    /**
     * 사용자 활동 시간 업데이트
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    const updateActivity = async () => {
        if (!currentUser) {
            return false;
        }
        
        try {
            await dbService.updateUserActivity(currentUser.id);
            return true;
        } catch (error) {
            console.error('사용자 활동 시간 업데이트 실패:', error);
            return false;
        }
    };
    
    /**
     * 정기적인 활동 시간 업데이트
     * @param {number} interval - 업데이트 간격 (밀리초)
     * @returns {number} 인터벌 ID
     */
    const startActivityUpdates = (interval = 60000) => {
        // 1분마다 사용자 활동 시간 업데이트
        return setInterval(updateActivity, interval);
    };
    
    /**
     * 관리자 인증
     * @param {string} adminId - 관리자 ID
     * @param {string} password - 비밀번호
     * @returns {Promise<boolean>} 인증 성공 여부
     */
    const authenticateAdmin = async (adminId, password) => {
        try {
            return await dbService.authenticateAdmin(adminId, password);
        } catch (error) {
            console.error('관리자 인증 실패:', error);
            return false;
        }
    };
    
    /**
     * 사용자 목록 조회 (관리자용)
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Array>} 사용자 목록
     */
    const getUsers = async (options = {}) => {
        try {
            return await dbService.getUsers(options);
        } catch (error) {
            console.error('사용자 목록 조회 실패:', error);
            throw new Error('사용자 목록을 불러오는데 실패했습니다');
        }
    };
    
    /**
     * 사용자 권한 업데이트 (관리자용)
     * @param {string} userId - 사용자 ID
     * @param {string} role - 변경할 권한 (admin, user)
     * @returns {Promise<Object>} 업데이트된 사용자 정보
     */
    const updateUserRole = async (userId, role) => {
        try {
            const users = await dbService.getUsers({ userId });
            
            if (users.length === 0) {
                throw new Error('사용자를 찾을 수 없습니다');
            }
            
            const user = users[0];
            const updatedUser = {
                ...user,
                role: role
            };
            
            return await dbService.saveUser(updatedUser);
        } catch (error) {
            console.error('사용자 권한 업데이트 실패:', error);
            throw new Error('사용자 권한 변경에 실패했습니다');
        }
    };
    
    /**
     * 사용자 정보 업데이트
     * @returns {Promise<Object>} 업데이트된 사용자 정보
     * @private
     */
    const updateUserData = async () => {
        if (!currentUser) {
            return null;
        }
        
        try {
            // 현재 사용자 정보 업데이트 및 활동 시간 갱신
            await dbService.updateUserActivity(currentUser.id);
            
            // 사용자 정보 조회
            const users = await dbService.getUsers({
                userId: currentUser.id
            });
            
            if (users.length > 0) {
                currentUser = users[0];
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
            }
            
            return currentUser;
        } catch (error) {
            console.error('사용자 정보 업데이트 실패:', error);
            return currentUser;
        }
    };
    
    // 공개 API
    return {
        initializeUser,
        login,
        logout,
        getCurrentUser,
        changePreferredLanguage,
        changeRoom,
        getRoomUsers,
        updateActivity,
        startActivityUpdates,
        authenticateAdmin,
        getUsers,
        updateUserRole
    };
})();