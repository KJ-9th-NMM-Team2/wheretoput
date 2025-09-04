import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  private socketServer: any;

  setSocketServer(server: any) {
    this.socketServer = server;
  }

  // 방 생성
  async createRoom(params: { currentUserId: string; otherUserId: string }) {
    try {
      if (!this.prisma) {
        throw new Error('Prisma service not injected');
      }

      // 기존 채팅방 확인 (양방향으로 검색)
      const existingRoom = await this.prisma.chat_rooms.findFirst({
        where: {
          OR: [
            {
              creator_id: params.currentUserId,
              other_user_ids: {
                array_contains: params.otherUserId,
              },
            },
            {
              creator_id: params.otherUserId,
              other_user_ids: {
                array_contains: params.currentUserId,
              },
            },
          ],
        },
      });

      if (existingRoom) {
        console.log('기존 채팅방 발견:', existingRoom.chat_room_id);
        return existingRoom;
      }

      // 상대방 사용자 정보 조회
      let otherUsers: { name: string | null }[] = [];
      let roomName = `사용자 ${params.otherUserId}`; // 기본값 설정

      try {
        otherUsers = await this.prisma.user.findMany({
          where: { id: { in: [params.otherUserId] } },
          select: { name: true },
        });

        if (otherUsers.length > 0) {
          roomName = otherUsers.map((user) => user.name).join(', ');
        }
      } catch (error) {
        console.error('User 조회 실패:', error);
        // 기본값 사용 (이미 설정됨)
      }

      console.log('새 채팅방 생성:', roomName);

      console.log('트랜잭션 시작 전');
      // 트랜잭션으로 채팅방 및 참가자 생성
      const result = await this.prisma.$transaction(async (prisma) => {
        console.log('chat_rooms 생성 시도');
        const room = await prisma.chat_rooms.create({
          data: {
            name: roomName,
            creator_id: params.currentUserId,
            other_user_ids: [params.otherUserId],
          },
        });
        console.log('chat_rooms 생성 완료:', room.chat_room_id);

        await prisma.chat_participants.create({
          data: {
            chat_room_id: room.chat_room_id,
            user_id: params.currentUserId,
            is_admin: true,
          },
        });

        await prisma.chat_participants.create({
          data: {
            chat_room_id: room.chat_room_id,
            user_id: params.otherUserId,
            is_admin: false,
          },
        });

        return room;
      });
      console.log('트랜잭션 완료');

      // 새 방이 생성되면 관련 사용자들에게 소켓 이벤트 전송
      if (this.socketServer) {
        const roomData = {
          chat_room_id: result.chat_room_id,
          name: result.name,
          is_private: true,
          created_at: result.created_at,
        };
        
        // 양쪽 사용자에게 방 생성 알림
        this.socketServer.emit('room:created', {
          room: roomData,
          participants: [params.currentUserId, params.otherUserId]
        });
        
        console.log('📢 ROOM CREATED EVENT SENT:', roomData);
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  // 방 생성
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createChatting(params: {
    name: string;
    description?: string;
    createdBy: string;
    isPrivate?: boolean;
  }) {
    try {
      // const room = await this.prisma.chat_rooms.create({
      //   data: {
      //     name: params.name, // name (OK)
      //     description: params.description ?? null, // description
      //     creator_id: params.createdBy, // creator_id
      //     is_private: params.isPrivate ?? false, // is_private
      //     // created_at / updated_at 는 스키마 기본값이 있으니 생략 가능
      //   },
      // });
      // 생성자를 자동 참가자로 추가(관리자 권한으로 표시하고 싶다면 is_admin: true)
      // await this.prisma.chat_participants.create({
      //   data: {
      //     chat_room_id: room.chat_room_id, // 주의: room_id 아님
      //     user_id: params.createdBy,
      //     is_admin: true, // role 대신 Boolean 필드 사용
      //     // joined_at 기본값 now()
      //   },
      // });
      // // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      // return room;
    } catch (error: any) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  // 방 접근 권한 확인
  async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      // 방 존재 확인
      const room = await this.prisma.chat_rooms.findUnique({
        where: { chat_room_id: roomId }, // chat_room_id로 조회
        select: { is_private: true, creator_id: true },
      });

      if (!room) {
        throw new NotFoundException(`Room ${roomId} not found`);
      }

      // 공개 방은 누구나 접근 가능
      if (!room.is_private) return true;

      // 비공개 방이면 참가자여야 함 (또는 방 생성자 허용)
      const participant = await this.prisma.chat_participants.findUnique({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
      });

      return !!participant || room.creator_id === userId;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to check room access: ${error.message}`);
    }
  }

  // 사용자 방 목록 조회
  async getUserRooms(userId: string) {
    try {
      const rows = await this.prisma.chat_participants.findMany({
        where: { user_id: userId },
        include: {
          chat_rooms: {
            select: {
              chat_room_id: true,
              name: true, // room_name 아님
              description: true,
              is_private: true,
              created_at: true,
            },
          },
        },
      });

      // 참가자로 속한 방 리스트를 반환
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return rows.map((p: { chat_rooms: any }) => p.chat_rooms);
    } catch (error: any) {
      throw new Error(`Failed to get user rooms: ${error.message}`);
    }
  }
}
