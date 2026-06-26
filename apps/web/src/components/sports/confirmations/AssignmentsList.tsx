'use client';

import { isPlacementMatch } from '@/lib/placement-match';
import { MatchTeams, MatchParticipantsList } from '../AtleticaLogo';
import { ModalidadeLabel } from '../ModalidadeLabel';
import type { Assignment } from './types';

export function AssignmentsList({
  assignments,
  onRevoke,
}: {
  assignments: Assignment[];
  onRevoke: (id: string) => void;
}) {
  if (assignments.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        Nenhuma atribuição ativa.
      </p>
    );
  }

  return (
    <>
      {assignments.map((a) => (
        <div key={a.id} className="action-row">
          <div>
            <strong>{a.adminUser.name}</strong>
            <p
              style={{
                margin: '0.15rem 0',
                color: 'var(--muted)',
                fontSize: '0.85rem',
              }}
            >
              {a.adminUser.email}
            </p>
            <div
              className="auth-ops-list-item__meta"
              style={{ marginTop: '0.35rem' }}
            >
              <ModalidadeLabel
                name={a.match.modalidade.name}
                gender={a.match.modalidade.gender}
                division={a.match.division}
              />
            </div>
            {isPlacementMatch(a.match.modalidade) ? (
              <MatchParticipantsList
                participants={a.match.participants ?? []}
              />
            ) : (
              <p style={{ margin: '0.25rem 0' }}>
                <MatchTeams
                  homeTeam={a.match.homeTeam}
                  awayTeam={a.match.awayTeam}
                />
                {a.match.venue && (
                  <span
                    style={{ color: 'var(--muted)', fontSize: '0.85rem' }}
                  >
                    {' '}
                    · {a.match.venue.name}
                  </span>
                )}
              </p>
            )}
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
  );
}
