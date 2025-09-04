import { Module } from '@nestjs/common';

import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    })
  ],
  providers: [ RoomService],
  controllers: [RoomController],
})
export class RoomModule {}

