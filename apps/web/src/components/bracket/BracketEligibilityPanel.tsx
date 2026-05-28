'use client';

import type { DivisionDrawProgress } from '@/lib/bracket-progress';

export type BracketEligibilityApi = {
  modalidadeId: string;
  totalRegistered: number;
  excludedCount: number;
  excludedTeams: string[];
  eligibleCount: number;
  divisions: {
    division: string;
    divisionLabel: string;
    teamCount: number;
    teams: string[];
    firstRoundByeTeams: string[];
    oitavasMatchCount: number;
    totalConfrontos: number;
    structure: string;
    byeNote: string | null;
  }[];
};

type Props = {
  api: BracketEligibilityApi | null;
  loading?: boolean;
  error?: string | null;
  /** Progresso local (auditoria da chave já sorteada). */
  divisions?: DivisionDrawProgress[];
};

export function BracketEligibilityPanel({
  api,
  loading,
  error,
  divisions = [],
}: Props) {
  if (loading) {
    return (
      <p className="bracket-eligibility-loading">Carregando elegibilidade…</p>
    );
  }

  if (error) {
    return <p className="bracket-eligibility-error">{error}</p>;
  }

  if (!api) return null;

  const auditByLabel = new Map(
    divisions.map((d) => [d.divisionLabel, d.auditIssues]),
  );

  return (
    <div className="bracket-eligibility">
      <p className="bracket-eligibility-summary">
        <strong>{api.eligibleCount}</strong> atlética
        {api.eligibleCount === 1 ? '' : 's'} elegível
        {api.eligibleCount === 1 ? '' : 'is'} no sorteio
        {' · '}
        {api.excludedCount} excluída
        {api.excludedCount === 1 ? '' : 's'} de {api.totalRegistered} cadastradas
      </p>

      {api.divisions.map((div) => {
        const issues = auditByLabel.get(div.divisionLabel) ?? [];
        const parity =
          div.teamCount % 2 === 0
            ? 'Par — todos jogam a 1ª rodada.'
            : 'Ímpar — 1 atlética com folga na 1ª rodada.';

        return (
          <section key={div.divisionLabel} className="bracket-eligibility-div">
            <h5 className="bracket-eligibility-div-title">
              {div.divisionLabel}{' '}
              <span className="bracket-eligibility-count">
                ({div.teamCount} atlética{div.teamCount === 1 ? '' : 's'})
              </span>
            </h5>
            <p className="bracket-eligibility-meta">{parity}</p>
            <p className="bracket-eligibility-meta">{div.structure}</p>
            {div.firstRoundByeTeams.length > 0 && (
              <p className="bracket-eligibility-bye">
                Folga nas oitavas:{' '}
                <strong>{div.firstRoundByeTeams.join(', ')}</strong>
                {' — '}
                entra nas quartas (confronto sorteado depois das oitavas).
              </p>
            )}
            {div.byeNote && (
              <p className="bracket-eligibility-note">{div.byeNote}</p>
            )}
            <details className="bracket-eligibility-teams">
              <summary>Ver lista ({div.teams.length})</summary>
              <ul>
                {div.teams.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </details>
            {issues.length > 0 && (
              <div className="bracket-eligibility-issues" role="alert">
                <p className="bracket-eligibility-issues-title">
                  Atenção na chave já montada
                </p>
                <ul>
                  {issues.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
