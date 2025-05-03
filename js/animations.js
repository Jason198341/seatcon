/**
 * 애니메이션 컨트롤러
 * 
 * 고급 애니메이션 효과를 제어하여 세련된 사용자 경험을 제공합니다.
 * 부드럽고 자연스러운 모션 시스템 구현.
 */
class AnimationsController {
    constructor() {
        // 애니메이션 설정
        this.settings = {
            enableAnimations: true,
            reducedMotion: false
        };
        
        // 애니메이션 레지스트리
        this.animationRegistry = {};
        
        // 초기화
        this.init();
    }
    
    /**
     * 애니메이션 컨트롤러 초기화
     */
    init() {
        console.log('애니메이션 컨트롤러 초기화');
        
        // 시스템 환경 설정 확인
        this.checkReducedMotionPreference();
        
        // 애니메이션 레지스트리 초기화
        this.initAnimationRegistry();
        
        // 인터섹션 옵저버 초기화
        this.initIntersectionObserver();
    }
    
    /**
     * 모션 축소 환경 설정 확인
     */
    checkReducedMotionPreference() {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        // 현재 상태 적용
        this.settings.reducedMotion = reducedMotionQuery.matches;
        
        // 변경 감지
        reducedMotionQuery.addEventListener('change', (event) => {
            this.settings.reducedMotion = event.matches;
            this.updateAnimationSettings();
        });
    }
    
    /**
     * 애니메이션 설정 업데이트
     */
    updateAnimationSettings() {
        if (this.settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
            this.settings.enableAnimations = false;
        } else {
            document.body.classList.remove('reduced-motion');
            this.settings.enableAnimations = true;
        }
    }
    
