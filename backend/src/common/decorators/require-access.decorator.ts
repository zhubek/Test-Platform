import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ACCESS = 'require_access';

export interface RequireAccessMeta {
  entity: string;
  action: string;
}

/** Tags a route with the (entity, action) the AccessGuard must authorize. */
export const RequireAccess = (entity: string, action: string) =>
  SetMetadata(REQUIRE_ACCESS, { entity, action } satisfies RequireAccessMeta);
