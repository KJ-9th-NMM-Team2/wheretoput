import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { RoomModule } from './room/room.module';
import { PrismaModule } from './prisma/prisma.module';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [PrismaModule, ChatModule, RoomModule, CollabModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
