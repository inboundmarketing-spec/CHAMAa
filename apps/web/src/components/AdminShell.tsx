'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';
import {
  useAdminUser,
  isSportsOnly,
  hasFullAccess,
  isVenueCoordinator,
  isNeutral,
  canManageAuthorizations,
  canAccessConfirmations,
  canManageBroadcasts,
  canManageFestas,
} from '@/lib/admin-user';
import { AdminBrand } from '@/components/chaminha/AdminBrand';
import { NavFlameIndicator } from '@/components/chaminha/NavFlameIndicator';
const ALL_NAV = [
  { href: '/dashboard', label: 'Dashboard', sportsOnly: true },
  { href: '/matches', label: 'Esportes', sportsOnly: true },
  { href: '/bracket', label: 'Chaveamento', sportsOnly: false },
  { href: '/challenges', label: 'Desafios', sportsOnly: false },
  {
    href: '/local-places',
    label: 'Locais',
    sportsOnly: true,
    venuesOnly: true,
  },
  { href: '/events', label: 'Festas', sportsOnly: false, requiresFestas: true },
  {
    href: '/campaigns',
    label: 'Campanhas',
    sportsOnly: false,
    requiresBroadcast: true,
  },
  { href: '/handoff', label: 'Atendimento Lieu', sportsOnly: false },
  { href: '/help-feedback', label: 'Sugestões Ajuda', sportsOnly: false },
  { href: '/knowledge', label: 'Base conhecimento', sportsOnly: false },
  {
    href: '/instagram',
    label: 'Instagram',
    sportsOnly: false,
    requiresBroadcast: true,
  },
  { href: '/simulator', label: 'Simulador', sportsOnly: false },
  {
    href: '/authorizations',
    label: 'Autorizações',
    sportsOnly: true,
    requiresAuthorizationsOrConfirmations: true,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAdminUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const sportsOnly = isSportsOnly(user);
  const nav = useMemo(() => {
    const base = sportsOnly
      ? ALL_NAV.filter((item) => item.sportsOnly)
      : ALL_NAV;
    return base.filter((item) => {
    if (
      'requiresAuthorizationsOrConfirmations' in item &&
      item.requiresAuthorizationsOrConfirmations
    ) {
      return canManageAuthorizations(user) || canAccessConfirmations(user);
    }
    if ('requiresBroadcast' in item && item.requiresBroadcast) {
      return canManageBroadcasts(user);
    }
    if ('requiresFestas' in item && item.requiresFestas) {
      return canManageFestas(user);
    }
    if ('venuesOnly' in item && item.venuesOnly && isSportsOnly(user)) {
      return isVenueCoordinator(user) || isNeutral(user);
    }
    return true;
    });
  }, [sportsOnly, user]);

  const prefetchNav = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (!prefetchNav) return;
    for (const item of nav) {
      if (item.href !== pathname) {
        router.prefetch(item.href);
      }
    }
  }, [pathname, router, nav, prefetchNav]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="admin-layout">
      {menuOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <AdminBrand />
        {user && <p className="admin-user">{user.name}</p>}
        <nav className="admin-nav">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={prefetchNav}
                className={`admin-nav-link${isActive ? ' is-active' : ''}`}
              >
                {isActive && <NavFlameIndicator />}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="btn btn-secondary admin-logout"
          onClick={logout}
        >
          Sair
        </button>
      </aside>
      <div className="admin-content">
        <header className="admin-mobile-header">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="admin-menu-icon" aria-hidden />
          </button>
          <AdminBrand logoSize={28} />
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
