/**
 * Monta chave mata-mata em rodadas encadeadas (como no fluxo manual do evento):
 * em cada rodada emparelha-se quem está na fila; com número ímpar, o último
 * aguarda (folga) e entra na rodada seguinte; confrontos futuros usam
 * "Vencedor confronto N" até os times serem definidos.
 */

export type BracketPlannedMatch = {
  confronto: number;
  roundOrder: number;
  roundName: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeLabel: string;
  awayLabel: string;
  bracketInfo: string;
  isByeAdvance?: boolean;
};

export type BracketPlannedRound = {
  roundOrder: number;
  roundName: string;
  matches: BracketPlannedMatch[];
  /** Times que pulam a rodada (fila ímpar na 1ª fase ou folga explícita). */
  byeTeams: string[];
  /** Vencedores de confronto que aguardam sem jogar nesta rodada. */
  byeWaitingConfrontos: number[];
};

export type BracketPlan = {
  rounds: BracketPlannedRound[];
  totalConfrontos: number;
};

type Entrant =
  | { type: 'team'; name: string }
  | { type: 'winner'; confronto: number };

function countEliminationRounds(teamCount: number): number {
  let remaining = teamCount;
  let rounds = 0;
  while (remaining > 1) {
    rounds += 1;
    const paired = Math.floor(remaining / 2);
    const byes = remaining % 2;
    remaining = paired + byes;
  }
  return rounds;
}

/** Nome da rodada conforme profundidade até a final. */
export function bracketRoundLabel(
  roundOrder: number,
  totalRounds: number,
): string {
  const fromFinal = totalRounds - roundOrder;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinal';
  if (fromFinal === 2) return 'Quartas';
  if (fromFinal === 3) return 'Oitavas';
  return `Jogo ${roundOrder}`;
}

function slotLabel(entrant: Entrant): string {
  if (entrant.type === 'team') return entrant.name;
  return `Vencedor confronto ${entrant.confronto}`;
}

function buildMatchInfo(
  homeLabel: string,
  awayLabel: string,
  confronto: number,
): string {
  return `Confronto ${confronto} · ${homeLabel} × ${awayLabel}`;
}

/**
 * Gera o plano completo da chave para N times (ordem já embaralhada).
 */
export function planEliminationBracket(teams: string[]): BracketPlan {
  if (teams.length < 2) {
    return { rounds: [], totalConfrontos: 0 };
  }

  const totalRounds = countEliminationRounds(teams.length);
  let queue: Entrant[] = teams.map((name) => ({ type: 'team', name }));
  const rounds: BracketPlannedRound[] = [];
  let confronto = 0;
  let roundOrder = 0;

  while (queue.length > 1) {
    roundOrder += 1;
    const roundName = bracketRoundLabel(roundOrder, totalRounds);
    const matches: BracketPlannedMatch[] = [];
    const byeTeams: string[] = [];
    const byeWaitingConfrontos: number[] = [];
    const next: Entrant[] = [];

    for (let i = 0; i < queue.length; i += 2) {
      if (i + 1 < queue.length) {
        confronto += 1;
        const a = queue[i];
        const b = queue[i + 1];
        const homeLabel = slotLabel(a);
        const awayLabel = slotLabel(b);
        const homeTeam = a.type === 'team' ? a.name : null;
        const awayTeam = b.type === 'team' ? b.name : null;

        matches.push({
          confronto,
          roundOrder,
          roundName,
          homeTeam,
          awayTeam,
          homeLabel,
          awayLabel,
          bracketInfo: buildMatchInfo(homeLabel, awayLabel, confronto),
        });
        next.push({ type: 'winner', confronto });
      } else {
        const entrant = queue[i];
        if (entrant.type === 'team') {
          byeTeams.push(entrant.name);
          // Entra no início da próxima rodada para jogar (não ficar sozinho de novo no fim).
          next.unshift(entrant);
        } else if (entrant.type === 'winner') {
          byeWaitingConfrontos.push(entrant.confronto);
          next.push(entrant);
        }
      }
    }

    rounds.push({
      roundOrder,
      roundName,
      matches,
      byeTeams,
      byeWaitingConfrontos,
    });
    queue = next;
  }

  return { rounds, totalConfrontos: confronto };
}

/** Resumo legível para a UI (ex.: 5 times → 2 jogos + 1 folga, depois semi e final). */
export function describeBracketPlan(teamCount: number): string {
  if (teamCount < 2) {
    return 'É preciso pelo menos 2 atléticas para montar a chave.';
  }
  const fake = planEliminationBracket(
    Array.from({ length: teamCount }, (_, i) => `T${i + 1}`),
  );
  const parts = fake.rounds.map((r) => {
    const jogos = r.matches.length;
    const folgas = r.byeTeams.length;
    let s = `${r.roundName}: ${jogos} jogo${jogos === 1 ? '' : 's'}`;
    if (folgas > 0) {
      s += ` + ${folgas} folga${folgas === 1 ? '' : 's'}`;
    }
    return s;
  });
  return `${teamCount} times → ${parts.join(' → ')}.`;
}

function roundLabelShort(roundName: string): string {
  return roundName.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Texto explicativo das folgas conforme o plano (rodada correta, não fixo em oitavas). */
export function buildByeNote(plan: BracketPlan): string | null {
  const parts: string[] = [];

  for (let i = 0; i < plan.rounds.length; i++) {
    const round = plan.rounds[i];
    const thisRound = roundLabelShort(round.roundName);
    const next = plan.rounds[i + 1];
    const nextRound = next ? roundLabelShort(next.roundName) : null;

    if (round.byeTeams.length) {
      const names =
        round.byeTeams.length <= 2
          ? round.byeTeams.join(' e ')
          : `${round.byeTeams.slice(0, -1).join(', ')} e ${round.byeTeams[round.byeTeams.length - 1]}`;

      if (nextRound) {
        const verb = round.byeTeams.length === 1 ? 'pula' : 'pulam';
        const entra = round.byeTeams.length === 1 ? 'entra' : 'entram';
        parts.push(
          `Na ${thisRound}, ${names} ${verb} os confrontos e ${entra} direto na ${nextRound}.`,
        );
      } else {
        const tem = round.byeTeams.length === 1 ? 'tem' : 'têm';
        parts.push(`Na ${thisRound}, ${names} ${tem} folga.`);
      }
    }

    for (const confronto of round.byeWaitingConfrontos) {
      if (nextRound) {
        parts.push(
          `Na ${thisRound}, o vencedor do confronto ${confronto} aguarda sem jogar e entra direto na ${nextRound}.`,
        );
      } else {
        parts.push(
          `Na ${thisRound}, o vencedor do confronto ${confronto} aguarda sem jogar.`,
        );
      }
    }
  }

  return parts.length ? parts.join(' ') : null;
}

/** Times com folga na primeira rodada do plano (ex.: 13ª atlética em chave de 13). */
export function getFirstRoundByeTeams(plan: BracketPlan): string[] {
  return plan.rounds[0]?.byeTeams ?? [];
}

export function planWithDivisionSuffix(
  plan: BracketPlan,
  divisionLabel: string,
): BracketPlan {
  const suffix = ` (${divisionLabel})`;
  return {
    totalConfrontos: plan.totalConfrontos,
    rounds: plan.rounds.map((r) => ({
      ...r,
      roundName: `${r.roundName}${suffix}`,
      matches: r.matches.map((m) => ({
        ...m,
        roundName: `${m.roundName}${suffix}`,
      })),
    })),
  };
}

export const DIVISION_LABELS: Record<string, string> = {
  first: '1ª divisão',
  second: '2ª divisão',
};
