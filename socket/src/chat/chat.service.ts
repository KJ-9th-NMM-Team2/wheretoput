import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';

export type ChatMessageDTO = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  status: 'sent' | 'read';
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
  ) {}

  // 방 참가자 추가 (권한 체크 포함)
  async joinRoom(roomId: string, userId: string) {
    try {
      // 접근 권한 확인
      const hasAccess = await this.roomService.checkRoomAccess(roomId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this room');
      }

      // 이미 참가자인지 확인
      const existing = await this.prisma.chat_participants.findUnique({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
      });

      if (!existing) {
        await this.prisma.chat_participants.create({
          data: {
            chat_room_id: roomId,
            user_id: userId,
            // role: 'member',
          },
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to join room: ${error.message}`);
    }
  }

  // 메시지 저장 (강화된 검증)
  async saveMessage(params: {
    roomId: string;
    userId: string;
    senderName: string;
    content: string;
  }): Promise<ChatMessageDTO> {
    try {
      // 비어있는지 확인
      if (!params.content?.trim()) {
        throw new BadRequestException('Message content cannot be empty');
      }

      // 글자수 1000자 제한
      if (params.content.length > 1000) {
        throw new BadRequestException('Message too long (max 1000 characters)');
      }

      // 방 참가자 확인 (임시 비활성화)
      // const participant = await this.prisma.chat_participants.findUnique({
      //   where: {
      //     chat_room_id_user_id: {
      //       chat_room_id: params.roomId,
      //       user_id: params.userId,
      //     },
      //   },
      // });

      // // 방에 아무도 없으면 에러처리
      // if (!participant) {
      //   throw new ForbiddenException('Not a member of this room');
      // }

      const now = new Date();
      const created = await this.prisma.chat_messages.create({
        // 저장할 데이터
        data: {
          chat_room_id: params.roomId,
          user_id: params.userId,
          content: params.content.trim(),
          message_type: 'text',
          metadata: {},
          created_at: now,
          updated_at: now,
        },
        // 저장 후 가져올 필드
        select: {
          message_id: true,
          chat_room_id: true,
          user_id: true,
          content: true,
          created_at: true,
        },
      });

      return {
        id: created.message_id,
        roomId: created.chat_room_id,
        senderId: created.user_id,
        senderName: params.senderName,
        content: created.content,
        createdAt: created.created_at?.toString() || '',
        status: 'sent',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // console.log('💥 MESSAGE SAVE ERROR:', error);
      // console.log('💥 ERROR DETAILS:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }

  // 채팅방 입장시 메시지 조회 (권한 체크 포함)
  async getRecentMessages(params: {
    roomId: string;
    userId: string;
    limit: number;
    beforeId?: string;
  }): Promise<ChatMessageDTO[]> {
    try {
      // 방 접근 권한 확인
      const hasAccess = await this.roomService.checkRoomAccess(
        params.roomId,
        params.userId,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this room');
      }

      const { roomId, limit, beforeId } = params;
      const safeLimit = Math.min(Math.max(limit, 1), 100);

      // 사용자의 참가 정보 확인 (left_at 시간 체크)
      const participant = await this.prisma.chat_participants.findUnique({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: params.userId,
          },
        },
        select: {
          left_at: true,
          joined_at: true,
        },
      });

      let cursorCreatedAt: Date | null = null;
      if (beforeId) {
        const pivot = await this.prisma.chat_messages.findUnique({
          where: { message_id: beforeId },
          select: { created_at: true },
        });
        cursorCreatedAt = pivot?.created_at ?? null;
      }

      // 메시지 조회 조건 설정
      const whereCondition: any = {
        chat_room_id: roomId,
        is_deleted: false,
        ...(cursorCreatedAt ? { created_at: { lt: cursorCreatedAt } } : {}),
      };

      // 나간 적이 있는 사용자는 마지막 나간 시간 이후 메시지만 조회
      if (participant?.left_at) {
        // 나간 시간 이후의 메시지만 조회 (카카오톡 스타일)
        whereCondition.created_at = {
          ...whereCondition.created_at,
          gte: participant.left_at,
        };
      }

      const rows = await this.prisma.chat_messages.findMany({
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        take: safeLimit,
        select: {
          message_id: true,
          chat_room_id: true,
          user_id: true,
          content: true,
          created_at: true,
          User: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      const lastReadAt = await this.prisma.chat_participants.findFirst({
        where: {
          chat_room_id: roomId,
          user_id: { not: params.userId },
        },
        select: { last_read_at: true },
      });

      const lastRead = lastReadAt?.last_read_at;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return rows.reverse().map((r) => {
        const currentRead = r.created_at ?? new Date();
        return {
          id: r.message_id,
          roomId: r.chat_room_id,
          senderId: r.user_id,
          senderName: r.User?.name || '',
          senderImage: r.User?.image || null,
          content: r.content,
          createdAt: r.created_at?.toISOString() ?? new Date().toISOString(),
          status: lastRead && currentRead <= lastRead ? 'read' : 'sent',
        };
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  // 채팅방 이름 변경 (사용자별 커스텀 이름)
  async renameRoom(roomId: string, userId: string, name: string) {
    try {
      // 이름 유효성 검사
      if (!name?.trim()) {
        throw new BadRequestException('Room name cannot be empty');
      }

      if (name.length > 100) {
        throw new BadRequestException('Room name too long (max 100 characters)');
      }

      // 방 접근 권한 확인
      const hasAccess = await this.roomService.checkRoomAccess(roomId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this room');
      }

      // chat_participants에서 해당 사용자의 custom_room_name 업데이트
      await this.prisma.chat_participants.updateMany({
        where: {
          chat_room_id: roomId,
          user_id: userId,
        },
        data: {
          custom_room_name: name.trim(),
        },
      });

      return {
        success: true,
        message: 'Room name updated successfully',
        roomId,
        customName: name.trim(),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error(`Failed to rename room: ${error.message}`);
    }
  }

  // 채팅방 나가기 (개별 유저 - 다른 유저에게는 영향 없음)
  async leaveRoom(roomId: string, userId: string) {
    try {
      // 채팅방 존재 확인
      const room = await this.prisma.chat_rooms.findUnique({
        where: { chat_room_id: roomId },
        select: { chat_room_id: true },
      });

      if (!room) {
        throw new BadRequestException('Chat room not found');
      }

      // 참가자 레코드 확인
      const participant = await this.prisma.chat_participants.findUnique({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
      });

      if (!participant) {
        throw new BadRequestException('You are not a participant of this room');
      }

      // is_left를 true로 설정하고 left_at 시간 기록
      await this.prisma.chat_participants.update({
        where: {
          chat_room_id_user_id: {
            chat_room_id: roomId,
            user_id: userId,
          },
        },
        data: {
          is_left: true,
          left_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Successfully left the chat room',
        roomId,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to leave room: ${error.message}`);
    }
  }

  // 채팅방 완전 삭제 (개발자용 - DB에서 히스토리까지 모두 삭제)
  async deleteRoomCompletely(roomId: string, userId: string) {
    try {
      // 채팅방 존재 확인
      const room = await this.prisma.chat_rooms.findUnique({
        where: { chat_room_id: roomId },
        select: { chat_room_id: true },
      });

      if (!room) {
        throw new BadRequestException('Chat room not found');
      }

      // 개발자용 기능이므로 권한 체크 없이 삭제
      // CASCADE 설정으로 chat_messages와 chat_participants도 함께 삭제됨
      await this.prisma.chat_rooms.delete({
        where: { chat_room_id: roomId },
      });

      return {
        success: true,
        message: 'Chat room and all history deleted completely',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to delete room completely: ${error.message}`);
    }
  }
}
