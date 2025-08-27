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

## 기술 스택

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **UI**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **3D Graphics**: Three.js, React Three Fiber

## 개발 명령어

- 도커 사용 안할 시, 아래와 같이 실행하면 됩니다.

```bash
# 개발 서버 시작 (Turbopack 사용)
npm run dev

# 프로덕션 빌드 (Turbopack 사용)
npm run build

# 프로덕션 서버 시작
npm start
```

## 라우팅 구조

- `/` - 메인 페이지
- `/community` - 커뮤니티 페이지
- `/create` - 생성 페이지
- `/follows` - 팔로우 페이지
- `/login` - 로그인 페이지
- `/rooms/[id]` - 특정 룸 페이지
- `/search` - 검색 페이지
- `/setting` - 설정 페이지
- `/sim/[id]` - 시뮬레이션 페이지
- `/users/[id]` - 사용자 프로필 페이지

## 폴더별 상세 설명

각 폴더의 자세한 설명은 해당 폴더 내 README.md 파일을 참조하세요.
