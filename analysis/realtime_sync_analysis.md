# 실시간 메시지 동기화 기능 분석

## 1. 현재 구현 방식 분석

현재 실시간 메시지 동기화는 Supabase의 실시간 기능을 사용하여 구현되어 있습니다. 핵심 구현 부분은 `database.js` 파일의 `subscribeToMessages` 메서드입니다.

```javascript
subscribeToMessages(callback) {
    if (this.messageSubscription) {
        this.messageSubscription.unsubscribe();
    }
    
    console.log('메시지 구독 시작 시도...');
    
    try {
        // 채널 이름을 'messages'로 변경 (Supabase의 기본 채널 형식)
        this.messageSubscription = this.client
            .channel('messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' }, 
                async payload => {
                    const message = payload.new;
                    console.log('새 메시지 수신:', message);
                    
                    // 자신의 메시지도 실시간으로 업데이트 처리
                    // 기존 코드는 자신의 메시지를 무시했지만 이제는 처리합니다
                    
                    // 번역 처리
                    if (this.currentUser && this.currentUser.language !== message.language) {
                        try {
                            const translatedContent = await translationService.translateText(
                                message.content,
                                message.language,
                                this.currentUser.language
                            );
                            
                            message.translatedContent = translatedContent;
                            message.targetLanguage = this.currentUser.language;
                        } catch (error) {
                            console.error('메시지 번역 실패:', error);
                        }
                    }
                    
                    callback(message);
                }
            )
            .subscribe((status) => {
                console.log('메시지 구독 상태:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('메시지 구독이 성공적으로 활성화되었습니다');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('메시지 구독 중 채널 오류가 발생했습니다');
                    // 재구독 시도
                    setTimeout(() => this.subscribeToMessages(callback), 3000);
                }
            });
            
        console.log('메시지 구독 시작 완료');
    } catch (error) {
        console.error('메시지 구독 시작 실패:', error);
        alert('실시간 메시지 수신에 문제가 발생했습니다. 페이지를 새로고침하세요.');
    }
}
```

## 2. 현재 구현의 문제점

1. **채널 이름 설정**: 채널 이름이 'messages'로 되어 있으나, Supabase에서는 특정 패턴의 채널 이름이 더 효과적일 수 있습니다.

2. **구독 필터링**: 현재는 모든 메시지 INSERT에 대해 리스너가 작동하고 있으며, room_id 기반 필터링이 적용되지 않고 있습니다.

3. **메시지 표시 처리**: UI에 메시지를 추가하는 부분에서 임시 메시지 처리 로직이 불명확합니다.

4. **상태 관리**: 사용자의 온라인/오프라인 상태가 실시간으로 업데이트되지 않고 있습니다.

5. **재시도 메커니즘**: 구독 실패 시 재시도 로직이 있지만, 지수 백오프 방식이 아닌 고정 시간 재시도를 사용하고 있습니다.

## 3. 개선 방향

1. **채널 이름 최적화**: 특정 room_id를 포함한 채널 이름으로 변경하여 관련성 높은 이벤트만 수신하도록 개선합니다.

2. **구독 필터링 강화**: 
   ```javascript
   .on('postgres_changes', 
       { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${this.roomId}` },
       // 콜백 함수
   )
   ```

3. **메시지 UI 처리 개선**: 임시 메시지와 실제 수신된 메시지 간의 매칭 및 교체 로직을 명확히 구현합니다.

4. **실시간 상태 관리**: Presence 기능을 활용해 사용자 온라인 상태를 실시간으로 업데이트합니다.

5. **지수 백오프 재시도**: 연결 실패 시 점진적으로 재시도 간격을 늘리는 지수 백오프 방식을 적용합니다.

6. **동시 사용자 지원 강화**: 여러 사용자가 동시에 메시지를 보낼 때 발생할 수 있는 경쟁 상태를 방지합니다.

7. **디버깅 개선**: 실시간 이벤트 흐름을 추적하기 위한 로깅을 강화하고, 사용자에게 연결 상태를 명확히 표시합니다.

## 4. 구현 계획

1. 채널 구독 방식 수정
2. 메시지 처리 로직 개선
3. 사용자 상태 관리 최적화
4. 오류 처리 및 재시도 메커니즘 강화
5. 동시 사용자 지원 기능 추가
6. UI 피드백 강화
