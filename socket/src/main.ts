import 'reflect-metadata'; //지우지 마세용
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001, '0.0.0.0');
}
void bootstrap();
