import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomService } from './room.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 채팅 방 생성
  @Post()
  async createRoom(
    @Body() body: { name: string; description?: string; isPrivate?: boolean },
    @Request() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.roomService.createRoom({
      name: body.name,
      description: body.description,
      createdBy: req.user.userId,
      isPrivate: body.isPrivate,
    });
  }

  // 내가 속한 채팅방 목록을 불러오기
  @Get()
  async getUserRooms(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.roomService.getUserRooms(req.user.userId);
  }
}
