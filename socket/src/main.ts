import 'reflect-metadata'; //지우지 마세용
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);
    
    console.log('Setting up CORS...');
    app.enableCors({
      origin: process.env.EC2_HOST_NEXT || '*',
      credentials: true,
    });

    console.log('Starting server on port 3001...');
    await app.listen(3001, '0.0.0.0');
    console.log('✅ Socket server is running on port 3001');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
void bootstrap();
