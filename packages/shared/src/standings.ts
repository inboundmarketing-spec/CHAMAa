import { AtleticaDivisionTier } from './divisions';

/** Legado: vitória/empate/derrota em jogos (estatísticas auxiliares). */
export const STANDINGS_POINTS = {
  win: 3,
  draw: 1,
  loss: 0,
} as const;

export type StandingRow = {
  position: number;
  team: string;
  atleticaId: string;
  division?: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export function sortStandingsRows(
  rows: Omit<StandingRow, 'position' | 'goalDifference'>[],
): StandingRow[] {
  const withGd = rows.map((r) => ({
    ...r,
    goalDifference: r.goalsFor - r.goalsAgainst,
  }));

  withGd.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team, 'pt-BR');
  });

  return withGd.map((r, i) => ({ ...r, position: i + 1 }));
}

export function formatStandingsTable(rows: StandingRow[], maxRows = 24): string {
  if (!rows.length) {
    return 'Classificação ainda não disponível.';
  }

  const slice = rows.slice(0, maxRows);
  const header = 'Pos  Atlética          P  J  V  E  D  SG';
  const lines = slice.map((r) => {
    const pos = String(r.position).padStart(2, ' ');
    const team = r.team.slice(0, 16).padEnd(16, ' ');
    const sg =
      r.goalDifference >= 0
        ? `+${r.goalDifference}`
        : String(r.goalDifference);
    return `${pos}  ${team}  ${String(r.points).padStart(2, ' ')}  ${String(r.played).padStart(2, ' ')}  ${String(r.wins).padStart(2, ' ')}  ${String(r.draws).padStart(2, ' ')}  ${String(r.losses).padStart(2, ' ')}  ${sg.padStart(3, ' ')}`;
  });

  return `${header}\n${lines.join('\n')}`;
}

function positionEmoji(position: number): string {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `${position}.`;
}

function formatStandingLine(r: StandingRow): string {
  return `${positionEmoji(r.position)} *${r.team}* — ${r.points} pts`;
}

function formatDivisionBlock(
  title: string,
  rows: StandingRow[],
  maxRows = 14,
): string {
  const slice = rows.slice(0, maxRows);
  if (!slice.length) return `*${title}*\n_(sem dados)_`;
  return `*${title}*\n${slice.map(formatStandingLine).join('\n')}`;
}

/** Mensagem legível para WhatsApp (sem bloco monoespaçado). */
export function formatStandingsWhatsApp(
  rows: StandingRow[],
  updatedAt?: Date,
  options?: { title?: string; showDivisions?: boolean },
): string {
  if (!rows.length) {
    return 'Classificação ainda não disponível.';
  }

  const title = options?.title ?? '📋 *Classificação geral*';
  const showDivisions = options?.showDivisions ?? true;

  const parts: string[] = [title, ''];

  if (showDivisions) {
    const first = rows.filter(
      (r) => r.division === AtleticaDivisionTier.FIRST || !r.division,
    );
    const second = rows.filter(
      (r) => r.division === AtleticaDivisionTier.SECOND,
    );
    parts.push(formatDivisionBlock('1ª divisão', first));
    parts.push('');
    parts.push(formatDivisionBlock('2ª divisão', second));
  } else {
    const slice = rows.slice(0, 20);
    parts.push(slice.map(formatStandingLine).join('\n'));
  }

  if (updatedAt) {
    const time = updatedAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    parts.push('', `_Atualizado às ${time}_`);
  }

  return parts.join('\n').trim();
}
