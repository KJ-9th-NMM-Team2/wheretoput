import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  // 방 생성
  async createRoom(params: {
    name: string;
    description?: string;
    createdBy: string;
    isPrivate?: boolean;
  }) {
    try {
      const room = await this.prisma.chat_rooms.create({
        data: {
          room_name: params.name,
          description: params.description || '',
          created_by: params.createdBy,
          is_private: params.isPrivate || false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // 생성자를 자동으로 참가자로 추가
      await this.prisma.chat_participants.create({
        data: {
          chat_room_id: room.room_id,
          user_id: params.createdBy,
          role: 'admin',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return room;
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  // 방 접근 권한 확인
  async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      // 방이 존재하는지 먼저 확인
      const room = await this.prisma.chat_rooms.findUnique({
        where: { room_id: roomId },
        select: { is_private: true, created_by: true },
      });

      if (!room) {
        throw new NotFoundException(`Room ${roomId} not found`);
      }

      // 공개방이면 누구나 접근 가능
      if (!room.is_private) {
        return true;
      }

      // 비공개방이면 참가자여야 함
      const participant = await this.prisma.chat_participants.findUnique({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
      });

      return !!participant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to check room access: ${error.message}`);
    }
  }

  // 사용자 방 목록 조회
  async getUserRooms(userId: string) {
    try {
      const rooms = await this.prisma.chat_participants.findMany({
        where: { user_id: userId },
        include: {
          chat_rooms: {
            select: {
              room_id: true,
              room_name: true,
              description: true,
              is_private: true,
              created_at: true,
            },
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return rooms.map((p: { chat_rooms: any }) => p.chat_rooms);
    } catch (error) {
      throw new Error(`Failed to get user rooms: ${error.message}`);
    }
  }
}
