/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 메시지 관리 기능
 * 작성일: 2025-05-07
 */

const adminMessages = {
    /**
     * 메시지 관리 페이지 초기화
     */
    async initialize() {
        console.log('메시지 관리 페이지 초기화 중...');
        
        try {
            // 필터 옵션 초기화
            await this.initializeFilters();
            
            // 메시지 목록 로드
            await this.loadMessages();
            
            // 필터 적용 버튼 이벤트 초기화
            document.getElementById('apply-message-filter-btn').addEventListener('click', () => {
                this.loadMessages();
            });
            
            console.log('메시지 관리 페이지 초기화 완료');
        } catch (error) {
            console.error('메시지 관리 페이지 초기화 오류:', error);
            window.uiService.addNotification('메시지 관리 페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 필터 옵션 초기화
     */
    async initializeFilters() {
        try {
            // 채팅방 목록 로드
            const { data: rooms, error: roomsError } = await supabase
                .from('rooms')
                .select('id, name')
                .order('name');
            
            if (roomsError) throw roomsError;
            
            // 채팅방 필터 옵션 채우기
            const roomSelect = document.getElementById('message-room-filter');
            roomSelect.innerHTML = '<option value="">모든 채팅방</option>';
            
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room.name;
                roomSelect.appendChild(option);
            });
            
            // 날짜 필터 기본값 설정
            const today = new Date();
            const fromDate = new Date();
            fromDate.setDate(today.getDate() - 7);  // 일주일 전
            
            document.getElementById('message-date-from').valueAsDate = fromDate;
            document.getElementById('message-date-to').valueAsDate = today;
            
        } catch (error) {
            console.error('필터 옵션 초기화 오류:', error);
            throw error;
        }
    },
    
    /**
     * 메시지 목록 로드
     */
    async loadMessages() {
        try {
            // 필터 값 가져오기
            const roomId = document.getElementById('message-room-filter').value;
            const username = document.getElementById('message-user-filter').value.trim();
            const dateFrom = document.getElementById('message-date-from').value;
            const dateTo = document.getElementById('message-date-to').value;
            
            // 기본 쿼리 생성
            let query = supabase
                .from('messages')
                .select(`
                    *,
                    room:room_id (id, name),
                    user:user_id (id, username, role)
                `)
                .order('created_at', { ascending: false })
                .limit(100);  // 최대 100개 메시지
            
            // 채팅방 필터 적용
            if (roomId) {
                query = query.eq('room_id', roomId);
            }
            
            // 날짜 필터 적용
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                query = query.gte('created_at', fromDate.toISOString());
            }
            
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                query = query.lte('created_at', toDate.toISOString());
            }
            
            // 쿼리 실행
            const { data: messages, error } = await query;
            
            if (error) throw error;
            
            // 사용자 이름으로 추가 필터링 (Supabase에서 지원하지 않는 경우)
            let filteredMessages = messages;
            
            if (username) {
                filteredMessages = messages.filter(msg => 
                    msg.user && msg.user.username.toLowerCase().includes(username.toLowerCase())
                );
            }
            
            // 메시지 테이블 렌더링
            this.renderMessagesTable(filteredMessages);
            
        } catch (error) {
            console.error('메시지 목록 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 메시지 테이블 렌더링
     * @param {Array} messages - 메시지 목록
     */
    renderMessagesTable(messages) {
        const tableBody = document.getElementById('messages-table-body');
        
        if (!tableBody) return;
        
        // 테이블 내용 초기화
        tableBody.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            // 메시지가 없는 경우
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="8" class="text-center">메시지가 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // 각 메시지 행 생성
        messages.forEach(message => {
            const row = document.createElement('tr');
            
            // 메시지 내용이 너무 길면 줄임
            const maxContentLength = 50;
            const shortContent = message.content.length > maxContentLength
                ? message.content.substring(0, maxContentLength) + '...'
                : message.content;
            
            // 역할 표시 형식화
            const roleDisplay = {
                'participant': '참가자',
                'speaker': '발표자',
                'staff': '스태프'
            }[message.user.role] || message.user.role;
            
            // 행 내용 설정
            row.innerHTML = `
                <td>${message.id.substring(0, 8)}...</td>
                <td>${message.room.name}</td>
                <td>
                    <span class="user-name">${message.user.username}</span>
                    <span class="role-badge ${message.user.role}">
                        ${roleDisplay}
                    </span>
                </td>
                <td>${shortContent}</td>
                <td>${message.original_language}</td>
                <td>${window.utils.formatDate(message.created_at, 'YYYY-MM-DD HH:mm')}</td>
                <td>
                    <span class="status-badge ${message.is_pinned ? 'pinned' : ''}">
                        ${message.is_pinned ? '고정됨' : '-'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-small view-message-btn" data-id="${message.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-small ${message.is_pinned ? 'btn-warning unpin-message-btn' : 'btn-primary pin-message-btn'}" data-id="${message.id}">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-message-btn" data-id="${message.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // 행을 테이블에 추가
            tableBody.appendChild(row);
        });
        
        // 상세 보기 버튼 이벤트
        document.querySelectorAll('.view-message-btn').forEach(button => {
            button.addEventListener('click', () => {
                const messageId = button.dataset.id;
                this.viewMessage(messageId);
            });
        });
        
        // 고정 버튼 이벤트
        document.querySelectorAll('.pin-message-btn').forEach(button => {
            button.addEventListener('click', () => {
                const messageId = button.dataset.id;
                this.togglePin(messageId, true);
            });
        });
        
        // 고정 해제 버튼 이벤트
        document.querySelectorAll('.unpin-message-btn').forEach(button => {
            button.addEventListener('click', () => {
                const messageId = button.dataset.id;
                this.togglePin(messageId, false);
            });
        });
        
        // 삭제 버튼 이벤트
        document.querySelectorAll('.delete-message-btn').forEach(button => {
            button.addEventListener('click', () => {
                const messageId = button.dataset.id;
                this.confirmDelete(messageId);
            });
        });
    },
    
    /**
     * 메시지 상세 보기
     * @param {string} messageId - 메시지 ID
     */
    async viewMessage(messageId) {
        try {
            // 메시지 정보 조회
            const { data: message, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    room:room_id (id, name),
                    user:user_id (id, username, role, avatar_url),
                    reply_to:reply_to_id (
                        id, 
                        content, 
                        created_at,
                        user_id (id, username)
                    )
                `)
                .eq('id', messageId)
                .single();
            
            if (error) throw error;
            
            // 좋아요 수 조회
            const { count: likeCount, error: likeError } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('message_id', messageId);
            
            if (likeError) throw likeError;
            
            // 답장 수 조회
            const { count: replyCount, error: replyError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('reply_to_id', messageId);
            
            if (replyError) throw replyError;
            
            // 번역 정보 조회
            const translations = [];
            
            for (const lang of ['ko', 'en', 'hi', 'zh']) {
                if (lang === message.original_language) continue;
                
                try {
                    // 캐시에서 번역 검색
                    const { data, error } = await supabase
                        .from('translation_cache')
                        .select('translated_text')
                        .eq('original_text', message.content)
                        .eq('target_language', lang)
                        .limit(1);
                    
                    if (!error && data && data.length > 0) {
                        const langName = {
                            'ko': '한국어',
                            'en': '영어',
                            'hi': '힌디어',
                            'zh': '중국어'
                        }[lang] || lang;
                        
                        translations.push({
                            language: lang,
                            languageName: langName,
                            text: data[0].translated_text
                        });
                    }
                } catch (e) {
                    console.warn('번역 조회 오류:', e);
                }
            }
            
            // 메시지 정보 알림 (실제로는 모달 사용이 더 좋지만 간단한 구현을 위해)
            const messageInfo = `메시지 ID: ${message.id}\n\n` +
                `내용: ${message.content}\n\n` +
                `원본 언어: ${message.original_language}\n` +
                `작성자: ${message.user.username} (${message.user.role})\n` +
                `채팅방: ${message.room.name}\n` +
                `작성일: ${window.utils.formatDate(message.created_at, 'YYYY-MM-DD HH:mm:ss')}\n` +
                `고정 상태: ${message.is_pinned ? '고정됨' : '고정되지 않음'}\n` +
                `좋아요 수: ${likeCount}\n` +
                `답장 수: ${replyCount}\n\n` +
                (message.reply_to ? `답장 대상: ${message.reply_to.user_id.username}의 메시지 - "${message.reply_to.content.substring(0, 30)}${message.reply_to.content.length > 30 ? '...' : ''}"\n\n` : '') +
                (translations.length > 0 ? `번역:\n${translations.map(t => `- ${t.languageName}: ${t.text}`).join('\n')}\n` : '');
            
            alert(messageInfo);
            
            console.log('메시지 상세 정보:', message, { likeCount, replyCount, translations });
        } catch (error) {
            console.error('메시지 상세 정보 조회 오류:', error);
            alert('메시지 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 메시지 고정 토글
     * @param {string} messageId - 메시지 ID
     * @param {boolean} isPinned - 고정 여부
     */
    async togglePin(messageId, isPinned) {
        try {
            // 메시지 정보 조회
            const { data: message, error: messageError } = await supabase
                .from('messages')
                .select('content, is_pinned')
                .eq('id', messageId)
                .single();
            
            if (messageError) throw messageError;
            
            // 이미 상태가 같으면 처리하지 않음
            if (message.is_pinned === isPinned) {
                alert(`메시지가 이미 ${isPinned ? '고정' : '고정 해제'} 상태입니다.`);
                return;
            }
            
            // 메시지 고정 상태 업데이트
            const { error: updateError } = await supabase
                .from('messages')
                .update({ is_pinned: isPinned })
                .eq('id', messageId);
            
            if (updateError) throw updateError;
            
            // 메시지 목록 새로고침
            await this.loadMessages();
            
            // 알림 표시
            window.uiService.addNotification(
                `메시지가 ${isPinned ? '고정' : '고정 해제'}되었습니다.`,
                'success'
            );
        } catch (error) {
            console.error('메시지 고정 토글 오류:', error);
            alert('메시지 고정 상태 변경 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 메시지 삭제 확인
     * @param {string} messageId - 메시지 ID
     */
    async confirmDelete(messageId) {
        try {
            // 메시지 정보 조회
            const { data: message, error } = await supabase
                .from('messages')
                .select('content')
                .eq('id', messageId)
                .single();
            
            if (error) throw error;
            
            // 내용 줄임
            const shortContent = message.content.length > 30
                ? message.content.substring(0, 30) + '...'
                : message.content;
            
            // 삭제 확인
            if (confirm(`메시지를 삭제하시겠습니까?\n\n"${shortContent}"\n\n이 작업은 되돌릴 수 없습니다.`)) {
                await this.deleteMessage(messageId);
            }
        } catch (error) {
            console.error('메시지 삭제 확인 오류:', error);
            alert('메시지 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 메시지 삭제
     * @param {string} messageId - 메시지 ID
     */
    async deleteMessage(messageId) {
        try {
            // 좋아요 삭제
            const { error: likesError } = await supabase
                .from('likes')
                .delete()
                .eq('message_id', messageId);
            
            if (likesError) throw likesError;
            
            // 답장 관계 제거 (삭제하지 않고 NULL로 설정)
            const { error: repliesError } = await supabase
                .from('messages')
                .update({ reply_to_id: null })
                .eq('reply_to_id', messageId);
            
            if (repliesError) throw repliesError;
            
            // 메시지 삭제 (실제로는 is_deleted 플래그 설정)
            const { error: messageError } = await supabase
                .from('messages')
                .update({ is_deleted: true })
                .eq('id', messageId);
            
            if (messageError) throw messageError;
            
            // 메시지 목록 새로고침
            await this.loadMessages();
            
            // 알림 표시
            window.uiService.addNotification('메시지가 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('메시지 삭제 오류:', error);
            alert('메시지 삭제 중 오류가 발생했습니다.');
        }
    }
};

// 전역 객체로 내보내기
window.adminMessages = adminMessages;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminMessagesLoaded'));
