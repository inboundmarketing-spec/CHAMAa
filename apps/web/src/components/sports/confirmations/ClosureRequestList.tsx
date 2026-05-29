'use client';

import { STATUS_LABELS } from '@/lib/sports-labels';
import {
  formatPlacementScore,
  isPlacementMatch,
} from '@/lib/placement-match';
import { MatchTeams, MatchParticipantsList } from '../AtleticaLogo';
import { ModalidadeLabel } from '../ModalidadeLabel';
import type { ClosureRequest } from './types';

export function ClosureRequestList({
  requests,
  onApprove,
  onReject,
  showActions = true,
}: {
  requests: ClosureRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showActions?: boolean;
}) {
  if (requests.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        Nenhuma solicitação pendente.
      </p>
    );
  }

  return (
    <>
      {requests.map((r) => (
        <div key={r.id} className="auth-ops-list-item">
          <div className="auth-ops-list-item__meta">
            <ModalidadeLabel
              name={r.match.modalidade.name}
              gender={r.match.modalidade.gender}
              division={r.match.division}
            />
          </div>
          {isPlacementMatch(r.match.modalidade) ? (
            <MatchParticipantsList participants={r.match.participants ?? []} />
          ) : (
            <MatchTeams
              homeTeam={r.match.homeTeam}
              awayTeam={r.match.awayTeam}
            />
          )}
          <p style={{ margin: '0.35rem 0', color: 'var(--muted)' }}>
            {r.match.venue?.name ?? 'Sem praça'}
            {r.requestedBy && (
              <>
                {' '}
                · Solicitado por <strong>{r.requestedBy.name}</strong>
              </>
            )}
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            {isPlacementMatch(r.match.modalidade) ? (
              <>
                Colocações:{' '}
                <strong>{formatPlacementScore(r.match.participants)}</strong>
              </>
            ) : (
              <>
                Placar:{' '}
                <strong>
                  {r.homeScore} x {r.awayScore}
                </strong>
              </>
            )}
          </p>
          {showActions ? (
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onApprove(r.id)}
              >
                Autorizar encerramento
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onReject(r.id)}
              >
                Rejeitar
              </button>
            </div>
          ) : (
            <span className="badge">{STATUS_LABELS[r.status] ?? r.status}</span>
          )}
        </div>
      ))}
    </>
  );
}
