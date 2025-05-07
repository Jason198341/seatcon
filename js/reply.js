/**
 * 메시지 답장 관리 모듈
 * 
 * 메시지 답장 UI 및 상호작용, 답장 처리를 관리합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import userManager from './user.js';

class ReplyManager {
    constructor() {
        // DOM 요소 참조
        this.messageList = null;
        this.messageForm = null;
        this.messageInput = null;
        
        // 답장 관련 상태
        this.replyingToMessage = null;
        this.replyPreviewElement = null;
    }

    /**
     * 답장 관리자 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // DOM 요소 참조 설정
        this.messageList = document.getElementById(options.messageListId || 'messageList');
        this.messageForm = document.getElementById(options.messageFormId || 'messageForm');
        this.messageInput = document.getElementById(options.messageInputId || 'messageInput');
        
        // 답장 취소 버튼 생성
        this.createReplyPreview();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ReplyManager initialized');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메시지 리스트 이벤트 위임 (메시지 슬라이드 액션)
        if (this.messageList) {
            this.messageList.addEventListener('mousedown', this.handleMessageMouseDown.bind(this));
            this.messageList.addEventListener('touchstart', this.handleMessageTouchStart.bind(this), { passive: false });
        }
        
        // 메시지 폼 제출 이벤트 (원래 이벤트에 영향을 주지 않으면서 답장 상태 처리)
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                // 제출 후 답장 상태 초기화
                setTimeout(() => {
                    if (this.replyingToMessage) {
                        this.clearReplyState();
                    }
                }, 100);
            });
        }
    }

    /**
     * 메시지 마우스 다운 이벤트 처리 - 슬라이드 액션 시작
     * @param {MouseEvent} e - 마우스 이벤트
     */
    handleMessageMouseDown(e) {
        // 메시지 요소 찾기
        const messageElement = this.findMessageElement(e.target);
        if (!messageElement) return;
        
        // 시작 위치 저장
        this.startX = e.clientX;
        this.activeMessage = messageElement;
        
        // 마우스 이벤트 리스너 추가
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    /**
     * 메시지 터치 시작 이벤트 처리 - 슬라이드 액션 시작
     * @param {TouchEvent} e - 터치 이벤트
     */
    handleMessageTouchStart(e) {
        // 터치 이벤트가 스크롤을 방해하지 않도록 처리
        const touch = e.touches[0];
        
        // 메시지 요소 찾기
        const messageElement = this.findMessageElement(touch.target);
        if (!messageElement) return;
        
        // 시작 위치 저장
        this.startX = touch.clientX;
        this.activeMessage = messageElement;
        
        // 터치 이벤트 리스너 추가
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * 마우스 이동 이벤트 처리 - 슬라이드 액션
     * @param {MouseEvent} e - 마우스 이벤트
     */
    handleMouseMove(e) {
        if (!this.activeMessage || !this.startX) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - this.startX;
        
        // 오른쪽으로 드래그 (답장 액션)만 허용
        if (deltaX > 0) {
            // 최대 슬라이드 거리 제한
            const maxSlide = 80;
            const slide = Math.min(deltaX, maxSlide);
            
            // 슬라이드 애니메이션 적용
            this.activeMessage.style.transform = `translateX(${slide}px)`;
            
            // 슬라이드 정도에 따라 배경 변화
            const opacity = slide / maxSlide;
            this.activeMessage.style.background = `linear-gradient(to right, rgba(0, 123, 255, ${opacity * 0.2}), transparent ${slide * 1.5}px)`;
            
            // 슬라이드가 충분히 진행되면 답장 아이콘 표시
            if (slide > 40) {
                // 답장 아이콘이 없으면 추가
                if (!this.activeMessage.querySelector('.reply-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'reply-indicator';
                    indicator.innerHTML = '<i class="fas fa-reply"></i>';
                    indicator.style.cssText = `
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #0d6efd;
                        opacity: ${opacity};
                    `;
                    this.activeMessage.appendChild(indicator);
                }
            } else {
                // 아이콘 제거
                const indicator = this.activeMessage.querySelector('.reply-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        }
    }

    /**
     * 터치 이동 이벤트 처리 - 슬라이드 액션
     * @param {TouchEvent} e - 터치 이벤트
     */
    handleTouchMove(e) {
        if (!this.activeMessage || !this.startX) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const deltaX = currentX - this.startX;
        
        // 메시지 슬라이드 중에는 페이지 스크롤 방지
        if (Math.abs(deltaX) > 10) {
            e.preventDefault();
        }
        
        // 오른쪽으로 드래그 (답장 액션)만 허용
        if (deltaX > 0) {
            // 최대 슬라이드 거리 제한
            const maxSlide = 80;
            const slide = Math.min(deltaX, maxSlide);
            
            // 슬라이드 애니메이션 적용
            this.activeMessage.style.transform = `translateX(${slide}px)`;
            
            // 슬라이드 정도에 따라 배경 변화
            const opacity = slide / maxSlide;
            this.activeMessage.style.background = `linear-gradient(to right, rgba(0, 123, 255, ${opacity * 0.2}), transparent ${slide * 1.5}px)`;
            
            // 슬라이드가 충분히 진행되면 답장 아이콘 표시
            if (slide > 40) {
                // 답장 아이콘이 없으면 추가
                if (!this.activeMessage.querySelector('.reply-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'reply-indicator';
                    indicator.innerHTML = '<i class="fas fa-reply"></i>';
                    indicator.style.cssText = `
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #0d6efd;
                        opacity: ${opacity};
                    `;
                    this.activeMessage.appendChild(indicator);
                }
            } else {
                // 아이콘 제거
                const indicator = this.activeMessage.querySelector('.reply-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        }
    }

    /**
     * 마우스 업 이벤트 처리 - 슬라이드 액션 완료
     * @param {MouseEvent} e - 마우스 이벤트
     */
    handleMouseUp(e) {
        if (!this.activeMessage) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - this.startX;
        
        // 충분한 드래그 거리인 경우 답장 모드 활성화
        if (deltaX > 50) {
            this.activateReplyMode(this.activeMessage);
        }
        
        // 슬라이드 애니메이션 리셋
        this.resetMessageAnimation(this.activeMessage);
        
        // 이벤트 리스너 제거
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // 상태 초기화
        this.startX = null;
        this.activeMessage = null;
    }

    /**
     * 터치 종료 이벤트 처리 - 슬라이드 액션 완료
     * @param {TouchEvent} e - 터치 이벤트
     */
    handleTouchEnd(e) {
        if (!this.activeMessage) return;
        
        const touch = e.changedTouches[0];
        const currentX = touch.clientX;
        const deltaX = currentX - this.startX;
        
        // 충분한 드래그 거리인 경우 답장 모드 활성화
        if (deltaX > 50) {
            this.activateReplyMode(this.activeMessage);
        }
        
        // 슬라이드 애니메이션 리셋
        this.resetMessageAnimation(this.activeMessage);
        
        // 이벤트 리스너 제거
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        
        // 상태 초기화
        this.startX = null;
        this.activeMessage = null;
    }

    /**
     * 메시지 요소 찾기
     * @param {HTMLElement} element - 클릭된 요소
     * @returns {HTMLElement|null} - 메시지 요소
     */
    findMessageElement(element) {
        // 메시지 요소 또는 그 상위 요소 찾기
        let currentElement = element;
        while (currentElement && !currentElement.classList.contains('message')) {
            currentElement = currentElement.parentElement;
            
            // 메시지 목록 밖으로 나가면 중단
            if (currentElement === this.messageList) {
                return null;
            }
        }
        
        return currentElement;
    }

    /**
     * 메시지 애니메이션 리셋
     * @param {HTMLElement} messageElement - 메시지 요소
     */
    resetMessageAnimation(messageElement) {
        if (!messageElement) return;
        
        // 트랜지션 효과 추가
        messageElement.style.transition = 'transform 0.3s ease, background 0.3s ease';
        
        // 원래 위치로 복원
        messageElement.style.transform = '';
        messageElement.style.background = '';
        
        // 답장 아이콘 제거
        const indicator = messageElement.querySelector('.reply-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // 트랜지션 효과 제거 (이후 상호작용을 위해)
        setTimeout(() => {
            messageElement.style.transition = '';
        }, 300);
    }

    /**
     * 답장 모드 활성화
     * @param {HTMLElement} messageElement - 답장할 메시지 요소
     */
    activateReplyMode(messageElement) {
        if (!messageElement) return;
        
        // 메시지 ID 가져오기
        const messageId = messageElement.dataset.messageId;
        if (!messageId) return;
        
        // 답장 정보 가져오기
        const messageContent = messageElement.querySelector('.message-content');
        const authorName = messageElement.querySelector('.author-name')?.textContent || '알 수 없음';
        const originalContent = messageElement.querySelector('.original-content')?.textContent || '';
        
        // 답장 상태 설정
        this.replyingToMessage = {
            id: messageId,
            authorName: authorName,
            content: originalContent.substring(0, 50) + (originalContent.length > 50 ? '...' : '')
        };
        
        // 답장 프리뷰 표시
        this.showReplyPreview();
        
        // 입력창에 포커스
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }

    /**
     * 답장 프리뷰 컨테이너 생성
     */
    createReplyPreview() {
        // 이미 존재하는 경우 제거
        let existingPreview = document.querySelector('.reply-preview-container');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // 답장 프리뷰 컨테이너 생성
        this.replyPreviewElement = document.createElement('div');
        this.replyPreviewElement.className = 'reply-preview-container';
        this.replyPreviewElement.style.cssText = `
            display: none;
            position: relative;
            background-color: rgba(0, 123, 255, 0.05);
            border-left: 3px solid #0d6efd;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 8px;
            font-size: 0.9rem;
        `;
        
        // 메시지 폼 앞에 추가
        if (this.messageForm) {
            this.messageForm.insertBefore(this.replyPreviewElement, this.messageForm.firstChild);
        }
    }

    /**
     * 답장 프리뷰 표시
     */
    showReplyPreview() {
        if (!this.replyPreviewElement || !this.replyingToMessage) return;
        
        // 컨텐츠 생성
        this.replyPreviewElement.innerHTML = `
            <div class="reply-preview-header">
                <i class="fas fa-reply" style="margin-right: 5px;"></i>
                <strong>답장 대상: ${this.escapeHtml(this.replyingToMessage.authorName)}</strong>
            </div>
            <div class="reply-preview-content">
                ${this.escapeHtml(this.replyingToMessage.content)}
            </div>
            <button class="reply-cancel-button" style="
                position: absolute;
                right: 8px;
                top: 8px;
                border: none;
                background: none;
                color: #6c757d;
                font-size: 14px;
                cursor: pointer;
                padding: 0;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 취소 버튼 이벤트
        const cancelButton = this.replyPreviewElement.querySelector('.reply-cancel-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearReplyState();
            });
        }
        
        // 다크 모드 대응
        if (document.body.classList.contains('theme-dark')) {
            this.replyPreviewElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        }
        
        // 표시
        this.replyPreviewElement.style.display = 'block';
        
        // 입력창 스타일 변경 (답장 모드 표시)
        if (this.messageForm) {
            this.messageForm.classList.add('replying-mode');
        }
    }

    /**
     * 답장 상태 초기화
     */
    clearReplyState() {
        this.replyingToMessage = null;
        
        // 프리뷰 숨기기
        if (this.replyPreviewElement) {
            this.replyPreviewElement.style.display = 'none';
            this.replyPreviewElement.innerHTML = '';
        }
        
        // 입력창 스타일 복원
        if (this.messageForm) {
            this.messageForm.classList.remove('replying-mode');
        }
    }

    /**
     * 현재 답장 대상 메시지 ID 가져오기
     * @returns {string|null} - 답장 대상 메시지 ID
     */
    getReplyToMessageId() {
        return this.replyingToMessage ? this.replyingToMessage.id : null;
    }

    /**
     * HTML 이스케이프 처리
     * @param {string} unsafe - 이스케이프 처리할 문자열
     * @returns {string} - 이스케이프 처리된 문자열
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const replyManager = new ReplyManager();
export default replyManager;
