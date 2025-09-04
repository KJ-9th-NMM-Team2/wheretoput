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
  status: 'sent';
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

      let cursorCreatedAt: Date | null = null;
      if (beforeId) {
        const pivot = await this.prisma.chat_messages.findUnique({
          where: { message_id: beforeId },
          select: { created_at: true },
        });
        cursorCreatedAt = pivot?.created_at ?? null;
      }

      const rows = await this.prisma.chat_messages.findMany({
        where: {
          chat_room_id: roomId,
          is_deleted: false,
          ...(cursorCreatedAt ? { created_at: { lt: cursorCreatedAt } } : {}),
        },
        orderBy: { created_at: 'desc' },
        take: safeLimit,
        select: {
          message_id: true,
          chat_room_id: true,
          user_id: true,
          content: true,
          created_at: true,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return rows.reverse().map((r) => ({
        id: r.message_id,
        roomId: r.chat_room_id,
        senderId: r.user_id,
        senderName: '',
        content: r.content,
        createdAt: r.created_at?.toISOString() ?? new Date().toISOString(),
        status: 'sent',
      }));
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }
}
