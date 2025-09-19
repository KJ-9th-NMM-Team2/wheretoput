#  어따놀래

> **우리 집 꾸미기 시뮬레이터**

## 프로젝트 포스터 (변경 가능)
<img width="2245" height="3179" alt="어따놀래 포스터" src="https://github.com/user-attachments/assets/12f22cc5-92a2-4dae-b5f9-6c9a77efe0c7" />


## 서비스 소개 영상 (변경 가능)
작업중

<br/>

## 목차

#### [**1. 프로젝트 개요**](#Wheretoput)
#### [**2. 팀원**](#Team)
#### [**3. 프로젝트 기간**](#Period)
#### [**4. 기술스택 및 개발환경**](#Stack)
#### [**5. 서비스 아키텍처**](#Architecture)
#### [**6. 기술적 챌린지**](#Challenges)


<a name="Wheretoput"></a>

## 프로젝트 개요
**누구나 쉽게, 내 공간을 직접 디자인하고 사람들과 아이디어를 공유하는 플랫폼**

### **기획 배경**
이사나 가구 구매 시 생기는 막막함을 해결하고, 3D에 익숙하지 않은 사용자도 게임처럼 쉽고 재미있게 공간을 설계하는 경험을 제공하고자 했습니다. 가구 실측 데이터를 반영한 AI가 생성한 가구 모델을 사용하여, 직접 놓아본 듯 생생하고 현실감 넘치는 인테리어 경험을 제공합니다.

### **서비스 주요 기능**

1. **나만의 공간 만들기**: 도면을 업로드하면 벽면을 인식해 3D 공간을 생성합니다.
 
2. **AI 가구 모델링**: 가구 실측 데이터를 반영한, AI 생성 가구 3D 모델(.glb)을 제공합니다.

3. **3D 시뮬레이터**: 가구 모델을 생성한 3D 공간에 자유롭게 배치할 수 있습니다.

4. **실시간 협업**: 다른 사용자와 채팅을 소통하며, 동시에 가구를 함께 배치할 수 있습니다.

5. **랜선 집들이**: 완성된 집을 공유하고, 다른 사용자와 집에도 방문할 수 있습니다.

<a name="Team"></a>
## 📌 팀원

| 이름 | 깃허브 | 포지션 |
| :--- | :--- | :--- |
| 송상록(팀장)     |[@strawberry-tree](https://github.com/strawberry-tree/)      |시뮬레이터 (가구), 동시 편집  |
| 이종호    |[@ssumday24](https://github.com/ssumday24)      |시뮬레이터 (벽, 도면), UI · UX|  
| 박수연     |[@SuyeonP25](https://github.com/SuyeonP25)      |시뮬레이터 (공간), 가구 조작 패널 |
|오준탁    |[@juntak45](https://github.com/juntak45)      |소켓 인프라 구축, 실시간 채팅|
|조성진     |[@likewoody](https://github.com/likewoody)      |캐시/DB 최적화, CI/CD  |

<a name="Period"></a>
## 프로젝트 기간
*2025.08.21 ~ 2025.09.27 (6주)*
- 2025.08.21 ~ 2025.08.26: 기획
- 2025.08.27 ~ 2025.09.09: MVP 제작
- 2025.09.10 ~ 2025.09.16: 폴리싱
- 2025.09.17 ~ 2025.09.27: QA, 문서화, 최종 발표 준비

<a name="Stack"></a>
## 📌 기술스택 및 개발환경
| 분류 | 기술 |
| :--- | :--- |
| **Client + API Server** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) |
| **Client** | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![React Three Fiber](https://img.shields.io/badge/React%20Three%20Fiber-000000?style=for-the-badge&logo=three.js&logoColor=white) ![OpenCV.js](https://img.shields.io/badge/OpenCV.js-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white) ![Socket.io client](https://img.shields.io/badge/Socket.io%20client-010101?style=for-the-badge&logo=socket.io&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-FF6B6B?style=for-the-badge&logo=react&logoColor=white) |
| **Socket Server** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) |
| **3D Modeling** | ![DRACO](https://img.shields.io/badge/DRACO-4285F4?style=for-the-badge&logo=google&logoColor=white) ![glTF](https://img.shields.io/badge/glTF%20Transform-FF6B35?style=for-the-badge&logo=khronos&logoColor=white) ![TRELLIS](https://img.shields.io/badge/TRELLIS-FF4081?style=for-the-badge&logo=3d&logoColor=white) |
| **Storage** | ![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?style=for-the-badge&logo=Amazon%20S3&logoColor=white) ![Amazon CloudFront](https://img.shields.io/badge/Amazon%20CloudFront-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white) |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Amazon EC2](https://img.shields.io/badge/Amazon%20EC2-FF9900?style=for-the-badge&logo=Amazon%20EC2&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white) |
| **Infrastructure** | ![Amazon Route 53](https://img.shields.io/badge/Amazon%20Route%2053-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white) ![Amazon ALB](https://img.shields.io/badge/Amazon%20ALB-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white) |

<a name="Architecture"></a>
## 📌 서비스 아키텍처
<img width="1367" height="732" alt="서비스 아키텍처" src="https://github.com/user-attachments/assets/488a73fe-f62b-457c-83b9-45e0454817e4" />

<a name="Challenges"></a>
## 기술적 챌린지
[위키를 확인해 주세요.](https://github.com/KJ-9th-NMM-Team2/wheretoput/wiki)

