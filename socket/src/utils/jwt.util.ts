import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  userId?: string;
}

/**
 * JWT 토큰에서 사용자 ID를 추출하는 유틸리티 함수
 * 
 * @param jwtService - NestJS JWT 서비스 인스턴스
 * @param token - 검증할 JWT 토큰 (선택사항)
 * @param fallbackUserId - 토큰이 없거나 검증 실패 시 사용할 기본 사용자 ID
 * @returns 추출된 사용자 ID 또는 fallback ID
 * 
 * @example
 * ```typescript
 * const userId = extractUserIdFromToken(
 *   this.jwtService,
 *   socket.handshake.auth?.token,
 *   'default-user-id'
 * );
 * ```
 */
export function extractUserIdFromToken(
  jwtService: JwtService,
  token?: string,
  fallbackUserId: string = 'clu8lhg5w000108l1dcjb6lbe'
): string {
  try {
    if (token) {
      const payload = jwtService.verify<JwtPayload>(token);
      console.log('JWT payload:', payload);
      const userId = payload.userId || fallbackUserId;
      console.log('JWT 디코딩 성공:', { userId });
      return userId;
    } else {
      console.log('토큰이 없음, fallback 사용자 ID 사용');
      return fallbackUserId;
    }
  } catch (error) {
    console.log('JWT 디코딩 실패:', error.message);
    return fallbackUserId;
  }
}