import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
  Post,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// JWT 로그인한 사용자만 접근
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 입장시 메시지 가져오기
  @Post('message')
  async list(
    @Body() body: { roomId: string; userId: string; content: string; },
  ) {
    // const n = Number(limit) || 50;
    // const messages = await this.chatService.getRecentMessages({
    //   roomId,
    //   userId: req.user.userId,
    //   limit: n,
    //   beforeId: before,
    // });
    return this.chatService.saveMessage({
      roomId: body.roomId,
      userId: body.userId,
      content: body.content,
    });
  }
}
