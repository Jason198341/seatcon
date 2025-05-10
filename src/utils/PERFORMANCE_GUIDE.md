# 성능 최적화 가이드

이 문서는 컨퍼런스 채팅 애플리케이션의 성능을 최적화하기 위한 가이드라인을 제공합니다.

## 1. 컴포넌트 최적화

### 1.1 React.memo 사용
렌더링 성능을 향상시키기 위해 다음과 같은 컴포넌트에 `React.memo`를 적용하세요:

```jsx
// 변경 전
function MyComponent(props) {
  // ...
}

// 변경 후
const MyComponent = React.memo(function MyComponent(props) {
  // ...
});
```

특히 다음 컴포넌트에 적용해야 합니다:
- `ExhibitList` 및 `ExhibitItem` 컴포넌트
- `PresentationList` 및 `PresentationItem` 컴포넌트
- `ScheduleList` 및 `ScheduleItem` 컴포넌트
- `ChatRoomList` 및 `MessageList` 컴포넌트

### 1.2 useCallback 및 useMemo 사용
- 이벤트 핸들러에 `useCallback` 적용하기
- 복잡한 계산에 `useMemo` 적용하기

```jsx
// 이벤트 핸들러 최적화
const handleSubmit = useCallback((event) => {
  // 이벤트 처리 로직
}, [dependencies]);

// 복잡한 계산 최적화
const filteredData = useMemo(() => {
  return data.filter(item => item.property === value);
}, [data, value]);
```

## 2. 코드 스플리팅 및 지연 로딩

### 2.1 라우트 기반 코드 스플리팅
React Router와 함께 `React.lazy`와 `Suspense`를 사용하여 라우트 기반 코드 스플리팅을 구현하세요:

```jsx
import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const ExhibitListPage = lazy(() => import('./pages/exhibit/ExhibitListPage'));
// ... 다른 페이지 컴포넌트

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/exhibits" component={ExhibitListPage} />
        {/* ... 다른 라우트 */}
      </Switch>
    </Suspense>
  );
}
```

### 2.2 컴포넌트 지연 로딩
자주 사용하지 않는 큰 컴포넌트를 지연 로딩하세요:

```jsx
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

function MyComponent() {
  const [showHeavy, setShowHeavy] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>무거운 컴포넌트 표시</button>
      {showHeavy && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}
```

## 3. API 호출 최적화

### 3.1 캐싱 구현
반복적인 API 호출을 피하기 위해 데이터 캐싱을 구현하세요:

```jsx
// 단순한 캐싱 메커니즘
const cache = {};

async function fetchWithCache(url, ttl = 5 * 60 * 1000) {
  const now = Date.now();
  
  if (cache[url] && now - cache[url].timestamp < ttl) {
    return cache[url].data;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  cache[url] = {
    data,
    timestamp: now,
  };
  
  return data;
}
```

### 3.2 데이터 프리페칭
사용자 경험을 향상시키기 위해 데이터를 미리 불러오세요:

```jsx
// 마우스가 링크 위에 있을 때 데이터 미리 불러오기
function MyLink({ to, prefetchUrl, children }) {
  const handleMouseEnter = () => {
    fetchWithCache(prefetchUrl);
  };
  
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

## 4. 웹 성능 최적화

### 4.1 이미지 최적화
- 이미지는 적절한 크기와 형식(WebP)으로 제공하세요.
- `loading="lazy"` 속성을 사용하여 이미지 지연 로딩을 구현하세요.

```jsx
<img 
  src="image.webp" 
  alt="Description" 
  loading="lazy" 
  width="300" 
  height="200" 
/>
```

### 4.2 폰트 최적화
- 웹 폰트를 최적화하기 위해 `font-display: swap`을 사용하세요.
- 필요한 글리프만 포함하는 서브셋 폰트를 사용하세요.

```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont.woff2') format('woff2');
  font-display: swap;
}
```

## 5. 번역 API 최적화

### 5.1 번역 캐싱
반복적인 번역 요청을 피하기 위해 번역 결과를 캐싱하세요:

```jsx
const translationCache = {};

// 번역 함수
async function translateWithCache(text, targetLang, sourceLang = 'auto') {
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  const result = await translateText(text, targetLang, sourceLang);
  translationCache[cacheKey] = result;
  
  return result;
}
```

### 5.2 배치 처리
여러 번역 요청을 그룹화하여 API 호출 수를 줄이세요:

```jsx
// 배치 처리 구현
const translationQueue = [];
let translationTimer = null;

