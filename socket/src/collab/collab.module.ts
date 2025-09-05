import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CollabGateway } from './collab.gateway';
import { RoomService } from '../room/room.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    RedisModule,
  ],
  providers: [CollabGateway, RoomService, JwtAuthGuard],
  exports: [CollabGateway, RoomService],
})
export class CollabModule {}