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
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';

@WebSocketGateway({
  namespace: '/collab',
  cors: { origin: [/^http:\/\/localhost:\d+$/], credentials: true },
})
export class CollabGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CollabGateway.name);

  constructor(
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

    // 방의 기존 접속자들에게 새로 입장한 사용자 알림
    socket.to(roomId).emit('request-user-list', { newUserId: socket.id });

    socket.emit('joined-room', { roomId });
    this.logger.log(`✅ User ${userId} joined collaboration room: ${roomId}`);
  }

  // 기존 사용자들이 자신의 정보를 응답
  @SubscribeMessage('user-info-response')
  async onUserInfoResponse(
    @MessageBody()
    data: { userId: string; userData: any; targetSocketId: any | undefined },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `📤 Forwarding user info: ${data.userId} → ${data.targetSocketId}`,
    );
    // 새로 입장한 사용자에게 기존 사용자 정보 전달
    this.server.to(data.targetSocketId).emit('user-info-response', {
      userId: data.userId,
      userData: data.userData,
    });
  }

  // 사용자 입장 알림
  @SubscribeMessage('user-join')
  async onUserJoin(
    @MessageBody()
    data: { userId: string; userData: { name: string; color: string } },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👤 USER JOIN: ${data.userId} (${data.userData.name})`);

    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        // 자신의 소켓 ID는 제외
        socket.to(room).emit('user-join', data);
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
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('user-left', data);
      }
    });
  }

  // 모델 이동
  @SubscribeMessage('model-move')
  async onModelMove(
    @MessageBody()
    data: { userId: string; modelId: string; position: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`📦 MODEL MOVE: ${data.modelId} by ${data.userId}`);

    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-moved', data);
      }
    });
  }

  // 모델 회전
  @SubscribeMessage('model-rotate')
  async onModelRotate(
    @MessageBody()
    data: { userId: string; modelId: string; rotation: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🔄 MODEL ROTATE: ${data.modelId} by ${data.userId}`);

    socket.rooms.forEach((room) => {
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

    socket.rooms.forEach((room) => {
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

    socket.rooms.forEach((room) => {
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

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-removed', data);
      }
    });
  }
}
