import type { BracketPlan, BracketPlannedMatch } from './bracket-plan';

export function parseConfrontoNum(bracketInfo: string | null | undefined): number {
  const m = /^Confronto (\d+)/i.exec(bracketInfo ?? '');
  return m ? parseInt(m[1], 10) : 0;
}

export function flattenBracketPlan(plan: BracketPlan): BracketPlannedMatch[] {
  return plan.rounds.flatMap((r) => r.matches);
}

export function plannedMatchKey(m: BracketPlannedMatch): string {
  return `c${m.confronto}`;
}

export function isRealTeamMatch(m: BracketPlannedMatch): boolean {
  return m.homeTeam != null && m.awayTeam != null;
}

/** Times já usados em confrontos com duas atléticas definidas (rodada inicial). */
export function teamsUsedInRealMatches(
  matches: { homeTeam: string | null; awayTeam: string | null }[],
): Set<string> {
  const used = new Set<string>();
  for (const m of matches) {
    if (m.homeTeam && m.awayTeam) {
      used.add(m.homeTeam);
      used.add(m.awayTeam);
    }
  }
  return used;
}

export function findNextPlannedMatch(
  plan: BracketPlan,
  existingConfrontos: Set<number>,
): BracketPlannedMatch | null {
  for (const m of flattenBracketPlan(plan)) {
    if (!existingConfrontos.has(m.confronto)) return m;
  }
  return null;
}

/** Próximo confronto com duas atléticas a sortear (ignora placeholders de vencedor). */
export function findNextRealTeamPlannedMatch(
  plan: BracketPlan,
  existingConfrontos: Set<number>,
): BracketPlannedMatch | null {
  for (const m of flattenBracketPlan(plan)) {
    if (!existingConfrontos.has(m.confronto) && isRealTeamMatch(m)) return m;
  }
  return null;
}

export function isRealTeamDrawComplete(
  plan: BracketPlan,
  existingConfrontos: Set<number>,
): boolean {
  return findNextRealTeamPlannedMatch(plan, existingConfrontos) === null;
}

/** Confrontos de rodadas iniciais (duas atléticas) no plano. */
export function realTeamSlotsFromPlan(plan: BracketPlan): BracketPlannedMatch[] {
  return flattenBracketPlan(plan).filter(isRealTeamMatch);
}

/**
 * Confrontos já ocupados: numerados em bracketInfo + manuais sem número
 * (cada manual sem número consome o próximo slot de atléticas do plano).
 */
export function occupiedConfrontoSlots(
  matches: { homeTeam: string | null; awayTeam: string | null; bracketInfo: string | null }[],
  plan: BracketPlan,
): Set<number> {
  const occupied = new Set<number>();
  for (const m of matches) {
    const n = parseConfrontoNum(m.bracketInfo);
    if (n > 0) occupied.add(n);
  }

  const unnumbered = matches.filter(
    (m) => m.homeTeam && m.awayTeam && parseConfrontoNum(m.bracketInfo) === 0,
  );
  if (!unnumbered.length) return occupied;

  for (const slot of realTeamSlotsFromPlan(plan)) {
    if (unnumbered.length === 0) break;
    if (occupied.has(slot.confronto)) continue;
    occupied.add(slot.confronto);
    unnumbered.shift();
  }

  return occupied;
}

export function buildNumberedBracketInfo(
  confronto: number,
  homeTeam: string,
  awayTeam: string,
): string {
  return `Confronto ${confronto} · ${homeTeam} × ${awayTeam}`;
}

export function pickRandomPair(pool: string[]): [string, string] | null {
  if (pool.length < 2) return null;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export function divisionFromRoundName(roundName: string): string | null {
  const m = /\(([^)]+)\)\s*$/.exec(roundName);
  return m ? m[1].trim() : null;
}
