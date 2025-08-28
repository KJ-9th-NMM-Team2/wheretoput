# Next.js 프로젝트

## 프로젝트 구조

```
next/
├── app/                    # Next.js App Router 디렉토리
├── components/             # 재사용 가능한 React 컴포넌트
├── public/                # 정적 파일 (이미지, 아이콘 등)
├── next.config.ts         # Next.js 설정 파일
├── package.json           # 프로젝트 의존성 및 스크립트
├── tsconfig.json          # TypeScript 설정
└── postcss.config.mjs     # PostCSS 설정
```

## 개발 명령어

- 도커 사용 안할 시(소켓이랑 같이 돌릴 필요가 없을 시), 아래와 같이 실행하면 됩니다.

```bash
# 개발 서버 시작 (Turbopack 사용)
npm run dev

# 프로덕션 빌드 (Turbopack 사용)
npm run build

# 프로덕션 서버 시작
npm start
```

## 라우팅 구조

- `/`: 메인 페이지 (상록)
- `/api`: api 백엔드 서버 역할 (전원)
- `/community`: 커뮤니티 페이지 (상록)
- `/create`: 도면생성 페이지 (종호)
- `/chat`: 채팅 페이지 (준탁, 최종적으로는 팝업으로 구현하겠지만 일단 개발 편의 위해 별도 페이지에서 우선 개발하는 게 좋을 듯합니다)
- `/follows`: 팔로우 페이지 (상록)
- `/login`: 로그인 페이지 (상록)
- `/rooms/[id]`: 특정 룸 소개 페이지 (상록)
- `/search`: 검색 결과 페이지 (상록)
- `/setting`: 설정 페이지 (상록)
- `/sim/[id]`: 시뮬레이션 페이지 (수연, 성진)
- `/users/[id]`: 사용자 프로필 페이지 (상록)

## 폴더별 상세 설명

### `app/`

Next.js App Router의 핵심 디렉토리로, 파일 시스템 기반 라우팅을 사용합니다.

각 폴더의 `page.tsx`에 정의된 컴포넌트가 기본적으로 렌더링됩니다.

- **`layout.tsx`**: 전체 애플리케이션의 루트 레이아웃 (상록)
- **`page.tsx`**: 메인 페이지 (`/`) (상록)
- **`globals.css`**: 전역 스타일 정의 파일 (상록)
- **`api/`**: API 라우트 핸들러들이 위치한 디렉토리 (전원)
- **`chat/`**: 채팅 (준탁)
- **`community/`**: 커뮤니티 관련 페이지 (상록)
- **`create/`**: 도면 생성 페이지 (종호)
- **`follows/`**: 팔로우 관리 페이지 (상록)
- **`login/`**: 로그인 페이지 (상록)
- **`rooms/[id]/`**: 동적 라우팅을 통한 룸별 상세 페이지 (상록)
- **`search/`**: 검색 결과 페이지 (상록)
- **`setting/`**: 사용자 설정 페이지 (상록)
- **`sim/[id]/`**: 시뮬레이션 실행 페이지 (수연 성진)
- **`users/[id]/`**: 동적 라우팅을 통한 사용자 프로필 페이지 (상록)

## 컴포넌트 저장 가이드

- **공통 UI 컴포넌트**: `components/ui/` (버튼, 입력폼, 모달 등)
- **헤더/네비게이션**: `components/layout/` (Header, Sidebar, Footer 등)
- **페이지별 특화 컴포넌트**: `components/[페이지명]/` (예: `components/create/`, `components/community/`)
- **유틸리티 컴포넌트**: `components/common/` (로딩 스피너, 에러 경계 등)

**예시 구조:**

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── layout/
│   ├── Header.tsx
│   └── Navigation.tsx
├── create/
│   ├── DrawingCanvas.tsx
│   └── ToolPanel.tsx
└── common/
    ├── Loading.tsx
    └── ErrorBoundary.tsx
```

### `public/`

정적 파일들을 저장하는 디렉토리로, 이미지, 아이콘, favicon 등이 위치합니다.

- **`*.svg`**: 벡터 이미지 파일들 (아이콘, 로고 등)

### 설정 파일들

- **`next.config.ts`**: Next.js 프레임워크 설정
- **`tsconfig.json`**: TypeScript 컴파일러 설정
- **`postcss.config.mjs`**: PostCSS 및 Tailwind CSS 설정
- **`package.json`**: 프로젝트 의존성 및 npm 스크립트 정의
