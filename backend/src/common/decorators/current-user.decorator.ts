import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../access/types';

/** Injects the authenticated principal (req.user) into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user as AuthUser;
  },
);
