import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { canTransition } from './license-test.transitions';
import { LicenseTestEntity } from './tests.types';

const json = (v: unknown): Prisma.InputJsonValue => (v ?? {}) as Prisma.InputJsonValue;

@Injectable()
export class LicenseTestService {
  constructor(private readonly prisma: PrismaService) {}

  /** Attempts for a test (admin monitoring view). */
  listForTest(testId: string) {
    return this.prisma.licenseTest.findMany({
      where: { testId },
      include: { license: { select: { licenseCode: true } }, variables: true },
      orderBy: { updatedTime: 'desc' },
    });
  }

  /**
   * Attempts across all licenses in an organization (org-admin results view).
   * Includes the holder, the test's name + result config (advancedParams), and
   * the computed variables so the UI can render each holder's result.
   */
  listForOrganization(orgId: string) {
    return this.prisma.licenseTest.findMany({
      where: { license: { organizationId: orgId } },
      include: {
        license: { select: { id: true, licenseCode: true, holder: { select: { login: true, name: true } } } },
        test: { select: { id: true, name: true, advancedParams: true } },
        variables: true,
      },
      orderBy: { updatedTime: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.licenseTest.findUniqueOrThrow({
      where: { id },
      include: { variables: true },
    });
  }

  /**
   * Start, resume, or RETAKE the caller's attempt at a test. One attempt per
   * (license, test): the first call creates it IN_PROGRESS; a live attempt is
   * resumed as-is; a finished one (NOT_STARTED never ran, COMPLETED/EXPIRED) is
   * reset to a fresh in-progress run, clearing the previous run's stored
   * variables so the next submit replaces them cleanly.
   */
  async start(licenseId: string | undefined, testId: string) {
    if (!licenseId) throw new BadRequestException('Only a license holder can take a test');
    const existing = await this.prisma.licenseTest.findUnique({
      where: { licenseId_testId: { licenseId, testId } },
    });
    if (!existing) {
      try {
        return await this.prisma.licenseTest.create({
          data: { licenseId, testId, state: 'IN_PROGRESS', startTime: new Date() },
        });
      } catch (e) {
        // Concurrent starts (double-click / StrictMode double-effect) race to
        // create the one-per-(license,test) attempt. The loser hits the unique
        // constraint — recover by returning the row that won.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const won = await this.prisma.licenseTest.findUnique({
            where: { licenseId_testId: { licenseId, testId } },
          });
          if (won) return won;
        }
        throw e;
      }
    }
    if (existing.state === 'IN_PROGRESS') return existing;
    const [, updated] = await this.prisma.$transaction([
      this.prisma.licenseTestVariable.deleteMany({ where: { licenseTestId: existing.id } }),
      this.prisma.licenseTest.update({
        where: { id: existing.id },
        data: { state: 'IN_PROGRESS', startTime: new Date(), endTime: null, progress: {} },
      }),
    ]);
    return updated;
  }

  /** Persist in-progress answers; first save also moves NOT_STARTED → live. */
  saveProgress(attempt: LicenseTestEntity, dto: SaveProgressDto) {
    return this.prisma.licenseTest.update({
      where: { id: attempt.id },
      data: {
        progress: json(dto.progress),
        state: attempt.state === 'NOT_STARTED' ? 'IN_PROGRESS' : undefined,
        startTime: attempt.startTime ?? new Date(),
      },
    });
  }

  /**
   * Finalize: write the computed variables (characteristic/score outputs),
   * stamp the end time, mark COMPLETED. Atomic; variables fully replaced.
   */
  async submit(attempt: LicenseTestEntity, dto: SubmitAttemptDto) {
    if (attempt.state === 'COMPLETED' || attempt.state === 'EXPIRED') {
      throw new UnprocessableEntityException(`Attempt already ${attempt.state.toLowerCase()}`);
    }
    const vars = Object.entries(dto.variables ?? {}).map(([variable, value]) => ({
      licenseTestId: attempt.id,
      variable,
      value: Number(value) || 0,
    }));
    await this.prisma.$transaction([
      this.prisma.licenseTestVariable.deleteMany({ where: { licenseTestId: attempt.id } }),
      ...(vars.length ? [this.prisma.licenseTestVariable.createMany({ data: vars })] : []),
      this.prisma.licenseTest.update({
        where: { id: attempt.id },
        data: {
          state: 'COMPLETED',
          endTime: new Date(),
          progress: dto.progress ? json(dto.progress) : undefined,
        },
      }),
    ]);
    return this.findOne(attempt.id);
  }

  /** Admin force-expire of a live attempt. */
  async expire(attempt: LicenseTestEntity) {
    const verdict = canTransition(attempt.state, 'EXPIRED');
    if (!verdict.ok) throw new UnprocessableEntityException(verdict.reason);
    return this.prisma.licenseTest.update({
      where: { id: attempt.id },
      data: { state: 'EXPIRED', endTime: new Date() },
    });
  }
}
