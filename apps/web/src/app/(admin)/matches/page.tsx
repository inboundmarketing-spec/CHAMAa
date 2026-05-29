'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUrlTab } from '@/lib/use-url-tab';
import { api } from '@/lib/api';
import {
  useAdminUser,
  hasFullAccess,
  isNeutral,
  isVenueCoordinator,
  roleLabel,
} from '@/lib/admin-user';
import { MatchesTab, type MatchRow } from '@/components/sports/MatchesTab';
import { LiveScoreTab } from '@/components/sports/LiveScoreTab';
import {
  StandingsTab,
  type StandingRow,
} from '@/components/sports/StandingsTab';
import { type Venue } from '@/components/sports/VenuesTab';

type Modalidade = {
  id: string;
  name: string;
  slug: string;
  category: string;
  gender: string;
  scoringMode?: string;
};

type TabId = 'matches' | 'live' | 'standings';

type StandingsApi = {
  first: StandingRow[];
  second: StandingRow[];
  updatedAt?: string;
};

export default function MatchesPage() {
  const user = useAdminUser();
  const isCo = isVenueCoordinator(user);
  const isNeut = isNeutral(user);
  const fullAccess = hasFullAccess(user);

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [
      { id: 'matches', label: 'Partidas' },
      { id: 'live', label: 'Placar ao vivo' },
      { id: 'standings', label: 'Classificação' },
    ];
    return list;
  }, []);

  const defaultTab: TabId = isCo || isNeut ? 'live' : 'matches';
  const { tab, selectTab } = useUrlTab({ tabs, defaultTab });
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [standingsPayload, setStandingsPayload] = useState<StandingsApi>({
    first: [],
    second: [],
  });
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  const load = useCallback(async () => {
    const [m, mod, v, st] = await Promise.all([
      api<MatchRow[]>('/api/admin/matches'),
      api<Modalidade[]>('/api/admin/catalog/modalidades'),
      api<Venue[]>('/api/admin/catalog/venues'),
      api<StandingsApi>('/api/admin/standings'),
    ]);
    setMatches(m);
    setModalidades(mod);
    setVenues(v);
    setStandingsPayload(st);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const liveCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>Esportes</h1>
      <p className="page-intro">
        Gestão de partidas, placar ao vivo e classificação. Praças esportivas
        ficam em Locais.
        {user && (
          <>
            {' '}
            Você está como <strong>{user.name}</strong> (
            {roleLabel(user.role)}).
          </>
        )}
      </p>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
            {t.id === 'live' && liveCount > 0 && (
              <span className="badge badge-live" style={{ marginLeft: 6 }}>
                {liveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <MatchesTab
          matches={matches}
          modalidades={modalidades}
          venues={venues}
          onReload={load}
          canCreate={fullAccess}
        />
      )}
      {tab === 'live' && (
        <LiveScoreTab matches={matches} onReload={load} />
      )}
      {tab === 'standings' && (
        <StandingsTab
          initialPayload={standingsPayload}
          canEditDivision={fullAccess}
          onReloadStandings={async () => {
            const st = await api<StandingsApi>('/api/admin/standings');
            setStandingsPayload(st);
            return st;
          }}
        />
      )}
    </div>
  );
}
