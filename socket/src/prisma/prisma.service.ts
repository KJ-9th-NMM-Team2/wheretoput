import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // chat_participants: any;
  // chat_messages: any;
  // chat_rooms: any;
  // 웹 시작될 때 DB연결
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // 앱 종료와 함께 닫고 싶으면 process 훅 사용
  enableShutdownHooks(app: INestApplication) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.once('beforeExit', async () => {
      await app.close();
    });
  }
}
