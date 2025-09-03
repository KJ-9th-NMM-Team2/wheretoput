import 'reflect-metadata'; //지우지 마세용
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ CORS 설정 추가 해줘야지 Next와 통신 가능
  app.enableCors({
    origin: "http://localhost:3000", // 허용할 프론트 주소
    credentials: true,               // 쿠키 포함 허용 여부
  });

  await app.listen(3001, '0.0.0.0');
}
void bootstrap();
