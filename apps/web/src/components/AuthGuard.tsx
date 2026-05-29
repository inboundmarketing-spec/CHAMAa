'use client';

import { useLayoutEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import {
  getAdminUser,
  isSportsOnly,
  canManageAuthorizations,
  canAccessConfirmations,
  canManageBroadcasts,
  canManageFestas,
} from '@/lib/admin-user';
import { AdminShell } from './AdminShell';
import { PageSkeleton } from './PageSkeleton';

const DEFAULT_HOME = '/dashboard';

function isSportsOnlyAllowedPath(
  pathname: string,
  user: ReturnType<typeof getAdminUser>,
) {
  if (pathname === DEFAULT_HOME) return true;
  if (pathname === '/matches') return true;
  if (pathname === '/local-places') return true;
  if (
    pathname === '/authorizations' &&
    (canManageAuthorizations(user) || canAccessConfirmations(user))
  ) {
    return true;
  }
  if (pathname === '/confirmations') {
    return true;
  }
  return false;
}

function isPathAllowedForUser(
  pathname: string,
  user: ReturnType<typeof getAdminUser>,
) {
  if (isSportsOnly(user)) {
    return isSportsOnlyAllowedPath(pathname, user);
  }
  if (pathname === '/events' && !canManageFestas(user)) return false;
  if (
    (pathname === '/campaigns' || pathname === '/instagram') &&
    !canManageBroadcasts(user)
  ) {
    return false;
  }
  return true;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(false);

    if (!getToken()) {
      router.replace('/login');
      return;
    }

    const user = getAdminUser();
    if (!isPathAllowedForUser(pathname, user)) {
      router.replace(DEFAULT_HOME);
      return;
    }

    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar" />
        <div className="admin-content">
          <header className="admin-mobile-header">
            <span className="admin-menu-toggle" aria-hidden />
            <h2 className="admin-brand">
              O <span>Inter</span>
            </h2>
          </header>
          <main className="admin-main">
            <PageSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
