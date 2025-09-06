팔로우 시스템 작동 프로세스:

  1. 버튼 클릭 → handleFollowToggle() 함수 실행
  2. 세션 확인 → 로그인한 사용자와 대상 사용자 ID 검증
  3. API 호출 → followUser(user_id) 함수가 POST 요청 전송
    - URL: /api/users/[id]/follow
    - credentials: "include"로 세션 쿠키 포함
  4. 서버 처리 → API 라우트에서:
    - 세션 인증 (auth())
    - 중복 팔로우 체크
    - DB에 팔로우 관계 생성 (prisma.follows.create)
  5. 응답 처리 → 성공 시:
    - setIsFollowing(true) - 버튼 상태 변경
    - setFollowersCount(prev => prev + 1) - 팔로워 수 증가
    - UI 실시간 업데이트

  API 엔드포인트
  - GET /api/users/[id]/followers - 팔로워 목록
  - GET /api/users/[id]/following - 팔로잉 목록
  - POST /api/users/[id]/follow - 팔로우하기
  - DELETE /api/users/[id]/follow - 언팔로우하기
  - DELETE /api/users/[id]/followers/[followerId] - 팔로워 제거

  lib/api/users.ts에 함수 추가
  export async function fetchFollowers(userId: string): Promise<User[]>       
  export async function fetchFollowing(userId: string): Promise<User[]>       
  export async function followUser(userId: string): Promise<boolean>
  export async function unfollowUser(userId: string): Promise<boolean>        
