import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authentication only: validates the bearer JWT (via the 'jwt' Passport
 * strategy registered in AuthModule) and sets req.user. Failure -> 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
