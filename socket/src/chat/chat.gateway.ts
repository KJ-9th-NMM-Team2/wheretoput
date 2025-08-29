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

@WebSocketGateway({
  cors: { origin: [/^http:\/\/localhost:\d+$/], credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(socket: Socket) {
    console.log('connected:', socket.id);
    socket.emit('welcome', { id: socket.id, time: new Date().toISOString() });
  }

  handleDisconnect(socket: Socket) {
    console.log('disconnected:', socket.id);
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() body: { hello: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.emit('pong', { now: Date.now(), youSent: body });
  }
}
