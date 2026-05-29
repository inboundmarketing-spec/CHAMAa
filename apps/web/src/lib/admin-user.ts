import { useMemo } from 'react';
import {
  canManageAuthorizations as canManageAuthorizationsRole,
  canManageBroadcasts as canManageBroadcastsRole,
  canManageFestas as canManageFestasRole,
} from '@chama/shared';

export type AdminUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  venueId?: string | null;
};

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('chama_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

/** Usuário estável por montagem (evita loop em useEffect). */
export function useAdminUser(): AdminUser | null {
  return useMemo(() => getAdminUser(), []);
}

export function setAdminUser(user: AdminUser) {
  localStorage.setItem('chama_user', JSON.stringify(user));
}

export function clearAdminUser() {
  localStorage.removeItem('chama_user');
}

const FULL_ACCESS_ROLES = [
  'admin',
  'mesa_lieu',
  'co_director',
  'criativa',
  'moderator',
  'agent',
];

export function hasFullAccess(user: AdminUser | null) {
  return !!user && FULL_ACCESS_ROLES.includes(user.role);
}

export function isVenueCoordinator(user: AdminUser | null) {
  return user?.role === 'venue_coordinator';
}

export function isNeutral(user: AdminUser | null) {
  return user?.role === 'neutral';
}

export function isSportsOnly(user: AdminUser | null) {
  return isVenueCoordinator(user) || isNeutral(user);
}

export function canCreateMatches(user: AdminUser | null) {
  return hasFullAccess(user);
}

export function canManageVenues(user: AdminUser | null) {
  return hasFullAccess(user);
}

export function canFinishMatchDirectly(user: AdminUser | null) {
  return hasFullAccess(user) || isVenueCoordinator(user);
}

export function canManageAuthorizations(user: AdminUser | null) {
  return !!user && canManageAuthorizationsRole(user.role);
}

export function canManageBroadcasts(user: AdminUser | null) {
  return !!user && canManageBroadcastsRole(user.role);
}

export function canManageFestas(user: AdminUser | null) {
  return !!user && canManageFestasRole(user.role);
}

export function canAccessConfirmations(user: AdminUser | null) {
  return hasFullAccess(user) || isVenueCoordinator(user) || isNeutral(user);
}

/** Mesa, Criativa e Admin: painel com visão geral das operações. */
export function isConfirmationsOverview(user: AdminUser | null) {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.role === 'mesa_lieu' ||
    user.role === 'criativa'
  );
}

/** Diretor C.O.: gestão operacional sem o resumo executivo da Mesa. */
export function isCoDirectorRole(user: AdminUser | null) {
  return user?.role === 'co_director';
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    mesa_lieu: 'Mesa da Lieu',
    co_director: 'Diretor C.O.',
    criativa: 'Criativa',
    moderator: 'Moderador',
    agent: 'Agente',
    venue_coordinator: 'C.O. Praça',
    neutral: 'Neutro',
  };
  return labels[role] ?? role;
}
