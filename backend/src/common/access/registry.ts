import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from './types';

/**
 * entity-name -> { load, can } lookup. Each feature registers itself by calling
 * createAccess(). The AccessGuard reads from here at request time. (Could be
 * swapped for NestJS DI later; this is the simple, readable version.)
 */
export interface EntityAccess {
  load: (db: PrismaService, id: string) => Promise<unknown | null>;
  can: (action: string, entity: unknown, user: AuthUser) => boolean;
}

const registry = new Map<string, EntityAccess>();

export const accessRegistry = {
  register(name: string, entry: EntityAccess): void {
    registry.set(name, entry);
  },
  get(name: string): EntityAccess | undefined {
    return registry.get(name);
  },
};
