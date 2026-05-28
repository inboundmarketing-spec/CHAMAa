/** Hierarquia: Mesa/Criativa/Admin (0) > Diretor (1) > C.O. Praça (2) > Neutro (3). */
export function authorizationRoleTier(role: string): number {
  switch (role) {
    case 'admin':
    case 'mesa_lieu':
    case 'criativa':
      return 0;
    case 'co_director':
      return 1;
    case 'venue_coordinator':
      return 2;
    case 'neutral':
      return 3;
    default:
      return -1;
  }
}

const GRANTABLE_ROLES = [
  'co_director',
  'venue_coordinator',
  'neutral',
] as const;

export type GrantableAuthorizationRole = (typeof GRANTABLE_ROLES)[number];

export function canManageAuthorizations(role: string): boolean {
  const tier = authorizationRoleTier(role);
  return tier >= 0 && tier <= 2;
}

export function canGrantAuthorizationRole(
  actorRole: string,
  targetRole: string,
): boolean {
  const actorTier = authorizationRoleTier(actorRole);
  const targetTier = authorizationRoleTier(targetRole);
  if (actorTier < 0 || targetTier < 0) return false;
  return targetTier > actorTier;
}

export function grantableAuthorizationRoles(
  actorRole: string,
): GrantableAuthorizationRole[] {
  return GRANTABLE_ROLES.filter((r) =>
    canGrantAuthorizationRole(actorRole, r),
  );
}

export function isHigherAuthorizationRole(
  existingRole: string,
  proposedRole: string,
): boolean {
  const existingTier = authorizationRoleTier(existingRole);
  const proposedTier = authorizationRoleTier(proposedRole);
  if (existingTier < 0 || proposedTier < 0) return false;
  return existingTier < proposedTier;
}
