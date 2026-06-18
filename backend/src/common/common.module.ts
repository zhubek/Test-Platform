import { Global, Module } from '@nestjs/common';
import { AccessGuard } from './access/access.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Cross-cutting providers shared by all feature modules. Global so feature
 * controllers can `@UseGuards(JwtAuthGuard, AccessGuard)` and have them
 * resolved (with their dependencies) from the DI container.
 */
@Global()
@Module({
  providers: [AccessGuard, JwtAuthGuard],
  exports: [AccessGuard, JwtAuthGuard],
})
export class CommonModule {}
