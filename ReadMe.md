# 🏠 어따놀래

**차세대 3D 인테리어 시뮬레이터**

누구나 쉽게, 내 공간을 직접 디자인하고 전 세계 사람들과 아이디어를 공유하는 플랫폼

---

## 1. 📖 프로젝트 개요

**어따놀래**는 이사, 가구 구매, 또는 방 구조 변경을 고민하는 모든 사람들을 위한 **웹 기반 3D 인테리어 시뮬레이터**입니다.

- 복잡한 프로그램 없이 웹 브라우저에서 2D 도면을 그릴 수 있음
- AI를 통해 가구 사진을 **3D 모델**로 변환
- 가상 공간에 배치 후, 커뮤니티를 통해 다른 사람들과 **아이디어 공유 및 피드백** 가능
- 전문가와의 소통, 협업 기능 제공

---

## 2. 💡 주제 선정 배경

이사나 가구 구매 시 생기는 막막함을 해결하기 위해 **세 가지 목표**를 설정했습니다.

1. **직관적인 경험**

   - 3D에 익숙하지 않아도 게임처럼 쉽고 재미있게 설계 가능

2. **AI 기술 접목**

   - 사진 한 장으로 원하는 가구를 가상 공간에 자동 배치

3. **소통과 공유**

   - 친구, 동거인, 전문가와 함께 아이디어를 나누는 **소셜 인테리어 플랫폼**

---

## 3. ✨ 핵심 기능

### 🎨 1. 나만의 공간 만들기 (도면 그리기)

- **2D 기반 드로잉**: 격자(Grid) UI에서 직관적으로 벽 그리기
- **정밀 제어**: 벽 길이, 두께 등 수치 입력 가능
- **문/창문 배치**: 에셋 라이브러리 활용
- **실시간 3D 변환**: 2D → 3D 자동 반영

### 🤖 2. AI 가구 모델링 (사진 → 3D 변환)

- **이미지 업로드** → AI 분석
- **3D 모델(.glb) 자동 생성**
- **개인 라이브러리 저장 및 재사용 가능**

### 🛋️ 3. 3D 가구 배치 시뮬레이터

- **드래그 앤 드롭**으로 직관적인 배치
- **React Three Fiber 기반 실시간 렌더링**
- **정밀 변환** (위치, 회전, 크기 조정)
- **실시간 비용 계산** (총 가구 가격 집계)

### 💬 4. 커뮤니티 및 소셜 기능

- **디자인 공유**: 스냅샷과 함께 게시
- **사용자 팔로우 & 피드 구독**
- **실시간 협업 채팅** (NestJS WebSocket)
- **멀티 유저 공간 편집 지원**

---

## 4. 🛠️ 기술 스택 및 아키텍처

### 🏗️ 아키텍처

```
┌────────────────────┐
│  Frontend (Client) │
└────────────────────┘
├── ⚛️ Next.js (UI, SSR/SSG, API Server)
├── 🧊 React Three Fiber (3D Rendering)
├── 🎨 OpenCV.js (Floor Plan Analysis)
└── 🔌 WebSocket Client (Socket.io-client)
     │
     │ (WebSocket Connection)
     ▼
┌────────────────────┐
│  Socket Server     │
└────────────────────┘
├── ✅ NestJS (Real-time Communication)
└── 🌐 WebSocket Gateway

┌────────────────────┐
│  External Services │
└────────────────────┘
├── 🤖 AI: Claude Sonnet 4 (Image-to-3D)
├── 🗄️ DB: PostgreSQL (Metadata Storage)
└── 📦 Storage: Amazon S3 (File Storage)
```

### ⚙️ 기술 스택

- **Frontend**: Next.js, React, React Three Fiber, OpenCV.js, Socket.io-client
- **Backend (Socket)**: NestJS, Socket.io
- **Database**: PostgreSQL
- **AI**: Claude Sonnet 4
- **Storage**: Amazon S3
- **DevOps**: Docker, Amazon EC2

### 작업 가이드

```
# 개발환경
npm run dev

# 배포환경
npm run prod

# 컨테이너 종료
npm run down

# 빌드가 필요할 때:
npm run dev:build
npm run prod:build
```
