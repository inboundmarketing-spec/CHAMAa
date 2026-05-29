'use client';

import { useMemo, useState } from 'react';
import { hasFullAccess } from '@/lib/admin-user';
import { getAdminUser } from '@/lib/admin-user';
import { KpiCard, OpsSection, SubNav } from './shared';
import { CoAuthorizationPanel } from './CoAuthorizationPanel';
import { ClosureRequestList } from './ClosureRequestList';
import { AssignNeutralForm } from './AssignNeutralForm';
import { AssignmentsList } from './AssignmentsList';
import type {
  AssignFilters,
  ConfirmationsActions,
  ConfirmationsData,
} from './types';
import type { MatchRow } from '../MatchesTab';

type OverviewSection = 'summary' | 'co' | 'closures' | 'assign' | 'active';

export function ConfirmationsOverviewView({
  data,
  matches,
  filters,
  actions,
  showExecutiveSummary,
}: {
  data: ConfirmationsData;
  matches: MatchRow[];
  filters: AssignFilters;
  actions: ConfirmationsActions;
  /** Mesa/Criativa/Admin: resumo executivo; Diretor C.O.: abas sem KPIs. */
  showExecutiveSummary: boolean;
}) {
  const user = getAdminUser();
  const canAuthorizeCo = hasFullAccess(user);

  const pending = data.closureRequests;
  const assignments = data.assignments;
  const neutrals = data.neutrals ?? [];
  const coordinators = data.coordinators ?? [];
  const venueAuthorizations = data.venueAuthorizations ?? [];

  const authorizedCoordinatorIds = new Set(
    venueAuthorizations.map((a) => a.coordinator.id),
  );
  const pendingCoordinators = coordinators.filter(
    (c) => !authorizedCoordinatorIds.has(c.id),
  );

  const liveCount = matches.filter((m) => m.status === 'live').length;

  const defaultSection: OverviewSection = showExecutiveSummary
    ? 'summary'
    : 'co';

  const [section, setSection] = useState<OverviewSection>(defaultSection);

  const navItems = useMemo(() => {
    const items: { id: OverviewSection; label: string; badge?: number }[] = [];
    if (showExecutiveSummary) {
      items.push({ id: 'summary', label: 'Visão geral' });
    }
    if (canAuthorizeCo) {
      items.push({
        id: 'co',
        label: 'C.O. praça',
        badge: pendingCoordinators.length,
      });
    }
    items.push({
      id: 'closures',
      label: 'Encerramentos',
      badge: pending.length,
    });
    items.push({ id: 'assign', label: 'Atribuir neutro' });
    items.push({
      id: 'active',
      label: 'Neutros ativos',
      badge: assignments.length,
    });
    return items;
  }, [
    showExecutiveSummary,
    canAuthorizeCo,
    pendingCoordinators.length,
    pending.length,
    assignments.length,
  ]);

  return (
    <div className="auth-ops-overview">
      <p className="auth-ops-overview__intro page-intro" style={{ marginTop: 0 }}>
        {showExecutiveSummary
          ? 'Visão geral de todas as praças: libere C.O., acompanhe encerramentos e neutros.'
          : 'Gestão operacional do C.O.: praças, encerramentos e neutros.'}
      </p>

      <SubNav items={navItems} active={section} onSelect={setSection} />

      {section === 'summary' && showExecutiveSummary && (
        <div className="auth-ops-stack">
          <div className="auth-ops-kpi-grid">
            <KpiCard
              label="Encerramentos pendentes"
              value={pending.length}
              highlight={pending.length > 0}
            />
            <KpiCard
              label="C.O. aguardando liberação"
              value={pendingCoordinators.length}
              highlight={pendingCoordinators.length > 0}
            />
            <KpiCard label="Neutros com acesso" value={assignments.length} />
            <KpiCard label="Partidas ao vivo" value={liveCount} />
          </div>

          <OpsSection
            title="Próximas ações"
            description="Atalhos para o que precisa de atenção agora."
          >
            <ul className="auth-ops-checklist">
              {pendingCoordinators.length > 0 && (
                <li>
                  <button
                    type="button"
                    className="auth-ops-checklist__link"
                    onClick={() => setSection('co')}
                  >
                    Liberar {pendingCoordinators.length} C.O. da praça
                  </button>
                </li>
              )}
              {pending.length > 0 && (
                <li>
                  <button
                    type="button"
                    className="auth-ops-checklist__link"
                    onClick={() => setSection('closures')}
                  >
                    Revisar {pending.length} encerramento(s)
                  </button>
                </li>
              )}
              {pendingCoordinators.length === 0 && pending.length === 0 && (
                <li style={{ color: 'var(--muted)' }}>
                  Nenhuma pendência crítica no momento.
                </li>
              )}
            </ul>
          </OpsSection>
        </div>
      )}

      {section === 'co' && canAuthorizeCo && (
        <CoAuthorizationPanel
          pendingCoordinators={pendingCoordinators}
          venueAuthorizations={venueAuthorizations}
          onAuthorize={actions.authorizeCoordinator}
          onRevoke={actions.revokeVenueAuthorization}
        />
      )}

      {section === 'closures' && (
        <OpsSection
          title="Encerramentos pendentes"
          description="Solicitações de neutros aguardando aprovação."
          badge={pending.length}
        >
          <ClosureRequestList
            requests={pending}
            onApprove={actions.approve}
            onReject={actions.reject}
          />
        </OpsSection>
      )}

      {section === 'assign' && (
        <AssignNeutralForm
          filters={filters}
          neutrals={neutrals}
          onSubmit={actions.assignNeutral}
        />
      )}

      {section === 'active' && (
        <OpsSection
          title="Neutros com acesso"
          description="Todas as atribuições ativas no evento."
        >
          <AssignmentsList
            assignments={assignments}
            onRevoke={actions.revokeAssignment}
          />
        </OpsSection>
      )}
    </div>
  );
}
