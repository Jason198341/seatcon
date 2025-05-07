/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 사용자 관리 기능
 * 작성일: 2025-05-07
 */

const adminUsers = {
    /**
     * 사용자 관리 페이지 초기화
     */
    async initialize() {
        console.log('사용자 관리 페이지 초기화 중...');
        
        try {
            // 사용자 목록 로드
            await this.loadUsers();
            
            console.log('사용자 관리 페이지 초기화 완료');
        } catch (error) {
            console.error('사용자 관리 페이지 초기화 오류:', error);
            window.uiService.addNotification('사용자 관리 페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 사용자 목록 로드
     */
    async loadUsers() {
        try {
            // 사용자 목록 조회
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (usersError) throw usersError;
            
            // 각 사용자별 메시지 수 및 마지막 활동 조회
            const usersWithStats = await Promise.all(users.map(async (user) => {
                // 메시지 수 조회
                const { count: messageCount, error: countError } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);
                
                if (countError) throw countError;
                
                // 마지막 활동 조회
                const { data: lastActivity, error: activityError } = await supabase
                    .from('messages')
                    .select('created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (activityError) throw activityError;
                
                return {
                    ...user,
                    message_count: messageCount,
                    last_activity: lastActivity && lastActivity.length > 0 ? lastActivity[0].created_at : null
                };
            }));
            
            // 사용자 테이블 렌더링
            this.renderUsersTable(usersWithStats);
            
        } catch (error) {
            console.error('사용자 목록 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 사용자 테이블 렌더링
     * @param {Array} users - 사용자 목록
     */
    renderUsersTable(users) {
        const tableBody = document.getElementById('users-table-body');
        
        if (!tableBody) return;
        
        // 테이블 내용 초기화
        tableBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            // 사용자가 없는 경우
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" class="text-center">사용자가 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // 각 사용자 행 생성
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // 선호 언어 이름 가져오기
            const languageName = {
                'ko': '한국어',
                'en': '영어',
                'hi': '힌디어',
                'zh': '중국어'
            }[user.preferred_language] || user.preferred_language;
            
            // 역할 표시 형식화
            const roleDisplay = {
                'participant': '참가자',
                'speaker': '발표자',
                'staff': '스태프'
            }[user.role] || user.role;
            
            // 마지막 활동 형식화
            const lastActivity = user.last_activity
                ? window.utils.formatDate(user.last_activity, 'YYYY-MM-DD HH:mm')
                : '-';
            
            // 행 내용 설정
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.username}</td>
                <td>
                    <span class="role-badge ${user.role}">
                        ${roleDisplay}
                    </span>
                </td>
                <td>${languageName}</td>
                <td>${lastActivity}</td>
                <td>${user.message_count}</td>
                <td class="actions">
                    <button class="btn btn-small view-user-btn" data-id="${user.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.role !== 'staff' ?
                        `<button class="btn btn-small btn-warning block-user-btn" data-id="${user.id}">
                            <i class="fas fa-ban"></i>
                        </button>` : ''
                    }
                </td>
            `;
            
            // 행을 테이블에 추가
            tableBody.appendChild(row);
        });
        
        // 상세 보기 버튼 이벤트
        document.querySelectorAll('.view-user-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.dataset.id;
                this.viewUser(userId);
            });
        });
        
        // 차단 버튼 이벤트
        document.querySelectorAll('.block-user-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.dataset.id;
                this.blockUser(userId);
            });
        });
    },
    
    /**
     * 사용자 상세 정보 보기
     * @param {string} userId - 사용자 ID
     */
    async viewUser(userId) {
        try {
            // 사용자 정보 조회
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (userError) throw userError;
            
            // 사용자 통계 정보
            const stats = await this.getUserStats(userId);
            
            // 모달 내용 생성
            const modalContent = `
                <div class="user-profile">
                    <div class="user-header">
                        <img src="../img/${user.avatar_url}" alt="${user.username}" class="user-avatar">
                        <h3>${user.username}</h3>
                        <span class="role-badge ${user.role}">${user.role}</span>
                    </div>
                    
                    <div class="user-details">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>선호 언어:</strong> ${user.preferred_language}</p>
                        <p><strong>가입일:</strong> ${window.utils.formatDate(user.created_at, 'YYYY-MM-DD HH:mm')}</p>
                        <p><strong>메시지 수:</strong> ${stats.messageCount}</p>
                        <p><strong>마지막 활동:</strong> ${stats.lastActivity ? window.utils.formatDate(stats.lastActivity, 'YYYY-MM-DD HH:mm') : '-'}</p>
                    </div>
                    
                    <div class="user-stats">
                        <h4>활동 통계</h4>
                        <p><strong>좋아요 받은 수:</strong> ${stats.likesReceived}</p>
                        <p><strong>좋아요 누른 수:</strong> ${stats.likesGiven}</p>
                        <p><strong>답장 받은 수:</strong> ${stats.repliesReceived}</p>
                        <p><strong>답장 보낸 수:</strong> ${stats.repliesSent}</p>
                    </div>
                </div>
            `;
            
            // 알림으로 표시 (실제로는 모달 사용이 더 좋지만 간단한 구현을 위해)
            alert(`사용자 정보: ${user.username}\n\nID: ${user.id}\n역할: ${user.role}\n선호 언어: ${user.preferred_language}\n메시지 수: ${stats.messageCount}`);
            
            console.log('사용자 상세 정보:', user, stats);
        } catch (error) {
            console.error('사용자 상세 정보 조회 오류:', error);
            alert('사용자 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 사용자 통계 정보 조회
     * @param {string} userId - 사용자 ID
     * @returns {Promise<Object>} - 사용자 통계 정보
     */
    async getUserStats(userId) {
        try {
            // 메시지 수 조회
            const { count: messageCount, error: countError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (countError) throw countError;
            
            // 마지막 활동 조회
            const { data: lastActivityData, error: activityError } = await supabase
                .from('messages')
                .select('created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (activityError) throw activityError;
            
            const lastActivity = lastActivityData && lastActivityData.length > 0
                ? lastActivityData[0].created_at
                : null;
            
            // 좋아요 받은 수 조회
            const { count: likesReceived, error: likesReceivedError } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .in('message_id', supabase.from('messages').select('id').eq('user_id', userId));
            
            if (likesReceivedError) throw likesReceivedError;
            
            // 좋아요 누른 수 조회
            const { count: likesGiven, error: likesGivenError } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (likesGivenError) throw likesGivenError;
            
            // 답장 받은 수 조회
            const { count: repliesReceived, error: repliesReceivedError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('reply_to_id', supabase.from('messages').select('id').eq('user_id', userId));
            
            if (repliesReceivedError) throw repliesReceivedError;
            
            // 답장 보낸 수 조회
            const { count: repliesSent, error: repliesSentError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .not('reply_to_id', 'is', null);
            
            if (repliesSentError) throw repliesSentError;
            
            return {
                messageCount,
                lastActivity,
                likesReceived,
                likesGiven,
                repliesReceived,
                repliesSent
            };
        } catch (error) {
            console.error('사용자 통계 정보 조회 오류:', error);
            throw error;
        }
    },
    
    /**
     * 사용자 차단 (미구현 - 경고 표시)
     * @param {string} userId - 사용자 ID
     */
    async blockUser(userId) {
        try {
            // 사용자 정보 조회
            const { data: user, error } = await supabase
                .from('users')
                .select('username')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            
            // 구현되지 않은 기능임을 알림
            alert(`사용자 차단 기능은 아직 구현되지 않았습니다.\n\n사용자: ${user.username}`);
        } catch (error) {
            console.error('사용자 차단 오류:', error);
            alert('사용자 정보 로드 중 오류가 발생했습니다.');
        }
    }
};

// 전역 객체로 내보내기
window.adminUsers = adminUsers;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminUsersLoaded'));
