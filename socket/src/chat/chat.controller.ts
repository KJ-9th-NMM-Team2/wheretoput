// src/chat/chat.controller.ts
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

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':roomId/messages')
  async list(
    @Param('roomId') roomId: string,
    @Query('limit') limit = '50',
    @Request() req: any, // ← required를 앞으로
    @Query('before') before?: string, // ← optional은 뒤로
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
