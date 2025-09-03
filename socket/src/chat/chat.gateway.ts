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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

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

  constructor(private readonly chatService: ChatService) {}

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
    this.logger.log(`🚪 JOIN EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`);
    this.logger.log(`🔍 JOIN EVENT BODY:`, JSON.stringify(body));
    // 임시로 하드코딩된 실제 사용자 ID 사용 (나중에 JWT에서 가져와야 함)
    const userId = socket.data.userId as string | undefined || 'clu8lhg5w000108l1dcjb6lbe';
    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    if (!body?.roomId) throw new BadRequestException('roomId is required');

    // await this.chatService.joinRoom(body.roomId, userId); // 임시 비활성화
    void socket.join(body.roomId);

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
    this.logger.log(`🚪 LEAVE EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`);
    // 임시로 하드코딩된 실제 사용자 ID 사용 (나중에 JWT에서 가져와야 함)
    const userId = socket.data.userId as string | undefined || 'clu8lhg5w000108l1dcjb6lbe';
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
    // 임시로 하드코딩된 실제 사용자 ID 사용 (나중에 JWT에서 가져와야 함)
    const userId = socket.data.userId as string | undefined || 'clu8lhg5w000108l1dcjb6lbe';
    const username = (socket.data.username as string | undefined) ?? 'Test User';

    // if (!userId) throw new BadRequestException('Unauthenticated socket'); // 임시 비활성화
    this.logger.log(`📤 MESSAGE SEND: ${body.content} from ${userId}`);
    if (!body?.roomId) throw new BadRequestException('roomId is required');
    if (!body?.content || !body.content.trim()) {
      throw new BadRequestException('content is required');
    }

    // 임시로 메시지 저장을 건너뛰고 바로 ACK/브로드캐스트 테스트
    const mockMsg = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: body.roomId,
      senderId: userId,
      senderName: username,
      content: body.content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // 발신자에게 ACK 전송
    if (body.tempId) {
      this.logger.log(`🔄 SENDING ACK: tempId=${body.tempId}, realId=${mockMsg.id}`);
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
  onRead(
    @MessageBody() body: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👁️ READ EVENT RECEIVED: ${socket.id} → room ${body?.roomId}`);
    // 읽음 처리 로직은 나중에 구현
  }
}
