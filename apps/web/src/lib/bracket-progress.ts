import {
  buildByeNote,
  DIVISION_LABELS,
  findNextRealTeamPlannedMatch,
  getFirstRoundByeTeams,
  isRealTeamDrawComplete,
  occupiedConfrontoSlots,
  planEliminationBracket,
  planWithDivisionSuffix,
  realTeamSlotsFromPlan,
  type BracketPlan,
} from '@chama/shared';
import {
  type BracketMatchLike,
  bracketOnlyMatches,
} from './bracket-utils';

export type DivisionDrawProgress = {
  division: string;
  divisionLabel: string;
  teamCount: number;
  /** Atléticas elegíveis nesta divisão (mesma lista usada no sorteio). */
  teams: string[];
  /** Folga na 1ª rodada do plano (número ímpar na divisão). */
  firstRoundByeTeams: string[];
  oitavasMatchCount: number;
  totalConfrontos: number;
  createdCount: number;
  nextConfronto: number | null;
  nextRound: string | null;
  nextIsPlaceholder: boolean;
  nextNeedsDraw: boolean;
  canReshuffle: boolean;
  isComplete: boolean;
  byeNote: string | null;
  /** Inconsistências entre chave sorteada e plano (ex.: folga dupla). */
  auditIssues: string[];
};

export type BracketDrawProgress = {
  divisions: DivisionDrawProgress[];
  totalPlanned: number;
  totalCreated: number;
  isComplete: boolean;
  hasStarted: boolean;
  activeDivisionLabel: string | null;
};

function matchesForDivision(
  matches: BracketMatchLike[],
  divisionLabel: string,
): BracketMatchLike[] {
  const suffix = `(${divisionLabel})`;
  return matches.filter((m) => m.bracketRound?.includes(suffix));
}

function buildClientDivisionPlans(
  eligibleTeams: string[],
  teamDivisions: Map<string, string>,
): { division: string; divisionLabel: string; teams: string[]; plan: BracketPlan }[] {
  const byDivision = new Map<string, string[]>();
  for (const team of eligibleTeams) {
    const division = teamDivisions.get(team.toLowerCase()) ?? 'first';
    const list = byDivision.get(division) ?? [];
    list.push(team);
    byDivision.set(division, list);
  }

  const order = ['first', 'second'];
  const result: {
    division: string;
    divisionLabel: string;
    teams: string[];
    plan: BracketPlan;
  }[] = [];

  const multi = byDivision.size > 1;

  for (const division of order) {
    const teams = byDivision.get(division);
    if (!teams || teams.length < 2) continue;
    const base = planEliminationBracket(teams);
    const divLabel = DIVISION_LABELS[division] ?? division;
    result.push({
      division,
      divisionLabel: divLabel,
      teams,
      plan: multi ? planWithDivisionSuffix(base, divLabel) : base,
    });
  }

  return result;
}

