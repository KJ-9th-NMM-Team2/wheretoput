import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// JWT 로그인한 사용자만 접근
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 입장시 메시지 가져오기
  @Get(':roomId/messages')
  async list(
    @Param('roomId') roomId: string,
    @Query('limit') limit = '50',
    @Request() req: any,
    @Query('before') before?: string,
  ) {
    const n = Number(limit) || 50;
    const messages = await this.chatService.getRecentMessages({
      roomId,
      userId: req.user.userId,
      limit: n,
      beforeId: before,
    });
    return { roomId, messages };
  }
}
