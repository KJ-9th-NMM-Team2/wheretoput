import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  private socketServer: any;

  setSocketServer(server: any) {
    this.socketServer = server;
  }

  // 그룹 채팅방 생성
  async createGroupRoom(params: {
    currentUserId: string;
    participantIds: string[];
    roomName?: string;
    simRoomId?: string; // 협업용 시뮬레이터 room ID (선택적)
  }) {
    try {
      if (!this.prisma) {
        throw new Error('Prisma service not injected');
      }

      // 참가자 정보 조회
      let participantNames: string[] = [];
      try {
        const participants = await this.prisma.user.findMany({
          where: { id: { in: params.participantIds } },
          select: { id: true, name: true },
        });

        participantNames = participants.map((user) => user.name || '이름 없음');
      } catch (error) {
        console.error('참가자 정보 조회 실패:', error);
      }

      // 방 이름 생성 (사용자가 지정하지 않은 경우)
      const roomName = params.roomName || null;

      // 트랜잭션으로 채팅방 및 참가자 생성
      const result = await this.prisma.$transaction(async (prisma) => {
        // 채팅방 생성
        const room = await prisma.chat_rooms.create({
          data: {
            name: roomName,
            creator_id: params.currentUserId,
            is_private: true, // 그룹 채팅은 기본적으로 비공개
          },
        });

        // 생성자를 관리자로 참가
        await prisma.chat_participants.create({
          data: {
            chat_room_id: room.chat_room_id,
            user_id: params.currentUserId,
            is_admin: true,
          },
        });

        // 선택된 참가자들을 멤버로 참가
        for (const participantId of params.participantIds) {
          await prisma.chat_participants.create({
            data: {
              chat_room_id: room.chat_room_id,
              user_id: participantId,
              is_admin: false,
            },
          });
        }

        // 시뮬레이터 room이 지정된 경우 rooms 테이블 업데이트 (협업용)
        if (params.simRoomId) {
          await prisma.rooms.update({
            where: { room_id: params.simRoomId },
            data: { collab_chat_room_id: room.chat_room_id },
          });
        }

        return room;
      });

      // 새 방이 생성되면 관련 사용자들에게 소켓 이벤트 전송
      if (this.socketServer) {
        const roomData = {
          chat_room_id: result.chat_room_id,
          name: result.name,
          is_private: true,
          created_at: result.created_at,
        };

        // 모든 참가자에게 방 생성 알림
        const allParticipants = [
          params.currentUserId,
          ...params.participantIds,
        ];
        this.socketServer.emit('room:created', {
          room: roomData,
          participants: allParticipants,
        });
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to create group room: ${error.message}`);
    }
  }

  // 1:1 채팅방 생성
  async createRoom(params: { currentUserId: string; otherUserId: string }) {
    try {
      if (!this.prisma) {
        throw new Error('Prisma service not injected');
      }

      // 기존 채팅방 확인 (양방향으로 검색) - 나간 방도 포함하여 검색
      const existingRoom = await this.prisma.chat_rooms.findFirst({
        where: {
          OR: [
            {
              creator_id: params.currentUserId,
            },
            {
              creator_id: params.otherUserId,
            },
          ],
        },
        include: {
          chat_participants: {
            where: {
              user_id: {
                in: [params.currentUserId, params.otherUserId],
              },
            },
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (existingRoom) {
        // 두 참가자의 상태 확인
        const myParticipant = existingRoom.chat_participants?.find(
          (p) => p.user_id === params.currentUserId,
        );
        const otherParticipant = existingRoom.chat_participants?.find(
          (p) => p.user_id === params.otherUserId,
        );

        // 트랜잭션으로 양쪽 모두 다시 참여 처리
        await this.prisma.$transaction(async (prisma) => {
          // 내가 나간 상태라면 다시 참여 (left_at은 유지해서 그 이후 메시지만 보이도록)
          if (myParticipant && myParticipant.is_left) {
            await prisma.chat_participants.update({
              where: {
                chat_room_id_user_id: {
                  chat_room_id: existingRoom.chat_room_id,
                  user_id: params.currentUserId,
                },
              },
              data: {
                is_left: false,
                // left_at은 유지 - 이 시간 이후 메시지만 보여주기 위해
              },
            });
          }

          // 상대방이 나간 상태라면 다시 참여
          if (otherParticipant && otherParticipant.is_left) {
            await prisma.chat_participants.update({
              where: {
                chat_room_id_user_id: {
                  chat_room_id: existingRoom.chat_room_id,
                  user_id: params.otherUserId,
                },
              },
              data: {
                is_left: false,
                // left_at은 유지 - 이 시간 이후 메시지만 보여주기 위해
              },
            });
          }
        });

        // 기존 방을 리턴할 때도 올바른 이름으로 업데이트해서 리턴
        return {
          ...existingRoom,
          name:
            existingRoom.name ||
            otherParticipant?.User?.name ||
            `사용자 ${params.otherUserId}`,
        };
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

      // 트랜잭션으로 채팅방 및 참가자 생성
      const result = await this.prisma.$transaction(async (prisma) => {
        const room = await prisma.chat_rooms.create({
          data: {
            name: roomName,
            creator_id: params.currentUserId,
          },
        });

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
          participants: [params.currentUserId, params.otherUserId],
        });
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

  // 기존 채팅방에 참가자 추가 (협업용)
  async addParticipantToRoom(roomId: string, userId: string) {
    try {
      // 이미 참가자인지 확인
      const existingParticipant =
        await this.prisma.chat_participants.findUnique({
          where: {
            chat_room_id_user_id: {
              chat_room_id: roomId,
              user_id: userId,
            },
          },
        });

      if (existingParticipant) {
        // 이미 참가자라면 is_left가 true인 경우 다시 참여 처리
        if (existingParticipant.is_left) {
          await this.prisma.chat_participants.update({
            where: {
              chat_room_id_user_id: {
                chat_room_id: roomId,
                user_id: userId,
              },
            },
            data: {
              is_left: false,
            },
          });
        }
        return existingParticipant;
      }

      // 새 참가자 추가
      const newParticipant = await this.prisma.chat_participants.create({
        data: {
          chat_room_id: roomId,
          user_id: userId,
          is_admin: false,
        },
      });

      // 소켓 이벤트 전송 (참가자 추가 알림)
      if (this.socketServer) {
        this.socketServer.emit('participant:added', {
          roomId: roomId,
          userId: userId,
        });
      }

      return newParticipant;
    } catch (error: any) {
      throw new Error(`Failed to add participant to room: ${error.message}`);
    }
  }

  // 시뮬레이터 room의 협업 채팅방 조회
  async getCollabChatRoom(simRoomId: string) {
    try {
      const room = await this.prisma.rooms.findUnique({
        where: { room_id: simRoomId },
        select: { collab_chat_room_id: true },
      });

      if (!room?.collab_chat_room_id) {
        return null;
      }

      // 채팅방 정보 조회
      const chatRoom = await this.prisma.chat_rooms.findUnique({
        where: { chat_room_id: room.collab_chat_room_id },
        include: {
          chat_participants: {
            include: {
              User: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      return chatRoom;
    } catch (error: any) {
      throw new Error(`Failed to get collab chat room: ${error.message}`);
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
