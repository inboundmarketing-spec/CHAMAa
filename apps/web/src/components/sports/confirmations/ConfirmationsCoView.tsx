'use client';

import { OpsSection } from './shared';
import { ClosureRequestList } from './ClosureRequestList';
import { AssignNeutralForm } from './AssignNeutralForm';
import { AssignmentsList } from './AssignmentsList';
import type {
  AssignFilters,
  Assignment,
  ClosureRequest,
  ConfirmationsActions,
  NeutralUser,
} from './types';

export function ConfirmationsCoView({
  venueName,
  venueAuthorized,
  pending,
  assignments,
  neutrals,
  filters,
  actions,
}: {
  venueName?: string;
  venueAuthorized: boolean;
  pending: ClosureRequest[];
  assignments: Assignment[];
  neutrals: NeutralUser[];
  filters: AssignFilters;
  actions: ConfirmationsActions;
}) {
  return (
    <div className="auth-ops-restricted">
      <div
        className={`auth-ops-restricted__banner${venueAuthorized ? ' auth-ops-restricted__banner--ok' : ''}`}
      >
        <strong>
          {venueName ? `Praça: ${venueName}` : 'C.O. da praça'}
        </strong>
        {venueAuthorized ? (
          <p>
            Sua praça está autorizada. Você pode atribuir neutros e aprovar
            encerramentos das partidas da praça.
          </p>
        ) : (
          <p>
            Aguardando liberação da Mesa, Criativa ou Diretor C.O. Só depois
            disso você poderá atribuir neutros.
          </p>
        )}
      </div>

      <ol className="auth-ops-steps">
        <li className="auth-ops-steps__item">
          <OpsSection
            title="1. Encerramentos"
            description="Neutros solicitam; você aprova ou rejeita."
            badge={pending.length}
          >
            <ClosureRequestList
              requests={pending}
              onApprove={actions.approve}
              onReject={actions.reject}
            />
          </OpsSection>
        </li>

        {venueAuthorized && (
          <li className="auth-ops-steps__item">
            <OpsSection
              title="2. Atribuir neutro"
              description="Defina quem opera o placar em cada partida da sua praça."
            >
              <AssignNeutralForm
                filters={filters}
                neutrals={neutrals}
                onSubmit={actions.assignNeutral}
                compact
              />
            </OpsSection>
          </li>
        )}

        <li className="auth-ops-steps__item">
          <OpsSection
            title={venueAuthorized ? '3. Neutros ativos' : '2. Neutros ativos'}
            description="Atribuições em vigor na sua praça."
          >
            <AssignmentsList
              assignments={assignments}
              onRevoke={actions.revokeAssignment}
            />
          </OpsSection>
        </li>
      </ol>
    </div>
  );
}