    /**
     * 애니메이션 레지스트리 초기화
     * 미리 정의된 애니메이션 효과 등록
     */
    initAnimationRegistry() {
        // 페이드 인 애니메이션
        this.animationRegistry.fadeIn = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-out',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.opacity = '0';
            element.style.display = options.display || 'block';
            
            setTimeout(() => {
                element.style.transition = `opacity ${mergedOptions.duration}ms ${mergedOptions.easing}`;
                element.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.transition = '';
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 페이드 아웃 애니메이션
        this.animationRegistry.fadeOut = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-in',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.opacity = '1';
            
            setTimeout(() => {
                element.style.transition = `opacity ${mergedOptions.duration}ms ${mergedOptions.easing}`;
                element.style.opacity = '0';
                
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.transition = '';
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 슬라이드 다운 애니메이션
        this.animationRegistry.slideDown = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-out',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            // 원래 높이 저장
            const height = element.scrollHeight;
            
            // 초기 상태 설정
            element.style.display = options.display || 'block';
            element.style.overflow = 'hidden';
            element.style.height = '0';
            element.style.paddingTop = '0';
            element.style.paddingBottom = '0';
            element.style.marginTop = '0';
            element.style.marginBottom = '0';
            
            setTimeout(() => {
                element.style.transition = `
                    height ${mergedOptions.duration}ms ${mergedOptions.easing},
                    padding ${mergedOptions.duration}ms ${mergedOptions.easing},
                    margin ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.height = `${height}px`;
                element.style.paddingTop = '';
                element.style.paddingBottom = '';
                element.style.marginTop = '';
                element.style.marginBottom = '';
                
                setTimeout(() => {
                    element.style.transition = '';
                    element.style.height = '';
                    element.style.overflow = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 슬라이드 업 애니메이션
        this.animationRegistry.slideUp = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-in',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            // 초기 상태 설정
            element.style.overflow = 'hidden';
            element.style.height = `${element.scrollHeight}px`;
            
            setTimeout(() => {
                element.style.transition = `
                    height ${mergedOptions.duration}ms ${mergedOptions.easing},
                    padding ${mergedOptions.duration}ms ${mergedOptions.easing},
                    margin ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.height = '0';
                element.style.paddingTop = '0';
                element.style.paddingBottom = '0';
                element.style.marginTop = '0';
                element.style.marginBottom = '0';
                
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.transition = '';
                    element.style.height = '';
                    element.style.overflow = '';
                    element.style.paddingTop = '';
                    element.style.paddingBottom = '';
                    element.style.marginTop = '';
                    element.style.marginBottom = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 슬라이드 인 (오른쪽에서) 애니메이션
        this.animationRegistry.slideInRight = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-out',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            element.style.display = options.display || 'block';
            
            setTimeout(() => {
                element.style.transition = `
                    transform ${mergedOptions.duration}ms ${mergedOptions.easing},
                    opacity ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.transform = 'translateX(0)';
                element.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.transition = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 슬라이드 아웃 (오른쪽으로) 애니메이션
        this.animationRegistry.slideOutRight = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-in',
                delay: 0,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
            
            setTimeout(() => {
                element.style.transition = `
                    transform ${mergedOptions.duration}ms ${mergedOptions.easing},
                    opacity ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.transform = 'translateX(100%)';
                element.style.opacity = '0';
                
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.transition = '';
                    element.style.transform = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 확대 효과 애니메이션
        this.animationRegistry.zoomIn = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-out',
                delay: 0,
                onComplete: null,
                scale: 0.8
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.transform = `scale(${mergedOptions.scale})`;
            element.style.opacity = '0';
            element.style.display = options.display || 'block';
            
            setTimeout(() => {
                element.style.transition = `
                    transform ${mergedOptions.duration}ms ${mergedOptions.easing},
                    opacity ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.transform = 'scale(1)';
                element.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.transition = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 축소 효과 애니메이션
        this.animationRegistry.zoomOut = (element, options = {}) => {
            const defaultOptions = {
                duration: 300,
                easing: 'ease-in',
                delay: 0,
                onComplete: null,
                scale: 0.8
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
            
            setTimeout(() => {
                element.style.transition = `
                    transform ${mergedOptions.duration}ms ${mergedOptions.easing},
                    opacity ${mergedOptions.duration}ms ${mergedOptions.easing}
                `;
                
                element.style.transform = `scale(${mergedOptions.scale})`;
                element.style.opacity = '0';
                
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.transition = '';
                    element.style.transform = '';
                    
                    if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }, mergedOptions.duration);
            }, mergedOptions.delay);
        };
        
        // 헤일로 효과 애니메이션
        this.animationRegistry.pulseHalo = (element, options = {}) => {
            const defaultOptions = {
                duration: 1500,
                color: 'rgba(123, 64, 249, 0.3)',
                size: 20,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            // 헤일로 요소 생성
            const halo = document.createElement('div');
            
            // 스타일 설정
            halo.style.position = 'absolute';
            halo.style.top = '0';
            halo.style.left = '0';
            halo.style.right = '0';
            halo.style.bottom = '0';
            halo.style.borderRadius = getComputedStyle(element).borderRadius || '0';
            halo.style.border = `2px solid ${mergedOptions.color}`;
            halo.style.opacity = '1';
            halo.style.pointerEvents = 'none';
            
            // 상대 위치 설정
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            
            // 헤일로 추가
            element.appendChild(halo);
            
            // 애니메이션 설정
            halo.animate(
                [
                    { 
                        opacity: 1, 
                        transform: 'scale(1)',
                        offset: 0 
                    },
                    { 
                        opacity: 0, 
                        transform: `scale(${1 + mergedOptions.size / 100})`,
                        offset: 1 
                    }
                ],
                {
                    duration: mergedOptions.duration,
                    easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
                }
            ).onfinish = () => {
                halo.remove();
                
                if (typeof mergedOptions.onComplete === 'function') {
                    mergedOptions.onComplete();
                }
            };
        };
        
        // 쉐이크 효과 애니메이션
        this.animationRegistry.shake = (element, options = {}) => {
            const defaultOptions = {
                duration: 600,
                intensity: 5,
                onComplete: null
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            // 애니메이션 키프레임 생성
            const keyframes = [
                { transform: 'translateX(0)' },
                { transform: `translateX(-${mergedOptions.intensity}px)` },
                { transform: `translateX(${mergedOptions.intensity}px)` },
                { transform: `translateX(-${mergedOptions.intensity}px)` },
                { transform: `translateX(${mergedOptions.intensity}px)` },
                { transform: `translateX(-${mergedOptions.intensity}px)` },
                { transform: `translateX(${mergedOptions.intensity}px)` },
                { transform: 'translateX(0)' }
            ];
            
            // 애니메이션 실행
            const animation = element.animate(keyframes, {
                duration: mergedOptions.duration,
                easing: 'cubic-bezier(.36,.07,.19,.97)'
            });
            
            animation.onfinish = () => {
                if (typeof mergedOptions.onComplete === 'function') {
                    mergedOptions.onComplete();
                }
            };
        };
    }
    
    /**
     * 인터섹션 옵저버 초기화
     * 화면에 등장하는 요소에 애니메이션 적용
     */
    initIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // data-animate 속성에 지정된 애니메이션 실행
                    const animationName = element.dataset.animate;
                    if (animationName && this.animationRegistry[animationName]) {
                        // 지연 시간 적용
                        const delay = parseInt(element.dataset.animateDelay) || 0;
                        
                        // 애니메이션 실행
                        this.animationRegistry[animationName](element, { delay });
                        
                        // 한 번만 실행하려면 옵저버에서 제거
                        const once = element.dataset.animateOnce !== 'false';
                        if (once) {
                            this.intersectionObserver.unobserve(element);
                        }
                    }
                }
            });
        }, observerOptions);
        
        // 애니메이션 대상 요소들 관찰 시작
        document.querySelectorAll('[data-animate]').forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }
    
    /**
     * 애니메이션 실행
     * @param {string} animationName - 실행할 애니메이션 이름
     * @param {HTMLElement} element - 애니메이션을 적용할 요소
     * @param {Object} options - 애니메이션 옵션
     */
    animate(animationName, element, options = {}) {
        // 모션 축소 설정 확인
        if (!this.settings.enableAnimations) {
            // 모션 축소 시 표시/숨김 처리만 수행
            if (animationName.includes('In')) {
                element.style.display = options.display || 'block';
                element.style.opacity = '1';
                
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            } else if (animationName.includes('Out')) {
                element.style.display = 'none';
                
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
            
            return;
        }
        
        // 애니메이션 실행
        if (this.animationRegistry[animationName]) {
            this.animationRegistry[animationName](element, options);
        } else {
            console.warn(`애니메이션 "${animationName}"를 찾을 수 없습니다.`);
        }
    }
    
    /**
     * 요소에 타이핑 효과 적용
     * @param {HTMLElement} element - 타이핑 효과를 적용할 요소
     * @param {string} text - 타이핑할 텍스트
     * @param {Object} options - 옵션
     */
    typeText(element, text, options = {}) {
        const defaultOptions = {
            speed: 50,
            delay: 0,
            cursor: true,
            cursorChar: '|',
            cursorBlink: true,
            onComplete: null
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // 모션 축소 설정 확인
        if (!this.settings.enableAnimations) {
            element.textContent = text;
            
            if (typeof mergedOptions.onComplete === 'function') {
                mergedOptions.onComplete();
            }
            
            return;
        }
        
        // 초기 설정
        element.textContent = '';
        
        // 커서 요소 생성
        let cursorElement = null;
        
        if (mergedOptions.cursor) {
            cursorElement = document.createElement('span');
            cursorElement.textContent = mergedOptions.cursorChar;
            cursorElement.classList.add('typing-cursor');
            
            if (mergedOptions.cursorBlink) {
                cursorElement.style.animation = 'cursorBlink 0.7s infinite';
            }
            
            element.appendChild(cursorElement);
        }
        
        // 타이핑 지연 설정
        setTimeout(() => {
            let i = 0;
            
            // 타이핑 간격 설정
            const typeInterval = setInterval(() => {
                if (i < text.length) {
                    // 텍스트 노드 생성 및 추가
                    const textNode = document.createTextNode(text.charAt(i));
                    
                    if (cursorElement) {
                        element.insertBefore(textNode, cursorElement);
                    } else {
                        element.appendChild(textNode);
                    }
                    
                    i++;
                } else {
                    clearInterval(typeInterval);
                    
                    // 타이핑 완료 후 1초 뒤 커서 제거 (옵션)
                    if (mergedOptions.cursor && !mergedOptions.cursorPersist) {
                        setTimeout(() => {
                            if (cursorElement && cursorElement.parentNode === element) {
                                cursorElement.remove();
                            }
                            
                            if (typeof mergedOptions.onComplete === 'function') {
                                mergedOptions.onComplete();
                            }
                        }, 1000);
                    } else if (typeof mergedOptions.onComplete === 'function') {
                        mergedOptions.onComplete();
                    }
                }
            }, mergedOptions.speed);
        }, mergedOptions.delay);
    }
    
    /**
     * 숫자 카운트 애니메이션
     * @param {HTMLElement} element - 카운트를 표시할 요소
     * @param {number} start - 시작 값
     * @param {number} end - 종료 값
     * @param {Object} options - 옵션
     */
    countNumber(element, start, end, options = {}) {
        const defaultOptions = {
            duration: 1000,
            easing: 'easeOutExpo',
            formatter: (value) => Math.round(value),
            onComplete: null
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // 모션 축소 설정 확인
        if (!this.settings.enableAnimations) {
            element.textContent = mergedOptions.formatter(end);
            
            if (typeof mergedOptions.onComplete === 'function') {
                mergedOptions.onComplete();
            }
            
            return;
        }
        
        // 이징 함수 정의
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        };
        
        const easing = easingFunctions[mergedOptions.easing] || easingFunctions.linear;
        
        // 초기 설정
        element.textContent = mergedOptions.formatter(start);
        
        // 시작 시간
        const startTime = performance.now();
        
        // 애니메이션 프레임 요청
        const animate = (currentTime) => {
            // 경과 시간 계산
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / mergedOptions.duration, 1);
            const easedProgress = easing(progress);
            
            // 현재 값 계산
            const currentValue = start + (end - start) * easedProgress;
            
            // 값 업데이트
            element.textContent = mergedOptions.formatter(currentValue);
            
            // 애니메이션 계속 또는 완료
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (typeof mergedOptions.onComplete === 'function') {
                mergedOptions.onComplete();
            }
        };
        
        // 애니메이션 시작
        requestAnimationFrame(animate);
    }
}

// 전역 인스턴스 생성
const animationsController = new AnimationsController();
