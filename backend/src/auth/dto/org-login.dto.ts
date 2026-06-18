import { IsString, MinLength } from 'class-validator';

// Org admins sign in with their login + the org's activation code — no
// password. The code is their credential; if forgotten, an admin restores it.
export class OrgLoginDto {
  @IsString()
  @MinLength(1)
  login!: string;

  @IsString()
  @MinLength(1)
  code!: string;
}
