/** Claims carried by the access token. Scope is resolved once, at login/activation. */
export interface JwtPayload {
  sub: string; // user id
  roles: string[];
  projectId?: string; // the user's single project (absent for super_admin)
  orgId?: string; // org_admin
  licenseId?: string; // license_holder
}
