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
  cors: { origin: [/^http:\/\/localhost:\d+$/], credentials: true },
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
  ) {}

  afterInit() {
    // RoomService에 소켓 서버 인스턴스 전달
    this.roomService.setSocketServer(this.server);
  }

  // 연결/해제 로그
  handleConnection(socket: Socket) {
    this.logger.log(`🟢 CONNECTED: ${socket.id}`);
    this.logger.log(`🔗 Socket connected on namespace: ${socket.nsp.name}`);
    socket.emit('welcome', { id: socket.id, time: new Date().toISOString() });
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`🔴 DISCONNECTED: ${socket.id}`);
  }

  // 방 입장: 권한 체크 + 참가자 등록 + 소켓 join
  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() body: JoinPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🚪 JOIN EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`,
    );
    this.logger.log(`🔍 JOIN EVENT BODY:`, JSON.stringify(body));
    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );
    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    if (!body?.roomId) throw new BadRequestException('roomId is required');

    // await this.chatService.joinRoom(body.roomId, userId); // 임시 비활성화
    void socket.join(body.roomId);

    // 방 입장 시 해당 사용자의 last_read_at을 현재 시간으로 업데이트 (필요할 때만)
    const participant = await this.prisma.chat_participants.findFirst({
      where: {
        chat_room_id: body.roomId,
        user_id: userId,
      },
    });
    const now = new Date();
    // last_read_at이 없거나, 현재 시간과 다를 때만 업데이트
    if (
      !participant?.last_read_at ||
      participant.last_read_at.getTime() !== now.getTime()
    ) {
      await this.prisma.chat_participants.updateMany({
        where: {
          chat_room_id: body.roomId,
          user_id: userId,
        },
        data: {
          last_read_at: now,
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
    this.logger.log(
      `🚪 LEAVE EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`,
    );
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
    this.logger.log(`📤 SEND EVENT RECEIVED: ${socket.id}`);
    this.logger.log(`🔍 SEND EVENT BODY:`, JSON.stringify(body));

    console.log(socket.handshake.auth?.token);

    // JWT 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );

    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    this.logger.log(`📤 MESSAGE SEND: ${body.content} from ${userId}`);
    if (!body?.roomId) throw new BadRequestException('roomId is required');
    if (!body?.content || !body.content.trim()) {
      throw new BadRequestException('content is required');
    }

    console.log(userId);

    // 메시지를 저장하고 사용자 정보도 함께 조회
    console.log('userId:', userId);
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
      this.logger.log(
        `🔄 SENDING ACK: tempId=${body.tempId}, realId=${mockMsg.id}`,
      );
      socket.emit('message:ack', {
        tempId: body.tempId,
        realId: mockMsg.id,
        createdAt: mockMsg.createdAt,
      });
    }

    // 방에 브로드캐스트
    this.logger.log(`📢 BROADCASTING MESSAGE to room: ${body.roomId}`);
    this.server.to(body.roomId).emit('message', mockMsg);
  }

  // 읽음 처리
  @SubscribeMessage('read')
  async onRead(
    @MessageBody() body: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `👁️ READ EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`,
    );

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

      this.logger.log(
        `✅ READ STATUS UPDATED: user ${userId} in room ${body.roomId}`,
      );
    } catch (error) {
      this.logger.error(`❌ READ STATUS UPDATE FAILED:`, error);
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
