'use client';

import { OpsSection } from './shared';
import { ClosureRequestList } from './ClosureRequestList';
import type { ClosureRequest } from './types';

export function ConfirmationsNeutralView({
  requests,
}: {
  requests: ClosureRequest[];
}) {
  return (
    <div className="auth-ops-restricted">
      <div className="auth-ops-restricted__banner">
        <strong>Área do neutro</strong>
        <p>
          Você acompanha apenas suas solicitações de encerramento. Para operar
          placar ao vivo, o C.O. da praça precisa atribuir você à partida em{' '}
          <strong>Autorizações → Confirmações</strong> (visão deles).
        </p>
      </div>

      <OpsSection
        title="Minhas solicitações"
        description="Status das partidas que você pediu para encerrar."
      >
        {requests.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Nenhuma solicitação registrada.
          </p>
        ) : (
          <ClosureRequestList
            requests={requests}
            onApprove={() => undefined}
            onReject={() => undefined}
            showActions={false}
          />
        )}
      </OpsSection>
    </div>
  );
}
