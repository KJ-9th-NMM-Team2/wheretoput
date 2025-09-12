import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  HttpException,
  HttpStatus,
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
    @Body() body: { currentUserId: string; otherUserId: string },
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
    @Body()
    body: {
      participantIds: string[];
      simRoomId?: string; // 협업용 시뮬레이터 room ID
    },
    @Request() req: any,
  ) {
    try {
      // JWT 인증 확인
      if (!req.user?.userId) {
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const room = await this.roomService.createGroupRoom({
        currentUserId: req.user.userId,
        participantIds: body.participantIds,
        simRoomId: body.simRoomId,
      });

      return {
        success: true,
        chat_room_id: room.chat_room_id,
        name: room.name,
        created_at: room.created_at,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 협업 채팅방 조회 및 참가
  @Post('collab/:simRoomId/join')
  async joinCollabRoom(
    @Param('simRoomId') simRoomId: string,
    @Request() req: any,
  ) {
    try {
      if (!req.user?.userId) {
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 1. 기존 협업 채팅방 조회
      const existingChatRoom =
        await this.roomService.getCollabChatRoom(simRoomId);

      if (existingChatRoom) {
        // 2. 기존 채팅방이 있으면 사용자를 참가자로 추가
        await this.roomService.addParticipantToRoom(
          existingChatRoom.chat_room_id,
          req.user.userId,
        );

        return {
          success: true,
          joined: true,
          chatRoom: {
            chat_room_id: existingChatRoom.chat_room_id,
            name: existingChatRoom.name,
            is_private: existingChatRoom.is_private,
            created_at: existingChatRoom.created_at,
            participants: existingChatRoom.chat_participants,
          },
        };
      } else {
        // 3. 채팅방이 없으면 null 반환 (방장이 아직 생성하지 않음)
        return {
          success: true,
          joined: false,
          chatRoom: null,
        };
      }
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 협업 채팅방 조회만 (참가하지 않고)
  @Get('collab/:simRoomId/chat')
  async getCollabChatRoom(@Param('simRoomId') simRoomId: string) {
    try {
      const chatRoom = await this.roomService.getCollabChatRoom(simRoomId);

      if (chatRoom) {
        return {
          success: true,
          chatRoom: {
            chat_room_id: chatRoom.chat_room_id,
            name: chatRoom.name,
            is_private: chatRoom.is_private,
            created_at: chatRoom.created_at,
            participants: chatRoom.chat_participants,
          },
        };
      } else {
        return {
          success: true,
          chatRoom: null,
        };
      }
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 내가 속한 채팅방 목록을 불러오기
  @Get()
  async getUserRooms(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.roomService.getUserRooms(req.user.userId);
  }
}
