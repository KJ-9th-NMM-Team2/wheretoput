// 사용자 입퇴장,메시지 전송
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extractUserIdFromToken } from '../utils/jwt.util';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';

type JoinPayload = { roomId: string };
type LeavePayload = { roomId: string };
type SendPayload = { roomId: string; content: string; tempId?: string };

// @UseGuards(JwtAuthGuard) // 임시 비활성화
@WebSocketGateway({
  cors: {
    origin: [/^http:\/\/localhost:\d+$/, 'https://wheretoput.store'],
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
  ) { }

  afterInit() {
    // RoomService에 소켓 서버 인스턴스 전달
    this.roomService.setSocketServer(this.server);
  }

  // 연결/해제 로그
  handleConnection(socket: Socket) {
    socket.emit('welcome', { id: socket.id, time: new Date().toISOString() });
  }

  handleDisconnect(socket: Socket) {
    // 연결 해제 시 정리 로직 필요시 여기에 추가
  }

  // 방 입장: 권한 체크 + 참가자 등록 + 소켓 join
  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() body: JoinPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );
    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    if (!body?.roomId) throw new BadRequestException('roomId is required');

    // await this.chatService.joinRoom(body.roomId, userId); // 임시 비활성화
    void socket.join(body.roomId);

    // 방 입장 시 해당 사용자의 last_read_at을 현재 시간으로 업데이트
    // 단, 마지막 메시지가 있는 경우에만 읽음 처리
    const lastMessage = await this.prisma.chat_messages.findFirst({
      where: {
        chat_room_id: body.roomId,
        is_deleted: false,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        created_at: true,
        user_id: true,
      },
    });

    // 마지막 메시지가 있고, 다른 사용자가 보낸 메시지인 경우에만 읽음 처리
    if (lastMessage && lastMessage.user_id !== userId) {
      await this.prisma.chat_participants.updateMany({
        where: {
          chat_room_id: body.roomId,
          user_id: userId,
        },
        data: {
          last_read_at: new Date(),
        },
      });

    }

    socket.emit('joined', { roomId: body.roomId });
    this.server.to(body.roomId).emit('system', {
      type: 'join',
      roomId: body.roomId,
      userId,
      at: new Date().toISOString(),
    });
  }

  // 방 퇴장: 소켓 leave
  @SubscribeMessage('leave')
  onLeave(
    @MessageBody() body: LeavePayload,
    @ConnectedSocket() socket: Socket,
  ) {
    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );
    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    if (!body?.roomId) throw new BadRequestException('roomId is required');

    void socket.leave(body.roomId);

    socket.emit('left', { roomId: body.roomId });
    this.server.to(body.roomId).emit('system', {
      type: 'leave',
      roomId: body.roomId,
      userId,
      at: new Date().toISOString(),
    });
  }

  // 메시지 전송: 저장 후 방에 브로드캐스트
  @SubscribeMessage('send')
  async onSend(
    @MessageBody() body: SendPayload & { tempId?: string },
    @ConnectedSocket() socket: Socket,
  ) {

    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );

    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    if (!body?.roomId) throw new BadRequestException('roomId is required');
    if (!body?.content || !body.content.trim()) {
      throw new BadRequestException('content is required');
    }

    // 메시지를 저장하고 사용자 정보도 함께 조회
    const result = await this.prisma.chat_messages.create({
      data: {
        chat_room_id: body.roomId,
        user_id: userId,
        content: body.content,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 메시지 보낸 사용자는 읽음 처리하지 않음 (상대방이 읽어야 읽음으로 표시)

    // 사용자 정보를 포함한 브로드캐스트 메시지 생성
    const mockMsg = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: body.roomId,
      senderId: userId,
      senderName: result.User?.name || '이름 없음',
      senderImage: result.User?.image || '',
      content: body.content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // 발신자에게 ACK 전송
    if (body.tempId) {
      socket.emit('message:ack', {
        tempId: body.tempId,
        realId: mockMsg.id,
        createdAt: mockMsg.createdAt,
      });
    }

    // 방에 브로드캐스트
    this.server.to(body.roomId).emit('message', mockMsg);

    // SSE를 통한 채팅방 목록 업데이트 알림 (Next.js 서버로)
    try {
      const ssePayload = {
        type: 'room_update',
        roomId: body.roomId,
        message: body.content,
        lastMessageAt: mockMsg.createdAt,
        lastMessageSenderId: userId,
        messageType: 'text',
        userId: userId,
        senderName: mockMsg.senderName,
        senderImage: mockMsg.senderImage,
        timestamp: mockMsg.createdAt
      };

      const response = await fetch('http://localhost:3000/api/chat/sse/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ssePayload),
      });

      if (!response.ok) {
        console.error(`SSE 알림 전송 실패: ${response.status}`);
      }
    } catch (error) {
      console.error(`SSE 알림 전송 오류:`, error);
    }
  }

  // 읽음 처리
  @SubscribeMessage('read')
  async onRead(
    @MessageBody() body: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {

    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );

    if (!userId || !body?.roomId) return;

    try {
      // 해당 방의 참가자 정보 업데이트 (last_read_at)
      await this.prisma.chat_participants.updateMany({
        where: {
          chat_room_id: body.roomId,
          user_id: userId,
        },
        data: {
          last_read_at: new Date(),
        },
      });

      // 방에 있는 다른 사용자들에게 읽음 상태 변경 알림
      socket.to(body.roomId).emit('read:updated', {
        roomId: body.roomId,
        userId,
        readAt: new Date().toISOString(),
      });

      // SSE를 통한 읽음 상태 업데이트 알림 (Next.js 서버로)
      try {
        const response = await fetch('http://localhost:3000/api/chat/sse/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'read_update',
            roomId: body.roomId,
            userId: userId,
            timestamp: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          console.error(`읽음 상태 SSE 알림 전송 실패: ${response.status}`);
        }
      } catch (error) {
        console.error(`읽음 상태 SSE 알림 전송 오류:`, error);
      }

    } catch (error) {
      console.error(`READ STATUS UPDATE FAILED:`, error);
    }
  }

  // 채팅방 참가자들에게 목록 업데이트 이벤트 전송
  private async notifyParticipantsOfRoomUpdate(
    roomId: string,
    messageData: {
      lastMessage: string;
      lastMessageAt: string;
      lastMessageSenderId: string;
      messageType: string;
    },
  ) {
    try {
      this.logger.log(
        `🔔 [notifyParticipants] 채팅방 목록 업데이트 시작 - roomId: ${roomId}`,
      );

      // 채팅방 참가자들 조회
      const participants = await this.prisma.chat_participants.findMany({
        where: { chat_room_id: roomId },
        select: { user_id: true },
      });
      this.logger.log(
        `👥 [notifyParticipants] 참가자 수: ${participants.length}`,
      );

      const updateData = {
        roomId,
        lastMessage: messageData.lastMessage,
        lastMessageAt: messageData.lastMessageAt,
        lastMessageSenderId: messageData.lastMessageSenderId,
        messageType: messageData.messageType,
        timestamp: new Date().toISOString(),
      };

      // 모든 연결된 소켓 조회
      const allSockets = await this.server.fetchSockets();
      this.logger.log(
        `🔗 [notifyParticipants] 총 연결된 소켓 수: ${allSockets.length}`,
      );

      let notifiedCount = 0;

      // 각 참가자의 모든 소켓에 이벤트 전송
      for (const participant of participants) {
        for (const socket of allSockets) {
          const socketUserId = extractUserIdFromToken(
            this.jwtService,
            socket.handshake.auth?.token,
          );

          if (socketUserId === participant.user_id) {
            socket.emit('chatroom_list_update', updateData);
            notifiedCount++;
            this.logger.log(
              `✅ [notifyParticipants] 전송 성공 - 사용자: ${participant.user_id}, 소켓: ${socket.id}`,
            );
          }
        }
      }

      this.logger.log(
        `🔔 [notifyParticipants] 완료 - 총 ${notifiedCount}개 소켓에 전송됨`,
      );
    } catch (error) {
      this.logger.error(`❌ [notifyParticipants] 실패:`, error);
    }
  }

  // ===== 협업 모드 이벤트 처리 =====

  // 방 입장 (협업용)
}
