import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActivateDto } from './dto/activate.dto';
import { LoginDto } from './dto/login.dto';
import { OrgLoginDto } from './dto/org-login.dto';
import { RegisterDto } from './dto/register.dto';
import { RedeemDto, SelectLicenseDto } from './dto/redeem.dto';

/** Token minting is public; /me and license actions are authenticated. */
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/register')
  @HttpCode(200)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('auth/login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.identifier, dto.password);
  }

  @Post('auth/activate')
  @HttpCode(200)
  activate(@Body() dto: ActivateDto) {
    return this.auth.activate(dto.code, dto.password);
  }

  @Post('auth/org-login')
  @HttpCode(200)
  orgLogin(@Body() dto: OrgLoginDto) {
    return this.auth.orgLogin(dto.login, dto.code);
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  // --- the signed-in user's licenses (0/1/many home routing) ---

  @Get('me/licenses')
  @UseGuards(JwtAuthGuard)
  myLicenses(@CurrentUser() user: AuthUser) {
    return this.auth.listLicenses(user.id);
  }

  @Post('me/licenses/redeem')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  redeem(@CurrentUser() user: AuthUser, @Body() dto: RedeemDto) {
    return this.auth.redeemLicense(user.id, dto.code);
  }

  @Post('auth/select-license')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  selectLicense(@CurrentUser() user: AuthUser, @Body() dto: SelectLicenseDto) {
    return this.auth.selectLicense(user.id, dto.licenseId);
  }
}
