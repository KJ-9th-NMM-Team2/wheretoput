# WhereToput - Next.js 협업 프로젝트

## 프로젝트 구조

```
next/
├── app/                    # Next.js App Router 디렉토리
│   ├── api/               # API 라우트 핸들러들 (전원)
│   ├── chat/              # 채팅 페이지 (준탁)
│   ├── community/         # 커뮤니티 관련 페이지 (상록)
│   ├── create/            # 도면 생성 페이지 (종호)
│   ├── follows/           # 팔로우 관리 페이지 (상록)
│   ├── login/             # 로그인 페이지 (상록)
│   ├── rooms/[id]/        # 동적 라우팅을 통한 룸별 상세 페이지 (상록)
│   ├── search/            # 검색 결과 페이지 (상록)
│   ├── setting/           # 사용자 설정 페이지 (상록)
│   ├── sim/[id]/          # 시뮬레이션 실행 페이지 (수연, 성진)
│   ├── users/[id]/        # 동적 라우팅을 통한 사용자 프로필 페이지 (상록)
│   ├── layout.tsx         # 전체 애플리케이션의 루트 레이아웃 (상록)
│   ├── page.tsx           # 메인 페이지 (/) (상록)
│   └── globals.css        # 전역 스타일 정의 파일 (상록)
├── components/             # 재사용 가능한 React 컴포넌트
│   ├── ui/                # 공통 UI 컴포넌트 (버튼, 입력폼, 모달 등)
│   ├── layout/            # 헤더/네비게이션 (Header, Sidebar, Footer 등)
│   ├── common/            # 유틸리티 컴포넌트 (로딩 스피너, 에러 경계 등)
│   ├── create/            # 도면 생성 관련 컴포넌트 (종호)
│   ├── community/         # 커뮤니티 관련 컴포넌트 (상록)
│   ├── chat/              # 채팅 관련 컴포넌트 (준탁)
│   └── sim/               # 시뮬레이션 관련 컴포넌트 (수연, 성진)
├── public/                # 정적 파일 (이미지, 아이콘 등)
├── next.config.ts         # Next.js 설정 파일
├── package.json           # 프로젝트 의존성 및 스크립트
├── tsconfig.json          # TypeScript 설정
└── postcss.config.mjs     # PostCSS 설정
```

## 개발 명령어

- 도커 사용 안할 시(소켓이랑 같이 돌릴 필요가 없을 시), 아래와 같이 실행하면 됩니다.

```bash
# 의존성 설치
npm install

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
│   ├── Button.tsx          # 재사용 가능한 버튼 컴포넌트
│   ├── Input.tsx           # 입력 폼 컴포넌트
│   └── Modal.tsx           # 모달 컴포넌트
├── layout/
│   ├── Header.tsx          # 헤더 컴포넌트
│   └── Navigation.tsx      # 네비게이션 컴포넌트
├── common/
│   ├── Loading.tsx         # 로딩 스피너 컴포넌트
│   └── ErrorBoundary.tsx   # 에러 바운더리 컴포넌트
├── create/
│   ├── DrawingCanvas.tsx   # 도면 그리기 캔버스 (종호)
│   └── ToolPanel.tsx       # 도구 패널 (종호)
├── community/
│   └── PostCard.tsx        # 커뮤니티 게시글 카드 (상록)
├── chat/
│   └── ChatMessage.tsx     # 채팅 메시지 컴포넌트 (준탁)
└── sim/
    └── SimulationControls.tsx # 시뮬레이션 제어 컴포넌트 (수연, 성진)
```

### `public/`

정적 파일들을 저장하는 디렉토리로, 이미지, 아이콘, favicon 등이 위치합니다.

- **`*.svg`**: 벡터 이미지 파일들 (아이콘, 로고 등)

### 설정 파일들

- **`next.config.ts`**: Next.js 프레임워크 설정
- **`tsconfig.json`**: TypeScript 컴파일러 설정
- **`postcss.config.mjs`**: PostCSS 및 Tailwind CSS 설정
- **`package.json`**: 프로젝트 의존성 및 npm 스크립트 정의

## 개발 가이드라인

### 컴포넌트 작성 규칙

1. **파일명**: PascalCase 사용 (예: `Button.tsx`, `UserProfile.tsx`)
2. **컴포넌트명**: 파일명과 동일하게 작성
3. **Props 인터페이스**: 컴포넌트명 + `Props`로 명명 (예: `ButtonProps`)
4. **팀 정보**: 각 파일 상단에 담당 팀 정보 주석 추가

### 예시 컴포넌트 구조

```tsx
// 파일: components/ui/Button.tsx
// Team: 공통

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  // 컴포넌트 구현
}
```

### 페이지 컴포넌트 구조

```tsx
// 파일: app/community/page.tsx
// Team: 상록

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">커뮤니티</h1>
      {/* 페이지 내용 */}
    </div>
  );
}
```

### 스타일링 가이드

- **Tailwind CSS** 사용 권장
- **일관된 spacing**: `px-4 py-8`, `mb-6` 등 일관된 간격 사용
- **반응형 디자인**: 모바일 우선 접근법 사용
- **다크모드**: 필요시 `dark:` 접두사 활용

### Git 커밋 가이드

```bash
# 기능 추가
feat: 커뮤니티 게시글 목록 컴포넌트 추가

# 버그 수정
fix: 로그인 폼 validation 오류 수정

# 스타일 변경
style: 버튼 컴포넌트 hover 효과 개선

# 리팩토링
refactor: API 호출 로직 중복 제거
```

## 기술 스택

- **프레임워크**: Next.js 15.5.2 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **빌드 도구**: Turbopack
- **3D 라이브러리**: Three.js, React Three Fiber

## 팀별 담당 영역

| 팀원 | 담당 영역 |
|------|-----------|
| 상록 | 메인, 커뮤니티, 로그인, 검색, 설정, 룸 상세, 사용자 프로필, 팔로우 |
| 종호 | 도면 생성 |
| 준탁 | 채팅 |
| 수연, 성진 | 시뮬레이션 |
| 전원 | API 개발 |

## 협업 시 주의사항

1. **브랜치 전략**: feature 브랜치를 사용하여 개발 후 PR로 병합
2. **코드 리뷰**: 모든 PR은 최소 1명 이상의 리뷰 후 병합
3. **의존성 추가**: 새로운 패키지 설치 시 팀에 공유 후 진행
4. **컴포넌트 재사용**: 기존 컴포넌트를 최대한 활용하여 일관성 유지
5. **타입 안전성**: TypeScript를 적극 활용하여 타입 안전성 확보
