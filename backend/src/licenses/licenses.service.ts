import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LicenseState } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { generateCode } from '../common/util/code';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { canTransition } from './licenses.transitions';
import { LicenseEntity } from './licenses.types';

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  listForOrganization(organizationId: string) {
    return this.prisma.license.findMany({
      where: { organizationId },
      include: { holder: { omit: { passwordHash: true } } },
    });
  }

  /** All licenses across a project (admin view, spans every org). */
  listForProject(projectId: string) {
    return this.prisma.license.findMany({
      where: { projectId },
      include: { holder: { omit: { passwordHash: true } } },
      orderBy: { issuedDate: 'asc' },
    });
  }

  /**
   * The org's license allotment: licenseCount is the limit, licenseUsed counts
   * issued licenses. Throws 422 when `want` more would exceed the limit.
   */
  private async assertWithinLimit(orgId: string, want: number) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { licenseCount: true, licenseUsed: true },
    });
    const remaining = org.licenseCount - org.licenseUsed;
    if (want > remaining) {
      throw new UnprocessableEntityException(
        `License limit reached: ${org.licenseUsed} of ${org.licenseCount} used, ${Math.max(0, remaining)} remaining`,
      );
    }
  }

  /**
   * A license's expiration is required and may never be later than its org's
   * (or, failing that, its project's) expiration cap.
   */
  private async assertExpiration(orgId: string, expirationDate: string | undefined) {
    if (!expirationDate) throw new UnprocessableEntityException('Expiration date is required.');
    const exp = new Date(expirationDate);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { expirationDate: true, project: { select: { expirationDate: true } } },
    });
    const caps = [org.expirationDate, org.project?.expirationDate].filter((d): d is Date => !!d);
    if (caps.length) {
      const cap = new Date(Math.min(...caps.map((d) => +d)));
      if (exp > cap) {
        throw new UnprocessableEntityException(
          `Expiration date can't be later than ${cap.toISOString().slice(0, 10)}.`,
        );
      }
    }
  }

  private licenseCreateData(
    org: { id: string; projectId: string },
    issuerId: string,
    holderLogin: string,
    holderName: string | null,
    expirationDate: string | undefined,
    code: string,
  ) {
    return {
      licenseCode: code,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      project: { connect: { id: org.projectId } },
      organization: { connect: { id: org.id } },
      issuedBy: { connect: { id: issuerId } },
      holder: {
        create: {
          login: holderLogin,
          name: holderName,
          status: 'PENDING' as const,
          project: { connect: { id: org.projectId } },
          projectRole: 'LICENSE_HOLDER' as const,
          organization: { connect: { id: org.id } },
          roles: { create: { role: { connect: { name: ROLES.LICENSE_HOLDER } } } },
        },
      },
    };
  }

  /**
   * Create the license AND provision its PENDING holder user. Returns the
   * plaintext activation code for the issuer to hand to the holder.
   */
  async createUnderOrganization(
    org: { id: string; projectId: string },
    dto: CreateLicenseDto,
    issuerId: string,
  ) {
    await this.assertWithinLimit(org.id, 1);
    await this.assertExpiration(org.id, dto.expirationDate);
    const code = generateCode();
    const [license] = await this.prisma.$transaction([
      this.prisma.license.create({
        data: this.licenseCreateData(org, issuerId, dto.holderLogin, dto.holderName ?? null, dto.expirationDate, code),
      }),
      this.prisma.organization.update({
        where: { id: org.id },
        data: { licenseUsed: { increment: 1 } },
      }),
    ]);
    return { data: license, code };
  }

  /**
   * Bulk-generate `count` licenses with auto-provisioned holder logins (the
   * holder activates with the license code and only then becomes a real
   * person). Respects the org's license allotment.
   */
  async generateUnderOrganization(
    org: { id: string; projectId: string },
    dto: { count: number; expirationDate?: string },
    issuerId: string,
  ) {
    await this.assertWithinLimit(org.id, dto.count);
    await this.assertExpiration(org.id, dto.expirationDate);
    const codes = Array.from({ length: dto.count }, () => generateCode());
    const created = await this.prisma.$transaction([
      ...codes.map((code) =>
        this.prisma.license.create({
          data: this.licenseCreateData(org, issuerId, `u-${code.toLowerCase()}`, null, dto.expirationDate, code),
        }),
      ),
      this.prisma.organization.update({
        where: { id: org.id },
        data: { licenseUsed: { increment: dto.count } },
      }),
    ]);
    return { data: created.slice(0, dto.count), codes };
  }

  update(id: string, dto: UpdateLicenseDto) {
    return this.prisma.license.update({
      where: { id },
      data: { expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined },
    });
  }

  /** Delete the license and give its slot back to the org's allotment. */
  async remove(id: string) {
    const license = await this.prisma.license.findUniqueOrThrow({
      where: { id },
      select: { organizationId: true },
    });
    const [removed] = await this.prisma.$transaction([
      this.prisma.license.delete({ where: { id } }),
      ...(license.organizationId
        ? [
            this.prisma.organization.update({
              where: { id: license.organizationId },
              data: { licenseUsed: { decrement: 1 } },
            }),
          ]
        : []),
    ]);
    return removed;
  }

  /**
   * The state-change pipeline: verify the move is legal + the entity is ready
   * (-> 422), commit, THEN emit a side-effect event (never inside the tx).
   * Authorization was already enforced by the AccessGuard.
   */
  async changeState(license: LicenseEntity, to: LicenseState) {
    const verdict = canTransition(license.state, to, license);
    if (!verdict.ok) throw new UnprocessableEntityException(verdict.reason);

    const updated = await this.prisma.license.update({
      where: { id: license.id },
      data: { state: to },
    });

    this.events.emit('license.stateChanged', { id: license.id, from: license.state, to });
    return updated;
  }

  /** Regenerate the activation code and unclaim the license so it can be redeemed
   *  again. The previous holder keeps their account (they may hold other licenses);
   *  they just lose access to this one. */
  async resetCode(license: LicenseEntity) {
    const code = generateCode();
    await this.prisma.license.update({
      where: { id: license.id },
      data: { licenseCode: code, state: 'ISSUED', holderId: null },
    });
    return { code };
  }
}
