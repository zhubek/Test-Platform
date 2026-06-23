import 'dotenv/config'; // ensure .env is loaded before PrismaService reads DATABASE_URL
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  // Project-migration bundles can be large (catalogs with many items).
  app.use(json({ limit: '64mb' }));
  app.use(urlencoded({ extended: true, limit: '64mb' }));
  // Global input validation/stripping. DTOs only need class-validator decorators.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
