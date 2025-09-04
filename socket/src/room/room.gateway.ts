import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";

@WebSocketGateway()
export class RoomGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: string }) {
    console.log(`Client ${client.id} joining room ${payload.roomId}`);
    
    // 1. 방에 입장
    await client.join(payload.roomId);
    
    // 2. 다른 사용자들에게 알림
    client.to(payload.roomId).emit('userJoined', {
      clientId: client.id,
      roomId: payload.roomId
    });
    
    // 3. 현재 방 상태 전송 (임시 구현)
    const roomState = { roomId: payload.roomId, users: [] };
    client.emit('roomState', roomState);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    console.log(`Client ${client.id} leaving room ${payload.roomId}`);
    
    // 1. 방에서 퇴장
    await client.leave(payload.roomId);
    
    // 2. 다른 사용자들에게 알림
    client.to(payload.roomId).emit('userLeft', {
      clientId: client.id,
      roomId: payload.roomId
    });
  }

  

//   @SubscribeMessage('furnitureMove')
//   async handleFurnitureMove(client: Socket, payload: { roomId: string, furnitureId: string, position: Vector3 }) {
//     // 1. DB 업데이트
//     await this.updateFurniture(payload);
    
//     // 2. 방의 모든 사용자에게 브로드캐스트
//     this.server.to(payload.roomId).emit('furnitureUpdated', payload);
//   }
}