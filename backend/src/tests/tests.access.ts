import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { TEST_ACTIONS, testPolicy } from './tests.policy';
import { TestEntity } from './tests.types';

/** A caller is `org` to a test iff they belong to the test's project. */
export function relationshipTo(test: TestEntity | null, user: AuthUser): Relationship {
  if (test && user.projectId === test.projectId) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<TestEntity>({
  name: 'test',
  policy: testPolicy,
  actions: [...TEST_ACTIONS],
  relationshipTo,
  load: (db, id) => db.test.findUnique({ where: { id } }),
});

export type TestCapabilities = ReturnType<typeof capabilitiesFor>;
