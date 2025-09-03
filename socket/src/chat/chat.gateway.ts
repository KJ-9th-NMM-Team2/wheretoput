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
type SendPayload = { roomId: string; content: string };

@UseGuards(JwtAuthGuard)
@WebSocketGateway({
  cors: { origin: [/^http:\/\/localhost:\d+$/], credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  // 연결/해제 로그
  handleConnection(socket: Socket) {
    this.logger.log(`connected: ${socket.id}`);
    socket.emit('welcome', { id: socket.id, time: new Date().toISOString() });
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`disconnected: ${socket.id}`);
  }

  // 방 입장: 권한 체크 + 참가자 등록 + 소켓 join
  @SubscribeMessage('join')
  async onJoin(
    @MessageBody() body: JoinPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string | undefined;
    if (!userId) throw new BadRequestException('Unauthenticated socket');
    if (!body?.roomId) throw new BadRequestException('roomId is required');

    await this.chatService.joinRoom(body.roomId, userId);
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
    const userId = socket.data.userId as string | undefined;
    if (!userId) throw new BadRequestException('Unauthenticated socket');
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
    @MessageBody() body: SendPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string | undefined;
    const username = (socket.data.username as string | undefined) ?? '';

    if (!userId) throw new BadRequestException('Unauthenticated socket');
    if (!body?.roomId) throw new BadRequestException('roomId is required');
    if (!body?.content || !body.content.trim()) {
      throw new BadRequestException('content is required');
    }

    const msg = await this.chatService.saveMessage({
      roomId: body.roomId,
      userId,
      senderName: username,
      content: body.content,
    });

    // 방에 브로드캐스트
    this.server.to(body.roomId).emit('message', msg);
  }
}
