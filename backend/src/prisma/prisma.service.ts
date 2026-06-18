import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * The single Prisma client for the app. Prisma 7 requires a driver adapter
 * (the connection URL no longer lives in schema.prisma). Query/error timing is
 * logged here via Prisma log events — NOT in an interceptor (see ARCHITECTURE.md).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    // Log query duration at debug level so it can be filtered out in production.
    // In production, consider gating on `if (e.duration > 100)` to avoid flooding.
    (this as any).$on('query', (e: { query: string; duration: number }) => {
      this.logger.debug(`${e.duration}ms ${e.query}`);
    });
    (this as any).$on('error', (e: unknown) => this.logger.error(e));
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
