import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { RoomModule } from './room/room.module';
import { PrismaModule } from './prisma/prisma.module';
import { CollabModule } from './collab/collab.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, ChatModule, RoomModule, 
    CollabModule, RedisModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