function batchTranslate(text, targetLang, sourceLang = 'auto', callback) {
  translationQueue.push({
    text,
    targetLang,
    sourceLang,
    callback,
  });
  
  if (!translationTimer) {
    translationTimer = setTimeout(processBatch, 100);
  }
}

async function processBatch() {
  const batch = [...translationQueue];
  translationQueue.length = 0;
  translationTimer = null;
  
  // API를 통해 배치 번역 수행
  // ...
  
  // 결과 처리
  batch.forEach((item, index) => {
    item.callback(results[index]);
  });
}
```

## 6. 채팅 성능 최적화

### 6.1 윈도우 기반 메시지 페이지네이션
채팅 메시지를 처리할 때 윈도우 기반 접근 방식을 사용하세요:

```jsx
function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [windowStart, setWindowStart] = useState(0);
  const WINDOW_SIZE = 50;
  
  useEffect(() => {
    // 보이는 메시지 업데이트
    const newVisibleMessages = messages.slice(
      windowStart, 
      windowStart + WINDOW_SIZE
    );
    
    setVisibleMessages(newVisibleMessages);
  }, [messages, windowStart]);
  
  const loadMore = () => {
    setWindowStart(Math.max(0, windowStart - 20));
  };
  
  return (
    <div>
      {windowStart > 0 && (
        <button onClick={loadMore}>이전 메시지 로드</button>
      )}
      
      {visibleMessages.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
```

### 6.2 메시지 가상화
많은 메시지를 효율적으로 렌더링하기 위해 가상화 라이브러리(`react-window`)를 사용하세요:

```jsx
import { FixedSizeList as List } from 'react-window';

function MessageList({ messages }) {
  const MessageRow = ({ index, style }) => {
    const message = messages[index];
    return (
      <div style={style}>
        <MessageItem message={message} />
      </div>
    );
  };
  
  return (
    <List
      height={500}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {MessageRow}
    </List>
  );
}
```

## 7. 상태 관리 최적화

### 7.1 상태 정규화
복잡한 상태 객체를 정규화하여 관리하세요:

```jsx
// 변경 전
const state = {
  users: [
    {
      id: 1,
      name: 'User1',
      messages: [{ id: 1, text: 'Hello' }, { id: 2, text: 'World' }]
    }
  ]
};

// 변경 후
const normalizedState = {
  users: {
    byId: {
      1: { id: 1, name: 'User1', messageIds: [1, 2] }
    },
    allIds: [1]
  },
  messages: {
    byId: {
      1: { id: 1, text: 'Hello', userId: 1 },
      2: { id: 2, text: 'World', userId: 1 }
    },
    allIds: [1, 2]
  }
};
```

### 7.2 상태 업데이트 최적화
중첩된 객체를 업데이트할 때 불변성을 유지하면서 성능을 최적화하세요:

```jsx
// 불변성 유지 헬퍼 함수
function updateItemInArray(array, itemId, updateItemCallback) {
  return array.map(item => {
    if (item.id !== itemId) {
      return item;
    }
    
    return updateItemCallback(item);
  });
}
```

## 8. 빌드 최적화

### 8.1 번들 분석
`source-map-explorer`를 사용하여 번들 크기를 분석하세요:

```bash
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer build/static/js/main.*.js
```

### 8.2 트리 쉐이킹
사용하지 않는 코드를 제거하기 위해 트리 쉐이킹을 활용하세요:

```jsx
// 변경 전
import * as utils from './utils';

// 변경 후
import { specificFunction } from './utils';
```

## 9. 모니터링 및 측정

### 9.1 성능 측정
React DevTools Profiler를 사용하여 컴포넌트 렌더링 성능을 측정하세요.

### 9.2 성능 모니터링
Web Vitals를 사용하여 주요 성능 지표를 모니터링하세요:

```jsx
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // 분석 서비스로 메트릭 전송
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

## 10. 접근성 및 사용자 경험

### 10.1 키보드 접근성
모든 상호작용 요소를 키보드로 접근할 수 있도록 하세요:

```jsx
function Button({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(e);
        }
      }}
      tabIndex={0}
    >
      {children}
    </button>
  );
}
```

### 10.2 다크 모드 지원
다크 모드를 지원하여 사용자 경험을 향상시키세요:

```jsx
function App() {
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  return (
    <div className={darkMode ? 'dark-theme' : 'light-theme'}>
      <button onClick={() => setDarkMode(!darkMode)}>
        테마 전환
      </button>
      {/* 앱 컨텐츠 */}
    </div>
  );
}
```
