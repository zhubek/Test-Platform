import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/access/types';
import { JwtPayload } from './jwt-payload';

/**
 * Validates the bearer token's signature and turns its claims into the
 * AuthUser placed on req.user. Identity/roles/scope come from the verified
 * token (never from params or body).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      roles: payload.roles ?? [],
      projectId: payload.projectId,
      orgId: payload.orgId,
      licenseId: payload.licenseId,
    };
  }
}
