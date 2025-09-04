import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';

@Module({
  imports: [JwtModule],
  providers: [RoomGateway, RoomService],
  controllers: [RoomController],
})
export class RoomModule {}