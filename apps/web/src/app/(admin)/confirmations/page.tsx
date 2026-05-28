'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  useAdminUser,
  canAccessConfirmations,
  roleLabel,
} from '@/lib/admin-user';
import { ConfirmationsTab } from '@/components/sports/ConfirmationsTab';
import { PageSkeleton } from '@/components/PageSkeleton';
import type { MatchRow } from '@/components/sports/MatchesTab';

export default function ConfirmationsPage() {
  const user = useAdminUser();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const m = await api<MatchRow[]>('/api/admin/matches');
    setMatches(m);

    try {
      const conf = await api<{ closureRequests: unknown[] }>(
        '/api/admin/confirmations',
      );
      setPendingCount(conf.closureRequests.length);
    } catch {
      setPendingCount(0);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user || !canAccessConfirmations(user)) return;
    load().catch(console.error);
  }, [user, load]);

  if (!user || !canAccessConfirmations(user)) {
    return (
      <div>
        <h1>Confirmações</h1>
        <p style={{ color: 'var(--muted)' }}>
          Seu cargo não tem acesso a esta área.
        </p>
      </div>
    );
  }

  if (!ready) return <PageSkeleton />;

  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>
        Confirmações
        {pendingCount > 0 && (
          <span className="badge badge-live" style={{ marginLeft: 8 }}>
            {pendingCount}
          </span>
        )}
      </h1>
      <p className="page-intro">
        Encerramentos de partidas e atribuição de neutros.
        {user && (
          <>
            {' '}
            Você está como <strong>{user.name}</strong> (
            {roleLabel(user.role)}).
          </>
        )}
      </p>
      <ConfirmationsTab matches={matches} onReload={load} />
    </div>
  );
}
