'use client';

import { STATUS_LABELS, formatModalidadeOption } from '@/lib/sports-labels';
import { isPlacementMatch } from '@/lib/placement-match';
import type { MatchRow } from '../MatchesTab';

export function OpsSection({
  title,
  description,
  badge,
  children,
  variant,
}: {
  title: string;
  description?: string;
  badge?: number;
  children?: React.ReactNode;
  variant?: 'warning' | 'success';
}) {
  return (
    <section
      className="card auth-ops-section"
      style={
        variant === 'warning'
          ? { borderColor: 'var(--warning, #c9a227)' }
          : variant === 'success'
            ? { borderColor: 'var(--accent-border)' }
            : undefined
      }
    >
      <header className="auth-ops-section__head">
        <h3 style={{ margin: 0 }}>
          {title}
          {badge != null && badge > 0 && (
            <span className="badge badge-live" style={{ marginLeft: 8 }}>
              {badge}
            </span>
          )}
        </h3>
        {description && (
          <p className="auth-ops-section__desc">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`auth-ops-kpi${highlight ? ' auth-ops-kpi--highlight' : ''}`}>
      <span className="auth-ops-kpi__value">{value}</span>
      <span className="auth-ops-kpi__label">{label}</span>
      {hint && <span className="auth-ops-kpi__hint">{hint}</span>}
    </div>
  );
}

export function matchOptionLabel(m: MatchRow): string {
  const mod = formatModalidadeOption(m.modalidade.name, m.modalidade.gender);
  const status = STATUS_LABELS[m.status] ?? m.status;
  if (isPlacementMatch(m.modalidade)) {
    const teams = (m.participants ?? []).map((p) => p.team).join(', ');
    return `${mod} · ${m.division ?? 'Prova'} · ${teams || '—'} · ${status}`;
  }
  return `${mod} · ${m.homeTeam ?? '?'} x ${m.awayTeam ?? '?'} · ${m.venue?.name ?? 'Sem praça'} · ${status}`;
}

export function SubNav<T extends string>({
  items,
  active,
  onSelect,
}: {
  items: { id: T; label: string; badge?: number }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <nav className="auth-ops-subnav" aria-label="Seções">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`auth-ops-subnav__btn${active === item.id ? ' is-active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
          {item.badge != null && item.badge > 0 && (
            <span className="badge badge-live" style={{ marginLeft: 6 }}>
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