function roundBaseName(roundName: string): string {
  return roundName.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Compara confrontos já criados com o plano esperado. */
export function auditDivisionBracket(
  plan: BracketPlan,
  divisionLabel: string,
  divMatches: BracketMatchLike[],
): string[] {
  const issues: string[] = [];
  const firstRound = plan.rounds[0];
  if (!firstRound) return issues;

  const firstByes = getFirstRoundByeTeams(plan);
  const oitavasRoundName = firstRound.roundName;
  const quartasRound = plan.rounds[1];

  const oitavasMatches = divMatches.filter(
    (m) => m.bracketRound === oitavasRoundName,
  );
  const oitavasWithTeams = oitavasMatches.filter((m) => m.homeTeam && m.awayTeam);
  const playingOitavas = new Set<string>();
  for (const m of oitavasWithTeams) {
    if (m.homeTeam) playingOitavas.add(m.homeTeam);
    if (m.awayTeam) playingOitavas.add(m.awayTeam);
  }

  const expectedOitavasPlayers = firstRound.matches.length * 2;
  if (
    oitavasWithTeams.length > 0 &&
    playingOitavas.size !== expectedOitavasPlayers
  ) {
    issues.push(
      `Oitavas: ${playingOitavas.size} atlética(s) jogando, esperado ${expectedOitavasPlayers} (${firstByes.length} com folga nas oitavas).`,
    );
  }

  for (const bye of firstByes) {
    if (playingOitavas.has(bye)) {
      issues.push(
        `${bye} está marcada com folga no plano, mas aparece em confronto das oitavas.`,
      );
    }
    const inSemifinal = divMatches.some(
      (m) =>
        roundBaseName(m.bracketRound ?? '').startsWith('Semifinal') &&
        (m.homeTeam === bye || m.awayTeam === bye),
    );
    const plannedQuartas = quartasRound?.matches.some(
      (m) =>
        m.homeTeam === bye ||
        m.awayTeam === bye ||
        m.homeLabel.includes(bye) ||
        m.awayLabel.includes(bye),
    );
    if (inSemifinal && !plannedQuartas) {
      issues.push(
        `${bye} aparece na semifinal sem passar pelas quartas — chave pode ter sido montada com regra antiga. Refaça o sorteio desta divisão.`,
      );
    }
    if (inSemifinal && plannedQuartas) {
      const inQuartasDrawn = divMatches.some(
        (m) =>
          roundBaseName(m.bracketRound ?? '').startsWith('Quartas') &&
          (m.homeTeam === bye || m.awayTeam === bye),
      );
      if (!inQuartasDrawn && oitavasWithTeams.length >= firstRound.matches.length) {
        issues.push(
          `${bye} deveria jogar as quartas (folga nas oitavas), mas ainda não há confronto das quartas com ela.`,
        );
      }
    }
  }

  const realPairs = divMatches.filter((m) => m.homeTeam && m.awayTeam);
  const usage = new Map<string, number>();
  for (const m of realPairs) {
    if (m.homeTeam) usage.set(m.homeTeam, (usage.get(m.homeTeam) ?? 0) + 1);
    if (m.awayTeam) usage.set(m.awayTeam, (usage.get(m.awayTeam) ?? 0) + 1);
  }
  for (const [team, count] of usage) {
    if (count > 1) {
      issues.push(
        `${team} aparece em ${count} confrontos com times definidos na ${divisionLabel}.`,
      );
    }
  }

  return issues;
}

export function computeBracketDrawProgress(
  eligibleTeams: string[],
  teamDivisions: Map<string, string>,
  matches: BracketMatchLike[],
): BracketDrawProgress {
  const bracketMatches = bracketOnlyMatches(matches);
  const divisionPlans = buildClientDivisionPlans(eligibleTeams, teamDivisions);

  let activeDivisionLabel: string | null = null;

  const divisions = divisionPlans.map((dp) => {
    const divMatches = matchesForDivision(bracketMatches, dp.divisionLabel);
    const occupied = occupiedConfrontoSlots(divMatches, dp.plan);
    const next = findNextRealTeamPlannedMatch(dp.plan, occupied);
    const canReshuffle = divMatches.some((m) => m.homeTeam && m.awayTeam);

    if (!activeDivisionLabel && next) {
      activeDivisionLabel = dp.divisionLabel;
    }

    const oitavasRound = dp.plan.rounds.find((r) =>
      r.roundName.replace(/\s*\(.*\)$/, '').trim().startsWith('Oitavas'),
    );
    const realSlots = realTeamSlotsFromPlan(dp.plan);

    return {
      division: dp.division,
      divisionLabel: dp.divisionLabel,
      teamCount: dp.teams.length,
      teams: [...dp.teams].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      firstRoundByeTeams: getFirstRoundByeTeams(dp.plan),
      oitavasMatchCount: oitavasRound?.matches.length ?? 0,
      totalConfrontos: realSlots.length,
      createdCount: divMatches.filter((m) => m.homeTeam && m.awayTeam).length,
      nextConfronto: next?.confronto ?? null,
      nextRound: next?.roundName ?? null,
      nextIsPlaceholder: false,
      nextNeedsDraw: !!next,
      canReshuffle,
      isComplete: isRealTeamDrawComplete(dp.plan, occupied),
      byeNote: buildByeNote(dp.plan),
      auditIssues: auditDivisionBracket(
        dp.plan,
        dp.divisionLabel,
        divMatches,
      ),
    };
  });

  const totalPlanned = divisionPlans.reduce(
    (s, dp) => s + realTeamSlotsFromPlan(dp.plan).length,
    0,
  );

  return {
    divisions,
    totalPlanned,
    totalCreated: bracketMatches.length,
    isComplete:
      divisionPlans.length > 0 && divisions.every((d) => d.isComplete),
    hasStarted: bracketMatches.length > 0,
    activeDivisionLabel,
  };
}
