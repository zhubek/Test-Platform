import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload';
import { ROLES } from './roles';

/** A holder's license as the home screen needs it (no secret code). */
const LICENSE_SUMMARY = {
  id: true,
  state: true,
  project: { select: { id: true, name: true } },
  organization: { select: { id: true, name: true } },
} as const;

const BCRYPT_ROUNDS = 10;

/** How the user (with the relations we need to build a token) is loaded. */
const USER_FOR_TOKEN = {
  roles: { include: { role: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Daily login: login or email + password -> access token. */
  async login(identifier: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ login: identifier }, { email: identifier }] },
      include: USER_FOR_TOKEN,
    });
    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sign(user);
  }

  /**
   * Org-admin sign-in: login + the org's activation code (no password). The
   * code identifies the org; the login must match its org_admin. First sign-in
   * with a valid code activates the account. If the code was rotated (restored)
   * the old one stops working immediately.
   */
  async orgLogin(login: string, code: string): Promise<{ accessToken: string }> {
    const org = await this.prisma.organization.findUnique({ where: { code } });
    if (!org) throw new UnauthorizedException('Invalid login or code');
    const admin = await this.prisma.user.findFirst({
      where: { organizationId: org.id, login, roles: { some: { role: { name: ROLES.ORG_ADMIN } } } },
      include: USER_FOR_TOKEN,
    });
    if (!admin) throw new UnauthorizedException('Invalid login or code');
    if (admin.status !== 'ACTIVE') {
      await this.prisma.user.update({ where: { id: admin.id }, data: { status: 'ACTIVE' } });
    }
    return this.sign(admin);
  }

  /**
   * One-time activation: redeem an Organization.code (org_admin) or
   * License.licenseCode (license_holder), set the password, flip to ACTIVE,
   * and return a token. A license_holder activation also activates the License.
   */
  async activate(code: string, password: string): Promise<{ accessToken: string }> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Try org_admin first, then license_holder.
    const org = await this.prisma.organization.findUnique({ where: { code } });
    if (org) {
      const pending = await this.prisma.user.findFirst({
        where: {
          organizationId: org.id,
          status: 'PENDING',
          roles: { some: { role: { name: ROLES.ORG_ADMIN } } },
        },
      });
      if (!pending) throw new NotFoundException('No pending org-admin for this code');
      await this.prisma.user.update({
        where: { id: pending.id },
        data: { status: 'ACTIVE', passwordHash },
      });
      return this.signById(pending.id);
    }

    const license = await this.prisma.license.findUnique({
      where: { licenseCode: code },
      include: { holder: true },
    });
    if (license?.holder && license.holder.status === 'PENDING') {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: license.holder.id },
          data: { status: 'ACTIVE', passwordHash },
        }),
        this.prisma.license.update({
          where: { id: license.id },
          data: { state: 'ACTIVE' },
        }),
      ]);
      return this.signById(license.holder.id);
    }

    throw new NotFoundException('Invalid or already-used activation code');
  }

  /**
   * Self-serve sign-up for an end user: email + login + password. The account
   * holds no licenses yet — it redeems codes afterwards. Returns an (unscoped)
   * token. Email confirmation is intentionally deferred.
   */
  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const clash = await this.prisma.user.findFirst({
      where: { OR: [{ login: dto.login }, { email: dto.email }] },
      select: { id: true },
    });
    if (clash) throw new ConflictException('That login or email is already in use.');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        email: dto.email,
        name: dto.name ?? null,
        status: 'ACTIVE',
        passwordHash,
        roles: { create: { role: { connect: { name: ROLES.LICENSE_HOLDER } } } },
      },
      include: USER_FOR_TOKEN,
    });
    return this.sign(user);
  }

  /** The current principal's basics (for the client to know who it is). */
  me(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
        status: true,
        projectId: true,
        organizationId: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });
  }

  /** All licenses the user holds, for the home screen's 0/1/many routing. */
  listLicenses(userId: string) {
    return this.prisma.license.findMany({
      where: { holderId: userId },
      select: LICENSE_SUMMARY,
      orderBy: { issuedDate: 'desc' },
    });
  }

  /**
   * Claim a license code for the signed-in user: attaches it to the account and
   * activates it. Codes still held (ACTIVE) by someone else are rejected; an
   * auto-provisioned PENDING placeholder holder is simply replaced.
   */
  async redeemLicense(userId: string, code: string) {
    const license = await this.prisma.license.findUnique({
      where: { licenseCode: code },
      include: { holder: { select: { id: true, status: true } } },
    });
    if (!license) throw new NotFoundException('Invalid license code.');
    if (license.state === 'REVOKED' || license.state === 'EXPIRED') {
      throw new BadRequestException('This license is no longer valid.');
    }
    if (
      license.holderId &&
      license.holderId !== userId &&
      license.holder?.status === 'ACTIVE'
    ) {
      throw new ConflictException('This license has already been claimed.');
    }
    await this.prisma.license.update({
      where: { id: license.id },
      data: { holderId: userId, state: 'ACTIVE' },
    });
    return this.prisma.license.findUniqueOrThrow({
      where: { id: license.id },
      select: LICENSE_SUMMARY,
    });
  }

  /**
   * Pick which held license to act under: returns a token scoped to that
   * license's project so the existing holder endpoints resolve correctly.
   */
  async selectLicense(userId: string, licenseId: string): Promise<{ accessToken: string }> {
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, holderId: userId },
      select: { id: true, state: true, projectId: true },
    });
    if (!license) throw new NotFoundException('License not found.');
    if (license.state !== 'ACTIVE') throw new BadRequestException('This license is not active.');
    return this.signById(userId, { projectId: license.projectId, licenseId: license.id });
  }

  private async signById(
    id: string,
    ctx?: { projectId?: string; licenseId?: string },
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: USER_FOR_TOKEN,
    });
    return this.sign(user, ctx);
  }

  private async sign(
    user: {
      id: string;
      projectId: string | null;
      organizationId: string | null;
      roles: { role: { name: string } }[];
    },
    ctx?: { projectId?: string; licenseId?: string },
  ): Promise<{ accessToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      roles: user.roles.map((r) => r.role.name),
      projectId: ctx?.projectId ?? user.projectId ?? undefined,
      orgId: user.organizationId ?? undefined,
      licenseId: ctx?.licenseId ?? undefined,
    };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
