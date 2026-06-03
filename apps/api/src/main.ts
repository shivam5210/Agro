import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global middleware
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('National FPO Digital Market Linkage Platform API')
    .setDescription('API documentation for the FPO marketplace platform')
    .setVersion('1.0')
    .addTag('authentication')
    .addTag('fpo')
    .addTag('farmers')
    .addTag('commodities')
    .addTag('buyers')
    .addTag('logistics')
    .addTag('transactions')
    .addTag('analytics')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();