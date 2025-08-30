import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 사용자 ID를 키로, 소켓 ID 배열을 값으로 가지는 맵
const connectedUsers = new Map<string, string[]>();

@WebSocketGateway({
  cors: { origin: [/^http:\/\/localhost:\d+$/], credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // 클라이언트가 연결되면 호출
  handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      console.log('A user without an ID has connected. Disconnecting.');
      return socket.disconnect();
    }

    // 소켓 ID를 사용자 ID에 매핑
    const userSockets = connectedUsers.get(userId) || [];
    userSockets.push(socket.id);
    connectedUsers.set(userId, userSockets);

    console.log('connected:', socket.id, 'for user:', userId);

    // 특정 클라이언트에게만 연결 성공 알림
    socket.emit('welcome', {
      id: socket.id,
      time: new Date().toISOString(),
      userId,
    });

    // 서버에 연결된 모든 클라이언트에게 상태 변경 알림
    this.server.emit('status', `${userId} has joined!`);
  }

  // 클라이언트가 연결을 끊으면 호출
  handleDisconnect(socket: Socket) {
    let disconnectedUserId: string | undefined;

    // 연결이 끊긴 소켓의 사용자 ID를 찾고 맵에서 제거
    for (const [userId, socketIds] of connectedUsers.entries()) {
      const index = socketIds.indexOf(socket.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        disconnectedUserId = userId;
        // 해당 사용자의 모든 소켓이 끊겼는지 확인
        if (socketIds.length === 0) {
          connectedUsers.delete(userId);
          console.log('disconnected:', socket.id, 'for user:', userId);
          // 모든 연결이 끊어졌을 때만 상태를 공지
          this.server.emit('status', `${userId} has left.`);
        }
        break;
      }
    }
    console.log('disconnected:', socket.id);
  }

  // 'joinRoom' 이벤트를 구독
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    void socket.join(payload.roomId);
    console.log(`${socket.id} joined room ${payload.roomId}`);
    this.server
      .to(payload.roomId)
      .emit('status', `${socket.id} has joined this room.`);
  }

  // 'leaveRoom' 이벤트를 구독
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    void socket.leave(payload.roomId);
    console.log(`${socket.id} left room ${payload.roomId}`);
    this.server
      .to(payload.roomId)
      .emit('status', `${socket.id} has left this room.`);
  }

  // 'sendMessage' 이벤트를 구독
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody()
    payload: { roomId: string; content: string; senderName: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderUserId = socket.handshake.query.userId as string;

    const message = {
      id: Math.random().toString(36).substring(2, 9),
      roomId: payload.roomId,
      senderId: senderUserId,
      senderName: payload.senderName,
      content: payload.content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // 해당 방에 있는 모든 클라이언트에게 메시지 전송
    this.server.to(payload.roomId).emit('newMessage', message);
  }
}
