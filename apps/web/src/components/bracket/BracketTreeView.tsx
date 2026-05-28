'use client';

import { AtleticaLogo } from '@/components/sports/AtleticaLogo';
import {
  type BracketMatchLike,
  groupByRound,
  isByeMatch,
  isPendingMatch,
  matchLabel,
  parseConfrontoFromInfo,
  sortRounds,
} from '@/lib/bracket-utils';

type Props = {
  matches: BracketMatchLike[];
  highlightRound?: string | null;
  highlightConfronto?: number | null;
  emptyMessage?: string;
};

export function BracketTreeView({
  matches,
  highlightRound,
  highlightConfronto,
  emptyMessage = 'Nenhuma chave montada para esta modalidade.',
}: Props) {
  const bracketMatches = matches.filter((m) => m.bracketRound);
  if (bracketMatches.length === 0) {
    return (
      <div className="bracket-tree-empty">
        <span className="bracket-tree-empty-icon" aria-hidden>
          🏆
        </span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const byRound = groupByRound(bracketMatches);
  const displayRounds = sortRounds([...byRound.keys()]);

  return (
    <div className="bracket-tree-wrap">
      <div className="bracket-tree" role="list" aria-label="Chaveamento visual">
        {displayRounds.map((round, colIndex) => {
          const roundMatches = [...(byRound.get(round) ?? [])].sort(
            (a, b) =>
              parseConfrontoFromInfo(a.bracketInfo) -
              parseConfrontoFromInfo(b.bracketInfo),
          );
          const isHighlight =
            highlightRound != null && round.startsWith(highlightRound);
          return (
            <div
              key={round}
              className={`bracket-tree-col${isHighlight ? ' is-highlight' : ''}`}
              style={{ animationDelay: `${colIndex * 80}ms` }}
              role="listitem"
            >
              <div className="bracket-tree-col-head">
                <span className="bracket-tree-phase">{round}</span>
                <span className="bracket-tree-count">{roundMatches.length}</span>
              </div>
              <div className="bracket-tree-slots">
                {roundMatches.map((m, i) => (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    index={i}
                    isNew={
                      highlightConfronto != null &&
                      parseConfrontoFromInfo(m.bracketInfo) === highlightConfronto
                    }
                  />
                ))}
              </div>
              {colIndex < displayRounds.length - 1 && (
                <div className="bracket-tree-connector" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  index,
  isNew,
}: {
  match: BracketMatchLike;
  index: number;
  isNew?: boolean;
}) {
  const bye = isByeMatch(match);
  const pending = isPendingMatch(match);
  const confronto = parseConfrontoFromInfo(match.bracketInfo);

  if (pending) {
    return (
      <div
        className={`bracket-slot is-pending${isNew ? ' is-new' : ''}`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {confronto > 0 && (
          <span className="bracket-slot-num">#{confronto}</span>
        )}
        <span className="bracket-slot-pending-label">{matchLabel(match)}</span>
      </div>
    );
  }

  return (
    <div
      className={`bracket-slot${bye ? ' is-bye' : ''}${isNew ? ' is-new' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {confronto > 0 && (
        <span className="bracket-slot-num">#{confronto}</span>
      )}
      <div className="bracket-slot-team bracket-slot-home">
        <AtleticaLogo name={match.homeTeam!} size={24} />
        <span className="bracket-slot-name">{match.homeTeam}</span>
      </div>
      {bye ? (
        <div className="bracket-slot-vs">
          <span className="bracket-bye-badge">Folga</span>
        </div>
      ) : (
        <div className="bracket-slot-vs">×</div>
      )}
      {!bye && match.awayTeam && (
        <div className="bracket-slot-team bracket-slot-away">
          <AtleticaLogo name={match.awayTeam} size={24} />
          <span className="bracket-slot-name">{match.awayTeam}</span>
        </div>
      )}
    </div>
  );
}
