import 'dotenv/config'; // ensure .env is loaded before PrismaService reads DATABASE_URL
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  // Global input validation/stripping. DTOs only need class-validator decorators.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
