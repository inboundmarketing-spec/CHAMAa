'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';
import { getAdminUser, roleLabel } from '@/lib/admin-user';
import { AtleticaLogo } from '@/components/sports/AtleticaLogo';
import {
  DashboardKpiIcon,
  kpiIconForLabel,
} from '@/components/icons/DashboardKpiIcon';
import { ChaminhaPageAccent } from '@/components/chaminha/ChaminhaPageAccent';

type DashboardCard = {
  label: string;
  value: number;
  href?: string;
};

type TopStanding = {
  position: number;
  team: string;
  points: number;
  played: number;
};

type DashboardData = {
  role: string;
  roleLabel: string;
  cards: DashboardCard[];
  topStandings: TopStanding[];
};

function DashboardKpiCard({ item }: { item: DashboardCard }) {
  const highlight = item.value > 0;
  const body = (
    <>
      <span className="dashboard-kpi-icon" aria-hidden>
        <DashboardKpiIcon name={kpiIconForLabel(item.label)} />
      </span>
      <div className="dashboard-kpi-body">
        <div className={`dashboard-kpi-value${highlight ? ' dashboard-kpi-value--active' : ''}`}>
          {item.value}
        </div>
        <div className="dashboard-kpi-label">{item.label}</div>
      </div>
      {item.href && (
        <span className="dashboard-kpi-chevron" aria-hidden>
          <DashboardKpiIcon name="chevron" />
        </span>
      )}
    </>
  );

  const className = [
    'card',
    'dashboard-kpi-card',
    item.href ? 'dashboard-kpi-card--link' : '',
    highlight ? 'dashboard-kpi-card--highlight' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (item.href) {
    return (
      <Link key={item.label} href={item.href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <div key={item.label} className={className}>
      {body}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const user = getAdminUser();

  useEffect(() => {
    api<DashboardData>('/api/admin/dashboard').then(setData).catch(console.error);
  }, []);

  if (!data) return <PageSkeleton />;

  const subtitleParts = [
    `Visão para ${data.roleLabel}`,
    user?.name,
    user && user.role !== data.role ? `(${roleLabel(user.role)})` : null,
  ].filter(Boolean);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <ChaminhaPageAccent size={48} variant="corner" />
        <div className="dashboard-header-text">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">{subtitleParts.join(' — ')}</p>
        </div>
      </header>

      {data.cards.length > 0 && (
        <section className="dashboard-kpi-section" aria-label="Indicadores">
          <div className="dashboard-kpi-grid">
            {data.cards.map((item) => (
              <DashboardKpiCard key={item.label} item={item} />
            ))}
          </div>
        </section>
      )}

      {data.topStandings.length > 0 && (
        <section className="dashboard-standings-section">
          <div className="dashboard-section-head">
            <h2>Classificação</h2>
            <Link href="/matches?tab=standings" className="btn btn-secondary btn-sm">
              Ver tabela completa
            </Link>
          </div>
          <div className="card dashboard-standings-card">
            <ol className="dashboard-standings-preview">
              {data.topStandings.map((row) => (
                <li key={row.team} className="dashboard-standings-row">
                  <span className="dashboard-standings-pos">{row.position}º</span>
                  <AtleticaLogo name={row.team} size={32} />
                  <span className="dashboard-standings-team">{row.team}</span>
                  <span className="dashboard-standings-pts">
                    {row.points} pts · {row.played} J
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
