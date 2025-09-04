import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { RoomModule } from './room/room.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ChatModule, RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
