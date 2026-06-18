import { PrismaPg } from '@prisma/adapter-pg';
import { LicenseState, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { ALL_ROLES, ROLES } from '../src/auth/roles';
import { generateCode } from '../src/common/util/code';
import { STARTER_BLOCKS } from './blocks.seed-data';
import { CATALOG_VIEW_BLOCKS } from './catalog-blocks.seed-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Roles (always) ───────────────────────────────────────────────────────
  for (const name of ALL_ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── Bootstrap super-admin (always) ───────────────────────────────────────
  const login = process.env.SEED_SUPERADMIN_LOGIN ?? 'superadmin';
  const superHash = await bcrypt.hash(process.env.SEED_SUPERADMIN_PASSWORD ?? 'changeme123', 10);
  await prisma.user.upsert({
    where: { login },
    update: {},
    create: {
      login,
      email: process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@example.com',
      name: 'Super Admin',
      status: 'ACTIVE',
      passwordHash: superHash,
      roles: { create: { role: { connect: { name: ROLES.SUPER_ADMIN } } } },
    },
  });

  // ── Reset demo domain data, then recreate it (idempotent reseed) ─────────
  // Deleting projects cascades organizations, licenses, params, project-languages
  // and project memberships; the holder/org links on users are set null. We then
  // drop every non-super-admin user. Roles + super-admin (above) are preserved.
  await prisma.project.deleteMany();
  await prisma.user.deleteMany({ where: { NOT: { login } } });

  const demoHash = await bcrypt.hash('password123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  // Global language catalog (names match FE locale codes for easy mapping).
  for (const name of ['en', 'ru', 'kk']) {
    await prisma.language.upsert({ where: { name }, update: {}, create: { name } });
  }
  const languages = await prisma.language.findMany();

  type LicSpec = { name: string; state: LicenseState };
  type OrgSpec = { name: string; city: string; licenses: LicSpec[] };
  type ProjSpec = {
    name: string;
    description: string;
    licenseLimit: number;
    params: { name: string; options: string[] }[];
    orgs: OrgSpec[];
  };

  const projects: ProjSpec[] = [
    {
      name: 'Career Compass 2026',
      description: 'Nationwide career-guidance assessment',
      licenseLimit: 1000,
      params: [
        { name: 'Region', options: ['Almaty', 'Astana', 'Shymkent'] },
        { name: 'Grade', options: ['9', '10', '11'] },
      ],
      orgs: [
        {
          name: 'Almaty School #12',
          city: 'Almaty',
          licenses: [
            { name: 'Aibek Nurlanov', state: 'ACTIVE' },
            { name: 'Dana Serikova', state: 'ACTIVE' },
            { name: 'Yerlan Akhmetov', state: 'ISSUED' },
            { name: 'Madina Bekova', state: 'EXPIRED' },
          ],
        },
        {
          name: 'Nazarbayev Intellectual School',
          city: 'Astana',
          licenses: [
            { name: 'Alikhan Tulegenov', state: 'ACTIVE' },
            { name: 'Aru Zhumabek', state: 'ACTIVE' },
            { name: 'Timur Iskakov', state: 'ISSUED' },
          ],
        },
        {
          name: 'Lyceum #8',
          city: 'Shymkent',
          licenses: [
            { name: 'Saule Amirova', state: 'ACTIVE' },
            { name: 'Nurlan Kassymov', state: 'ISSUED' },
          ],
        },
      ],
    },
    {
      name: 'School Diagnostics',
      description: 'Grade 9–11 diagnostic testing',
      licenseLimit: 400,
      params: [{ name: 'Grade', options: ['9', '10', '11'] }],
      orgs: [
        {
          name: 'Pilot Gymnasium',
          city: 'Karaganda',
          licenses: [
            { name: 'Aisha Omarova', state: 'ACTIVE' },
            { name: 'Bekzat Sultanov', state: 'REVOKED' },
          ],
        },
        {
          name: 'Tech Academy',
          city: 'Almaty',
          licenses: [{ name: 'Damir Yel', state: 'ISSUED' }],
        },
      ],
    },
    {
      name: 'University Readiness',
      description: 'Pre-university aptitude assessment',
      licenseLimit: 500,
      params: [],
      orgs: [
        {
          name: 'Regional College',
          city: 'Aktobe',
          licenses: [
            { name: 'Zarina Koshkarova', state: 'ACTIVE' },
            { name: 'Olzhas Beisenov', state: 'ISSUED' },
          ],
        },
      ],
    },
  ];

  let orgSeq = 0;
  let licSeq = 0;

  for (const spec of projects) {
    const project = await prisma.project.create({
      data: {
        name: spec.name,
        description: spec.description,
        licenseLimit: spec.licenseLimit,
        languages: { create: languages.map((lang) => ({ languageId: lang.id })) },
        params: {
          create: spec.params.map((p) => ({
            name: p.name,
            type: 'SELECT',
            options: { create: p.options.map((valueText) => ({ valueText })) },
          })),
        },
      },
    });

    for (const org of spec.orgs) {
      orgSeq += 1;
      const used = org.licenses.filter((l) => l.state === 'ACTIVE').length;
      const createdOrg = await prisma.organization.create({
        data: {
          name: org.name,
          description: org.city, // FE shows this as the org's city
          code: generateCode(),
          projectId: project.id,
          licenseCount: org.licenses.length,
          licenseUsed: used,
          members: {
            create: {
              login: `org-admin-${orgSeq}`,
              name: `${org.name} Admin`,
              status: 'PENDING',
              projectId: project.id,
              projectRole: 'ORG_ADMIN',
              roles: { create: { role: { connect: { name: ROLES.ORG_ADMIN } } } },
            },
          },
        },
      });

      for (const lic of org.licenses) {
        licSeq += 1;
        const active = lic.state === 'ACTIVE';
        await prisma.license.create({
          data: {
            licenseCode: generateCode(),
            state: lic.state,
            projectId: project.id,
            organizationId: createdOrg.id,
            holder: {
              create: {
                login: `student-${licSeq}`,
                name: lic.name,
                status: active ? 'ACTIVE' : 'PENDING',
                passwordHash: active ? studentHash : null,
                projectId: project.id,
                projectRole: 'LICENSE_HOLDER',
                organizationId: createdOrg.id,
                roles: { create: { role: { connect: { name: ROLES.LICENSE_HOLDER } } } },
              },
            },
          },
        });
      }
    }
  }

  // One project-admin per project (login + password123), each scoped to its project.
  const allProjects = await prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  const admins = [
    { login: 'career.admin', name: 'Career Compass Admin' },
    { login: 'schools.admin', name: 'Schools Admin' },
    { login: 'uni.admin', name: 'University Readiness Admin' },
  ];
  for (let i = 0; i < allProjects.length; i++) {
    const a = admins[i] ?? { login: `project.admin.${i}`, name: `Project Admin ${i}` };
    await prisma.user.create({
      data: {
        login: a.login,
        email: `${a.login}@platform.kk`,
        name: a.name,
        status: 'ACTIVE',
        passwordHash: demoHash,
        projectId: allProjects[i].id,
        projectRole: 'PROJECT_ADMIN',
        roles: { create: { role: { connect: { name: ROLES.PROJECT_ADMIN } } } },
      },
    });
  }

  // ── Starter blocks (idempotent: only when the library is empty) ──────────
  if ((await prisma.block.count()) === 0) {
    await prisma.block.createMany({
      data: [...STARTER_BLOCKS, ...CATALOG_VIEW_BLOCKS].map((b) => ({
        ...b,
        props: b.props as unknown as Prisma.InputJsonValue,
        // The declared prop values double as the block's sample data.
        sampleProps: Object.fromEntries(
          b.props.map((p) => [p.name, p.value]),
        ) as Prisma.InputJsonValue,
      })),
    });
  }

  console.log(
    `Seeded roles + super-admin + ${allProjects.length} projects with organizations, licenses, params, languages, 2 project-admins, and starter blocks.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
