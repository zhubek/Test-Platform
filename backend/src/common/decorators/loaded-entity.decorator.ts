import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the entity the AccessGuard already loaded (req.loadedEntity). */
export const Loaded = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().loadedEntity;
});
