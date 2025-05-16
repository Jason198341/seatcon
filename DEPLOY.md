# GitHub Pages 배포 가이드

## 배포 준비

1. **보안 설정 확인**
   - `js/config.js` 파일에 있는 API 키를 확인하고, 필요한 경우 대체하세요.
   - 실제 운영 환경에서는 API 키를 환경 변수나 보안 스토리지에 저장하는 것이 좋습니다.

2. **GitHub Pages에 배포하기 전에 다음 사항을 고려하세요**
   - CORS (Cross-Origin Resource Sharing) 이슈: Supabase 및 Google Cloud Translation API는 CORS 설정이 필요할 수 있습니다.
   - 대규모 사용자를 지원하기 위한 스케일링 전략을 고려하세요.
   - 중요 데이터는 서버 측에서 처리하도록 변경하는 것이 좋습니다.

## GitHub Pages 배포 과정

1. GitHub 저장소에 코드 푸시:
   ```bash
   git add .
   git commit -m "Initial release of Global SeatCon 2025 Conference Chat"
   git push origin main
   ```

2. GitHub 저장소 설정에서 Pages 활성화:
   - 저장소 설정 → Pages → Source: "Deploy from a branch" → Branch: "main" → 저장

3. 배포 후 확인:
   - 배포가 완료되면 `https://[사용자명].github.io/conference-chat` 주소로 접속 가능
   - 채팅 애플리케이션은 `https://[사용자명].github.io/conference-chat/chat/` 에서 사용 가능
   - 관리자 페이지는 `https://[사용자명].github.io/conference-chat/admin.html` 에서 접속 가능

## 주의사항

1. **API 키 보안**
   - GitHub Pages는 공개적으로 접근 가능한 정적 웹 호스팅입니다.
   - js/config.js 파일에 민감한 API 키를 그대로 노출하면 보안 위험이 있습니다.
   - 프로덕션 환경에서는 서버 측 프록시나 환경 변수를 사용하여 API 키를 보호하세요.

2. **Supabase 설정**
   - 프로덕션 환경에서는 Supabase 프로젝트의 보안 설정을 적절하게 구성하세요.
   - RLS(Row Level Security) 정책을 설정하여 데이터 접근을 제한하세요.

3. **Google Cloud Translation API**
   - API 키에 제한을 설정하여 무단 사용을 방지하세요.
   - API 사용량을 모니터링하고 할당량 초과를 방지하세요.

4. **관리자 인증**
   - 현재 관리자 인증은 클라이언트 측에서 처리됩니다.
   - 실제 운영 환경에서는 서버 측 인증으로 변경하는 것이 좋습니다.

## 커스터마이징

1. **도메인 설정**
   - 사용자 정의 도메인을 설정하려면 GitHub Pages 설정에서 "Custom domain" 섹션을 참조하세요.

2. **테마 및 스타일 변경**
   - CSS 파일을 수정하여 애플리케이션의 시각적 디자인을 변경할 수 있습니다.

3. **기능 확장**
   - 이모지 지원, 파일 공유, 화상 채팅 등의 기능을 추가할 수 있습니다.