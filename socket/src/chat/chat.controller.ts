import {
  Controller,
  Get,
  Delete,
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
    @Query('currentUserId') currentUserId: string,
    @Query('before') before?: string,
  ) {
    const n = Number(limit) || 50;
    const messages = await this.chatService.getRecentMessages({
      roomId,
      userId: currentUserId,
      limit: n,
      beforeId: before,
    });
    console.log('확인한 메시지', messages);
    return { roomId, messages };
  }

  // 채팅방 완전 삭제 (개발자용)
  @Delete(':roomId/delete-completely')
  async deleteRoomCompletely(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ) {
    const result = await this.chatService.deleteRoomCompletely(
      roomId,
      req.user.userId,
    );
    return result;
  }
}
