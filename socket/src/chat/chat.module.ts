import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { RoomService } from '../room/room.service';
import { RoomController } from '../room/room.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [ChatGateway, ChatService, RoomService, JwtAuthGuard], // 가드 등록
  controllers: [ChatController, RoomController],
  exports: [ChatService, RoomService],
})
export class ChatModule {}
