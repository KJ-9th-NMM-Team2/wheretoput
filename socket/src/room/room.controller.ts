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

  // 1:1 채팅방 생성
  @Post('direct')
  async createRoom(
    @Body() body: { currentUserId: string; otherUserId: string; },
    @Request() req: any,
  ) {
    // console.log("=== 요청 받음 ===");
    // console.log("Body:", body);
    // console.log("Headers:", req.headers);
    // console.log("User:", req.user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.roomService.createRoom({
      currentUserId: body.currentUserId,
      otherUserId: body.otherUserId,
    });
  }

  // 그룹 채팅방 생성
  @Post('group')
  async createGroupRoom(
    @Body() body: { 
      participantIds: string[];
      roomName?: string;
    },
    @Request() req: any,
  ) {
    // JWT 인증 확인
    if (!req.user?.userId) {
      throw new Error('Authentication required');
    }
    
    return this.roomService.createGroupRoom({
      currentUserId: req.user.userId,
      participantIds: body.participantIds,
      roomName: body.roomName,
    });
  }

  // 내가 속한 채팅방 목록을 불러오기
  @Get()
  async getUserRooms(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.roomService.getUserRooms(req.user.userId);
  }
}
