import { describeBracketPlan } from '@chama/shared';

export const BRACKET_PHASES = [
  'Oitavas',
  'Quartas',
  'Semifinal',
  'Final',
  '3º lugar',
] as const;

export type BracketPhase = (typeof BRACKET_PHASES)[number];

const PHASE_ORDER = new Map(BRACKET_PHASES.map((p, i) => [p, i]));

/** Ordem dentro da mesma fase (ex.: "Quartas (1ª divisão)"). */
const ROUND_BASE_ORDER: Record<string, number> = {
  Oitavas: 0,
  Quartas: 1,
  Semifinal: 2,
  Final: 3,
  '3º lugar': 4,
};

export type BracketMatchLike = {
  id: string;
  homeTeam: string | null;
  awayTeam: string | null;
  bracketRound: string | null;
  bracketInfo: string | null;
  status: string;
  venue?: { name: string } | null;
};

export function isByeMatch(m: BracketMatchLike): boolean {
  if (!m.homeTeam) return false;
  if (!m.awayTeam) return true;
  const info = (m.bracketInfo ?? '').toLowerCase();
  return info.includes('folga');
}

export function isPendingMatch(m: BracketMatchLike): boolean {
  if (!m.homeTeam || !m.awayTeam) {
    const info = m.bracketInfo ?? '';
    return info.toLowerCase().includes('vencedor confronto');
  }
  return false;
}

export function matchLabel(m: BracketMatchLike): string {
  if (m.bracketInfo?.includes('·')) {
    const part = m.bracketInfo.split('·').slice(1).join('·').trim();
    if (part) return part;
  }
  if (!m.homeTeam && !m.awayTeam && m.bracketInfo) {
    return m.bracketInfo.replace(/^Confronto \d+ ·\s*/i, '');
  }
  if (!m.homeTeam) return m.awayTeam ? `? × ${m.awayTeam}` : '—';
  if (!m.awayTeam) {
    if (isByeMatch(m)) return `${m.homeTeam} · Folga`;
    return `${m.homeTeam} × ?`;
  }
  return `${m.homeTeam} × ${m.awayTeam}`;
}

/** Legenda curta para listas (evita repetir o par em bracketInfo). */
export function bracketMatchCaption(m: BracketMatchLike): string | null {
  const confronto = parseConfrontoFromInfo(m.bracketInfo);
  if (m.homeTeam && m.awayTeam) {
    return confronto > 0 ? `Confronto ${confronto}` : null;
  }
  if (!m.homeTeam && !m.awayTeam && confronto > 0) {
    return `Confronto ${confronto}`;
  }
  return null;
}

export function suggestPhase(teamCount: number): BracketPhase {
  if (teamCount <= 2) return 'Final';
  if (teamCount <= 4) return 'Semifinal';
  if (teamCount <= 8) return 'Quartas';
  if (teamCount <= 16) return 'Oitavas';
  return 'Oitavas';
}

export function phaseHint(teamCount: number): string {
  return describeBracketPlan(teamCount);
}

export function roundSortKey(roundName: string): number {
  const base = roundName.replace(/\s*\(.*\)\s*$/, '').trim();
  const known = ROUND_BASE_ORDER[base];
  if (known !== undefined) return known;
  const jogo = /^Jogo (\d+)/i.exec(base);
  if (jogo) return 10 + parseInt(jogo[1], 10);
  return 50;
}

export function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const oa = roundSortKey(a);
    const ob = roundSortKey(b);
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b, 'pt-BR');
  });
}

export function groupByRound(
  matches: BracketMatchLike[],
): Map<string, BracketMatchLike[]> {
  const map = new Map<string, BracketMatchLike[]>();
  for (const m of matches) {
    if (!m.bracketRound) continue;
    const list = map.get(m.bracketRound) ?? [];
    list.push(m);
    map.set(m.bracketRound, list);
  }
  return map;
}

export function bracketOnlyMatches(matches: BracketMatchLike[]): BracketMatchLike[] {
  return matches.filter((m) => m.bracketRound);
}

export function parseConfrontoFromInfo(info: string | null): number {
  const m = /^Confronto (\d+)/i.exec(info ?? '');
  return m ? parseInt(m[1], 10) : 0;
}

export function getTeamDivisionKey(
  team: string,
  teamDivisions: Map<string, string>,
): string {
  return teamDivisions.get(team.trim().toLowerCase()) ?? 'first';
}

/** Atléticas que podem enfrentar `homeTeam` (mesma divisão). */
export function filterSameDivisionTeams(
  homeTeam: string,
  pool: string[],
  teamDivisions: Map<string, string>,
  options?: { excludeHome?: boolean },
): string[] {
  if (!homeTeam.trim()) return pool;
  const homeDiv = getTeamDivisionKey(homeTeam, teamDivisions);
  const excludeHome = options?.excludeHome !== false;
  return pool.filter((t) => {
    if (excludeHome && t === homeTeam) return false;
    return getTeamDivisionKey(t, teamDivisions) === homeDiv;
  });
}

/** Une pool com valores já selecionados (ex.: confronto em edição). */
export function mergeBracketTeamOptions(
  pool: string[],
  ...extra: (string | null | undefined)[]
): string[] {
  const set = new Set(pool);
  for (const t of extra) {
    if (t?.trim()) set.add(t.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
