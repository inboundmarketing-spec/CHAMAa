import {
  AdminRole,
  ClosureRequestStatus,
  hasFullAccess,
  isNeutralRole,
  isVenueCoordinatorRole,
} from '@chama/shared';

export type AdminRequestUser = {
  id: string;
  role: string;
  venueId?: string | null;
};

export {
  AdminRole,
  ClosureRequestStatus,
  hasFullAccess,
  isNeutralRole,
  isVenueCoordinatorRole,
};

export function canCreateMatches(role: string): boolean {
  return hasFullAccess(role);
}

export function canManageVenues(role: string): boolean {
  return hasFullAccess(role);
}

export function canDeleteMatches(role: string): boolean {
  return hasFullAccess(role);
}

export function canFinishMatchDirectly(role: string): boolean {
  return hasFullAccess(role) || isVenueCoordinatorRole(role);
}

import { PrismaService } from '../prisma/prisma.service';

export async function isCoordinatorAuthorized(
  prisma: PrismaService,
  coordinatorId: string,
  venueId: string,
): Promise<boolean> {
  const auth = await prisma.venueCoordinatorAuthorization.findUnique({
    where: {
      coordinatorId_venueId: { coordinatorId, venueId },
    },
  });
  return Boolean(auth);
}

export async function getAccessibleMatchIds(
  prisma: {
    match: {
      findMany: (args: object) => Promise<{ id: string }[]>;
    };
    matchAssignment: {
      findMany: (args: object) => Promise<{ matchId: string }[]>;
    };
  },
  user: AdminRequestUser,
): Promise<string[] | null> {
  if (hasFullAccess(user.role)) return null;

  if (isVenueCoordinatorRole(user.role)) {
    if (!user.venueId) return [];
    const rows = await prisma.match.findMany({
      where: { venueId: user.venueId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (isNeutralRole(user.role)) {
    const rows = await prisma.matchAssignment.findMany({
      where: { adminUserId: user.id },
      select: { matchId: true },
    });
    return rows.map((r) => r.matchId);
  }

  return [];
}

/** Filtro de leitura na listagem de partidas. */
export function matchListWhereForUser(user: AdminRequestUser) {
  if (hasFullAccess(user.role)) return {};
  if (isVenueCoordinatorRole(user.role)) {
    return user.venueId ? { venueId: user.venueId } : { id: '__none__' };
  }
  if (isNeutralRole(user.role)) {
    return {
      OR: [
        { status: 'live' },
        { status: 'finished' },
        { assignments: { some: { adminUserId: user.id } } },
      ],
    };
  }
  return { id: '__none__' };
}

/** Filtro para alterar placar, ficha, encerramento etc. */
export function matchWriteWhereForUser(user: AdminRequestUser) {
  if (hasFullAccess(user.role)) return {};
  if (isVenueCoordinatorRole(user.role)) {
    return user.venueId ? { venueId: user.venueId } : { id: '__none__' };
  }
  if (isNeutralRole(user.role)) {
    return { assignments: { some: { adminUserId: user.id } } };
  }
  return { id: '__none__' };
}

/** @deprecated Use matchListWhereForUser ou matchWriteWhereForUser */
export function matchWhereForUser(user: AdminRequestUser) {
  return matchWriteWhereForUser(user);
}
