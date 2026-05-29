'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  getAdminUser,
  hasFullAccess,
  isConfirmationsOverview,
  isCoDirectorRole,
  isNeutral,
  isVenueCoordinator,
} from '@/lib/admin-user';
import { dedupeModalidades } from '@/lib/sports-labels';
import type { MatchRow } from './MatchesTab';
import type { ConfirmationsData } from './confirmations/types';
import { ConfirmationsNeutralView } from './confirmations/ConfirmationsNeutralView';
import { ConfirmationsCoView } from './confirmations/ConfirmationsCoView';
import { ConfirmationsOverviewView } from './confirmations/ConfirmationsOverviewView';

export function ConfirmationsTab({
  matches,
  onReload,
  onPendingCountChange,
}: {
  matches: MatchRow[];
  onReload: () => Promise<void>;
  onPendingCountChange?: (count: number) => void;
}) {
  const user = getAdminUser();
  const isCo = isVenueCoordinator(user);
  const isNeut = isNeutral(user);
  const isOverview = isConfirmationsOverview(user);
  const isDirector = isCoDirectorRole(user);
  const isManagement = isOverview || isDirector || (hasFullAccess(user) && !isCo && !isNeut);

  const [data, setData] = useState<ConfirmationsData | null>(null);
  const [assignMatchId, setAssignMatchId] = useState('');
  const [assignNeutralId, setAssignNeutralId] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterModalidadeId, setFilterModalidadeId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api<ConfirmationsData>('/api/admin/confirmations');
      setData(res);
      onPendingCountChange?.(res.closureRequests.length);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Erro ao carregar confirmações',
      );
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const assignableMatches = useMemo(
    () => matches.filter((m) => m.status !== 'finished'),
    [matches],
  );

  const catalogModalidades = useMemo(
    () => dedupeModalidades(assignableMatches.map((m) => m.modalidade)),
    [assignableMatches],
  );

  const filteredModalidades = useMemo(
    () =>
      catalogModalidades.filter(
        (m) => filterGender === 'all' || m.gender === filterGender,
      ),
    [catalogModalidades, filterGender],
  );

  const filteredMatches = useMemo(() => {
    return assignableMatches.filter((m) => {
      if (isCo && user?.venueId && m.venueId !== user.venueId) return false;
      if (filterGender !== 'all' && m.modalidade.gender !== filterGender) {
        return false;
      }
      if (
        filterModalidadeId !== 'all' &&
        m.modalidade.id !== filterModalidadeId
      ) {
        return false;
      }
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      return true;
    });
  }, [
    assignableMatches,
    filterGender,
    filterModalidadeId,
    filterStatus,
    isCo,
    user?.venueId,
  ]);

  useEffect(() => {
    if (
      assignMatchId &&
      !filteredMatches.some((m) => m.id === assignMatchId)
    ) {
      setAssignMatchId('');
    }
  }, [filteredMatches, assignMatchId]);

  useEffect(() => {
    if (
      filterModalidadeId !== 'all' &&
      !filteredModalidades.some((m) => m.id === filterModalidadeId)
    ) {
      setFilterModalidadeId('all');
    }
  }, [filteredModalidades, filterModalidadeId]);

  const assignFilters = useMemo(
    () => ({
      filterGender,
      filterModalidadeId,
      filterStatus,
      assignMatchId,
      assignNeutralId,
      setFilterGender,
      setFilterModalidadeId,
      setFilterStatus,
      setAssignMatchId,
      setAssignNeutralId,
      resetAssignFilters: () => {
        setFilterGender('all');
        setFilterModalidadeId('all');
        setFilterStatus('all');
        setAssignMatchId('');
      },
      filteredMatches,
      filteredModalidades,
    }),
    [
      filterGender,
      filterModalidadeId,
      filterStatus,
      assignMatchId,
      assignNeutralId,
      filteredMatches,
      filteredModalidades,
    ],
  );

  const actions = useMemo(
    () => ({
      approve: async (id: string) => {
        await api(`/api/admin/confirmations/closure-requests/${id}/approve`, {
          method: 'PATCH',
        });
        await Promise.all([load(), onReload()]);
      },
      reject: async (id: string) => {
        await api(`/api/admin/confirmations/closure-requests/${id}/reject`, {
          method: 'PATCH',
        });
        await load();
      },
      assignNeutral: async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignMatchId || !assignNeutralId) return;
        await api('/api/admin/confirmations/assignments', {
          method: 'POST',
          body: JSON.stringify({
            matchId: assignMatchId,
            neutralUserId: assignNeutralId,
          }),
        });
        setAssignMatchId('');
        setAssignNeutralId('');
        await load();
      },
      revokeAssignment: async (id: string) => {
        await api(`/api/admin/confirmations/assignments/${id}`, {
          method: 'DELETE',
        });
        await load();
      },
      authorizeCoordinator: async (coordinatorId: string) => {
        await api('/api/admin/confirmations/venue-authorizations', {
          method: 'POST',
          body: JSON.stringify({ coordinatorId }),
        });
        await load();
      },
      revokeVenueAuthorization: async (id: string) => {
        await api(`/api/admin/confirmations/venue-authorizations/${id}`, {
          method: 'DELETE',
        });
        await load();
      },
    }),
    [assignMatchId, assignNeutralId, load, onReload],
  );

  if (loadError && !data) {
    return (
      <div className="card">
        <p style={{ color: '#ff6b6b', margin: '0 0 1rem' }}>{loadError}</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => load()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--muted)' }}>Carregando…</p>
      </div>
    );
  }

  if (!data) return null;

  if (isNeut) {
    return <ConfirmationsNeutralView requests={data.closureRequests} />;
  }

  if (isCo) {
    const venueName = matches.find((m) => m.venueId === user?.venueId)?.venue
      ?.name;
    return (
      <ConfirmationsCoView
        venueName={venueName}
        venueAuthorized={data.venueAuthorized ?? false}
        pending={data.closureRequests}
        assignments={data.assignments}
        neutrals={data.neutrals ?? []}
        filters={assignFilters}
        actions={actions}
      />
    );
  }

  if (isManagement) {
    return (
      <ConfirmationsOverviewView
        data={data}
        matches={matches}
        filters={assignFilters}
        actions={actions}
        showExecutiveSummary={isOverview}
      />
    );
  }

  return null;
}
