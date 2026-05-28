import {
  buildByeNote,
  buildNumberedBracketInfo,
  DIVISION_LABELS,
  findNextPlannedMatch,
  flattenBracketPlan,
  isRealTeamMatch,
  occupiedConfrontoSlots,
  parseConfrontoNum,
  pickRandomPair,
  planEliminationBracket,
  planWithDivisionSuffix,
  realTeamSlotsFromPlan,
  teamsUsedInRealMatches,
  type BracketPlan,
  type BracketPlannedMatch,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';
import { DivisionService } from './division.service';

export type DivisionBracketPlan = {
  division: string;
  divisionLabel: string;
  teams: string[];
  plan: BracketPlan;
};

export type BracketMatchRow = {
  id: string;
  homeTeam: string | null;
  awayTeam: string | null;
  bracketRound: string | null;
  bracketInfo: string | null;
};

export async function buildDivisionPlans(
  eligibleTeams: string[],
  divisions: DivisionService,
): Promise<DivisionBracketPlan[]> {
  const byDivision = new Map<string, string[]>();
  for (const team of eligibleTeams) {
    const division = await divisions.getTeamDivision(team);
    const list = byDivision.get(division) ?? [];
    list.push(team);
    byDivision.set(division, list);
  }

  const order = ['first', 'second'];
  const result: DivisionBracketPlan[] = [];

  for (const division of order) {
    const teams = byDivision.get(division);
    if (!teams || teams.length < 2) continue;
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const base = planEliminationBracket(shuffled);
    const divLabel = DIVISION_LABELS[division] ?? division;
    const plan =
      byDivision.size > 1
        ? planWithDivisionSuffix(base, divLabel)
        : base;
    result.push({
      division,
      divisionLabel: divLabel,
      teams: shuffled,
      plan,
    });
  }

  for (const [division, teams] of byDivision) {
    if (order.includes(division)) continue;
    if (teams.length < 2) continue;
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const base = planEliminationBracket(shuffled);
    const divLabel = DIVISION_LABELS[division] ?? division;
    result.push({
      division,
      divisionLabel: divLabel,
      teams: shuffled,
      plan: planWithDivisionSuffix(base, divLabel),
    });
  }

  return result;
}

export function matchesForDivision(
  all: BracketMatchRow[],
  divisionLabel: string,
): BracketMatchRow[] {
  const suffix = `(${divisionLabel})`;
  return all.filter((m) => m.bracketRound?.includes(suffix));
}

export function existingConfrontos(matches: BracketMatchRow[]): Set<number> {
  return new Set(
    matches
      .map((m) => parseConfrontoNum(m.bracketInfo))
      .filter((n) => n > 0),
  );
}

/** Atribui número de confronto a partidas manuais sem bracketInfo numerado. */
export async function backfillUnnumberedMatches(
  prisma: PrismaService,
  plan: BracketPlan,
  divMatches: BracketMatchRow[],
): Promise<BracketMatchRow[]> {
  const unnumbered = divMatches
    .filter(
      (m) =>
        m.homeTeam &&
        m.awayTeam &&
        parseConfrontoNum(m.bracketInfo) === 0,
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  if (!unnumbered.length) return divMatches;

  const occupied = existingConfrontos(divMatches);
  const slots = realTeamSlotsFromPlan(plan);
  const byId = new Map(divMatches.map((m) => [m.id, { ...m }]));

  for (const manual of unnumbered) {
    const slot = slots.find(
      (s) => !occupied.has(s.confronto),
    );
    if (!slot) break;

    occupied.add(slot.confronto);
    const bracketInfo = buildNumberedBracketInfo(
      slot.confronto,
      manual.homeTeam!,
      manual.awayTeam!,
    );

    await prisma.match.update({
      where: { id: manual.id },
      data: {
        bracketRound: slot.roundName,
        bracketInfo,
      },
    });

    byId.set(manual.id, {
      ...manual,
      bracketRound: slot.roundName,
      bracketInfo,
    });
  }

  return divMatches.map((m) => byId.get(m.id) ?? m);
}

export function nextRealTeamSlot(
  plan: BracketPlan,
  divMatches: BracketMatchRow[],
): BracketPlannedMatch | null {
  const occupied = occupiedConfrontoSlots(divMatches, plan);
  const flat = flattenBracketPlan(plan);
  return flat.find((m) => isRealTeamMatch(m) && !occupied.has(m.confronto)) ?? null;
}

export function findActiveDivisionPlan(
  divisionPlans: DivisionBracketPlan[],
  allMatches: BracketMatchRow[],
): DivisionBracketPlan | null {
  for (const dp of divisionPlans) {
    const divMatches = matchesForDivision(allMatches, dp.divisionLabel);
    const occupied = occupiedConfrontoSlots(divMatches, dp.plan);
    const next = findNextPlannedMatch(dp.plan, occupied);
    if (next) return dp;
  }
  return null;
}

export function resolveTeamsForPlannedMatch(
  planned: BracketPlannedMatch,
  divisionTeams: string[],
  divMatches: BracketMatchRow[],
): { homeTeam: string | null; awayTeam: string | null } {
  if (!isRealTeamMatch(planned)) {
    return { homeTeam: planned.homeTeam, awayTeam: planned.awayTeam };
  }

  const used = teamsUsedInRealMatches(divMatches);
  const pool = divisionTeams.filter((t) => !used.has(t));
  const pair = pickRandomPair(pool);
  if (!pair) {
    throw new Error('Não há atléticas suficientes para o confronto');
  }
  return { homeTeam: pair[0], awayTeam: pair[1] };
}

export function findLastRealTeamMatch(
  divMatches: BracketMatchRow[],
): BracketMatchRow | null {
  const real = divMatches.filter((m) => m.homeTeam && m.awayTeam);
  if (!real.length) return null;
  return real.sort(
    (a, b) =>
      parseConfrontoNum(b.bracketInfo) - parseConfrontoNum(a.bracketInfo),
  )[0];
}

export function getBracketDrawProgress(
  divisionPlans: DivisionBracketPlan[],
  allMatches: BracketMatchRow[],
) {
  const divisions = divisionPlans.map((dp) => {
    const divMatches = matchesForDivision(allMatches, dp.divisionLabel);
    const occupied = occupiedConfrontoSlots(divMatches, dp.plan);
    const flat = flattenBracketPlan(dp.plan);
    const next = findNextPlannedMatch(dp.plan, occupied);
    const lastReal = findLastRealTeamMatch(divMatches);
    const realCount = divMatches.filter((m) => m.homeTeam && m.awayTeam).length;
    const oitavasRound = dp.plan.rounds.find((r) =>
      r.roundName.replace(/\s*\(.*\)$/, '').trim().startsWith('Oitavas'),
    );

    return {
      division: dp.division,
      divisionLabel: dp.divisionLabel,
      teamCount: dp.teams.length,
      totalConfrontos: flat.length,
      createdCount: occupied.size,
      realPairingsCount: realCount,
      nextConfronto: next?.confronto ?? null,
      nextRound: next?.roundName ?? null,
      nextIsPlaceholder: next ? !isRealTeamMatch(next) : false,
      nextNeedsDraw: next ? isRealTeamMatch(next) : false,
      canReshuffle: !!lastReal,
      isComplete: !next,
      oitavasMatchCount: oitavasRound?.matches.length ?? 0,
      byeNote: buildByeNote(dp.plan),
    };
  });

  const totalPlanned = divisionPlans.reduce(
    (s, dp) => s + flattenBracketPlan(dp.plan).length,
    0,
  );
  const totalCreated = allMatches.length;

  return {
    divisions,
    totalPlanned,
    totalCreated,
    isComplete:
      divisionPlans.length > 0 &&
      divisions.every((d) => d.isComplete),
    hasStarted: totalCreated > 0,
  };
}
