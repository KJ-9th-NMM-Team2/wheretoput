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
    if (!participant?.last_read_at || participant.last_read_at.getTime() !== now.getTime()) {
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

    // 메시지를 저장
    console.log('userId:', userId);
    const result = await this.prisma.chat_messages.create({
      data: {
        chat_room_id: body.roomId,
        user_id: userId,
        content: body.content,
      },
    });

    // 메시지 보낸 사용자의 last_read_at 갱신 (자신이 보낸 메시지는 읽음 처리)
    await this.prisma.chat_participants.updateMany({
      where: {
        chat_room_id: body.roomId,
        user_id: userId,
      },
      data: {
        last_read_at: new Date(),
      },
    });

    // ACK/브로드캐스트 테스트
    const mockMsg = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: body.roomId,
      senderId: userId,
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

  // ===== 협업 모드 이벤트 처리 =====

  // 방 입장 (협업용)
  @SubscribeMessage('join-room')
  async onJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🤝 COLLABORATION JOIN: ${socket.id} → room ${roomId}`);
    
    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );

    if (!roomId) throw new BadRequestException('roomId is required');

    // Socket.IO 방에 입장
    void socket.join(roomId);
    
    socket.emit('joined-room', { roomId });
    this.logger.log(`✅ User ${userId} joined collaboration room: ${roomId}`);
  }

  // 사용자 입장 알림
  @SubscribeMessage('user-join')
  async onUserJoin(
    @MessageBody() data: { userId: string; userData: { name: string; color: string } },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👤 USER JOIN: ${data.userId} (${data.userData.name})`);
    
    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach(room => {
      if (room !== socket.id) { // 자신의 소켓 ID는 제외
        socket.to(room).emit('user-joined', data);
      }
    });
  }

  // 사용자 퇴장 알림  
  @SubscribeMessage('user-left')
  async onUserLeft(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👋 USER LEFT: ${data.userId}`);
    
    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', data);
      }
    });
  }

  // 모델 이동
  @SubscribeMessage('model-move')
  async onModelMove(
    @MessageBody() data: { userId: string; modelId: string; position: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`📦 MODEL MOVE: ${data.modelId} by ${data.userId}`);
    
    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('model-moved', data);
      }
    });
  }

  // 모델 회전
  @SubscribeMessage('model-rotate')
  async onModelRotate(
    @MessageBody() data: { userId: string; modelId: string; rotation: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🔄 MODEL ROTATE: ${data.modelId} by ${data.userId}`);
    
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('model-rotated', data);
      }
    });
  }

  // 모델 크기 조정
  @SubscribeMessage('model-scale')
  async onModelScale(
    @MessageBody() data: { userId: string; modelId: string; scale: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`📏 MODEL SCALE: ${data.modelId} by ${data.userId}`);
    
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('model-scaled', data);
      }
    });
  }

  // 모델 추가
  @SubscribeMessage('model-added-with-id')
  async onModelAdded(
    @MessageBody() data: { userId: string; modelData: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`➕ MODEL ADDED: by ${data.userId}`);
    
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('model-added-with-id', data);
      }
    });
  }

  // 모델 제거
  @SubscribeMessage('model-removed')
  async onModelRemoved(
    @MessageBody() data: { userId: string; modelId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`➖ MODEL REMOVED: ${data.modelId} by ${data.userId}`);
    
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('model-removed', data);
      }
    });
  }
}
