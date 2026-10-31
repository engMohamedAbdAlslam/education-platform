import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <-- 1. استيراد المكتبة

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
  }));

  // --- 2. إعداد وثائق Swagger ---
  const config = new DocumentBuilder()
    .setTitle('Education Course Platform API')
    .setDescription('The API documentation for courses, students, admins, and enrollments.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // الرابط الذي ستفتح منه Swagger
  // -----------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();