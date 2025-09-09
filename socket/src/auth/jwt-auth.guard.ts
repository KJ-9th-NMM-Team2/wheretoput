import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const type = ctx.getType<'http' | 'ws' | 'rpc'>();

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient<Socket>();

      // 각 소스에서 안전하게 string | undefined 로 추론
      const authToken =
        typeof client.handshake.auth?.token === 'string'
          ? client.handshake.auth.token
          : undefined;

      const queryToken =
        typeof client.handshake.query?.token === 'string'
          ? client.handshake.query.token
          : undefined;

      // any 전파 방지: null 병합 사용
      const token = authToken ?? queryToken;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // verify의 반환 타입을 제네릭으로 고정
      const payload = this.jwtService.verify<{ userId: string; username?: string; sub?: string }>(
        token,
      );

      client.data.userId = payload.userId || payload.sub;
      client.data.username = payload.username;
      return true;
    }

    if (type === 'http') {
      const req: Request & { user?: any } = ctx.switchToHttp().getRequest();
      // 표준: Authorization: Bearer <token>
      const raw = req.headers.authorization || '';
      const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
      if (!token) throw new UnauthorizedException('No token provided');
      const payload = this.jwtService.verify<{ userId: string; username?: string; sub?: string }>(token);
      req.user = { userId: payload.userId || payload.sub, username: payload.username };
      return true;
    }

    throw new UnauthorizedException('Unsupported context');
  }
}
