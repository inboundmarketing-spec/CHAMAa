'use client';

import type { CoordinatorUser, VenueAuthorization } from './types';
import { OpsSection } from './shared';

export function CoAuthorizationPanel({
  pendingCoordinators,
  venueAuthorizations,
  onAuthorize,
  onRevoke,
}: {
  pendingCoordinators: CoordinatorUser[];
  venueAuthorizations: VenueAuthorization[];
  onAuthorize: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <OpsSection
      title="C.O. da praça"
      description="Libere cada C.O. para atribuir neutros e aprovar encerramentos na praça dele."
      badge={pendingCoordinators.length}
    >
      {pendingCoordinators.length === 0 &&
      venueAuthorizations.length === 0 ? (
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Nenhum C.O. da praça cadastrado.
        </p>
      ) : (
        <>
          {pendingCoordinators.length > 0 && (
            <>
              <p
                style={{
                  margin: '0 0 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                }}
              >
                Aguardando liberação
              </p>
              {pendingCoordinators.map((c) => (
                <div key={c.id} className="action-row">
                  <div>
                    <strong>{c.name}</strong>
                    <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                      {c.venue?.name ?? 'Sem praça vinculada'} · {c.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onAuthorize(c.id)}
                    disabled={!c.venueId}
                  >
                    Autorizar
                  </button>
                </div>
              ))}
            </>
          )}
          {venueAuthorizations.length > 0 && (
            <>
              <p
                style={{
                  margin: '1rem 0 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                }}
              >
                Já autorizados
              </p>
              {venueAuthorizations.map((a) => (
                <div key={a.id} className="action-row">
                  <div>
                    <strong>{a.coordinator.name}</strong>
                    <p style={{ margin: '0.25rem 0', color: 'var(--muted)' }}>
                      {a.venue.name} · por {a.authorizedBy.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onRevoke(a.id)}
                  >
                    Revogar
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </OpsSection>
  );
}
