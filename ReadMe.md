#  어따놀래

> **차세대 3D 인테리어 시뮬레이터**

> [**서비스 사용하기 - 바로가기**]()

> [**서비스 소개 영상 - 바로가기**]()

> [**팀 노션 구경하기 - Notion**]()


<br/>

## 📋 목차
#### [**1. 프로젝트 기간**](#Period)
#### [**2. 프로젝트 개요**](#Wheretoput)
#### [**3. 팀원**](#Team)
#### [**4. 기술스택 및 개발환경**](#Stack)
#### [**5. 서비스 아키텍처**](#Architecture)
#### [**6. 프로젝트 포스터**](#Poster)

<a name="Period"></a>
## 📌 프로젝트 기간
*2025.08.27 ~ 2025.09.27 (5주)*

<a name="Wheretoput"></a>

## 📌 프로젝트 개요
**누구나 쉽게, 내 공간을 직접 디자인하고 사람들과 아이디어를 공유하는 플랫폼**

### **기획 배경**
이사나 가구 구매 시 생기는 막막함을 해결하고, 3D에 익숙하지 않은 사용자도 게임처럼 쉽고 재미있게 공간을 설계하는 경험을 제공하고자 했습니다. 또한, AI 기술을 접목하여 사진 한 장만으로 원하는 가구를 3D로 변환하고, 친구나 전문가와 아이디어를 공유하는 **소셜 인테리어 플랫폼**을 목표로 기획했습니다.

### **서비스 주요 기능**

1. **나만의 공간 만들기**: 웹에서 2D 도면을 그리면 실시간으로 3D 공간이 생성됩니다.

2. **AI 가구 모델링**: 가구 사진을 올리면 AI가 분석하여 3D 모델(.glb)을 자동 생성하고 개인 라이브러리에 저장해 줍니다.

3. **3D 시뮬레이터**: 드래그 앤 드롭 방식으로 가구를 배치하고 실시간으로 총비용을 계산할 수 있습니다.

4. **커뮤니티**: 완성된 디자인을 공유하고, 다른 사용자와 실시간 채팅 및 공간 공동 편집이 가능합니다.

5. **실시간 채팅**: 다른 사용자와 실시간으로 대화하며 인테리어 팁과 아이디어 공유가 가능합니다.

<a name="Team"></a>
## 📌 팀원

| 이름 | 깃허브 | 포지션 | 이름 | 깃허브 | 포지션 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 송상록<br>(팀장)     |[@strawberry-tree](https://github.com/strawberry-tree/)      |시뮬레이터 (가구)<br>동시 편집  | 조성진     |[@likewoody](https://github.com/likewoody)      |캐시/DB 최적화<br>CI/CD  |
| 이종호    |[@ssumday24](https://github.com/ssumday24)      |시뮬레이터 (벽, 도면)<br>UI · UX|  오준탁    |[@juntak45](https://github.com/juntak45)      |소켓 인프라 구축<br>실시간 채팅|
| 박수연     |[@SuyeonP25](https://github.com/SuyeonP25)      |시뮬레이터 (공간)<br>가구 조작 패널 |      |      |      |


<a name="Stack"></a>
## 📌 기술스택 및 개발환경
| 분류 | 기술 |
| :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![React Three Fiber](https://img.shields.io/badge/React%20Three%20Fiber-000000?style=for-the-badge&logo=three.js&logoColor=white) ![OpenCV.js](https://img.shields.io/badge/OpenCV.js-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white) ![Socket.io client](https://img.shields.io/badge/Socket.io%20client-010101?style=for-the-badge&logo=socket.io&logoColor=white) |
| **Backend (Socket)** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) |
| **AI** | **Trellis (Image-to-3D)** |
| **Storage** | ![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?style=for-the-badge&logo=Amazon%20S3&logoColor=white) |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Amazon EC2](https://img.shields.io/badge/Amazon%20EC2-FF9900?style=for-the-badge&logo=Amazon%20EC2&logoColor=white) |

<a name="Architecture"></a>
## 📌 서비스 아키텍처
<img width="1367" height="732" alt="서비스 아키텍처" src="https://github.com/user-attachments/assets/488a73fe-f62b-457c-83b9-45e0454817e4" />



<a name="Poster"></a>
## 📌 프로젝트 포스터
