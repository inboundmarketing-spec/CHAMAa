import {
  elapsedSecondsSince,
  formatElapsedSeconds,
  gamePeriodLabel,
  isPlacementModalidade,
  parseConfrontoNum,
  placementLabel,
} from '@chama/shared';

export type MatchParticipantRow = {
  team: string;
  placement: number | null;
  sortOrder: number;
};

export type MatchDisplayInput = {
  homeTeam?: string | null;
  awayTeam?: string | null;
  bracketInfo?: string | null;
  homeScore: number;
  awayScore: number;
  division?: string | null;
  liveStartedAt?: Date | string | null;
  gamePeriod?: string | null;
  status?: string;
  modalidade: { slug: string; scoringMode?: string };
  participants?: MatchParticipantRow[];
};

export function isPlacementMatch(match: MatchDisplayInput): boolean {
  return isPlacementModalidade(
    match.modalidade.slug,
    match.modalidade.scoringMode,
  );
}

export function sortedParticipants(
  participants: MatchParticipantRow[] | undefined,
): MatchParticipantRow[] {
  if (!participants?.length) return [];
  return [...participants].sort((a, b) => {
    const pa = a.placement ?? 999;
    const pb = b.placement ?? 999;
    if (pa !== pb) return pa - pb;
    return a.sortOrder - b.sortOrder;
  });
}

/** Rótulo curto da partida (times ou lista de atléticas). */
export function formatMatchTeamsLabel(match: MatchDisplayInput): string {
  const parts = sortedParticipants(match.participants);
  if (parts.length > 0) {
    return parts.map((p) => p.team).join(', ');
  }
  if (match.homeTeam && match.awayTeam) {
    return `${match.homeTeam} x ${match.awayTeam}`;
  }
  if (match.homeTeam) return `${match.homeTeam} x Folga`;
  if (match.bracketInfo?.includes('·')) {
    return match.bracketInfo.split('·').slice(1).join('·').trim();
  }
  return '—';
}

/** Uma linha para chave no WhatsApp (sem repetir times no bracketInfo). */
export function formatBracketMatchBotLine(match: MatchDisplayInput): string {
  const teams = formatMatchTeamsLabel(match);
  const info = match.bracketInfo?.trim() ?? '';
  const confronto = parseConfrontoNum(info);

  if (match.homeTeam && match.awayTeam) {
    return confronto > 0 ? `${teams} _(Confronto ${confronto})_` : teams;
  }

  if (confronto > 0 && info.includes('·')) {
    const pairing = info.split('·').slice(1).join('·').trim();
    return `Confronto ${confronto} · ${pairing}`;
  }

  return info || teams;
}

/** Placar ou colocações para exibição. */
export function formatMatchScoreLabel(match: MatchDisplayInput): string {
  if (!isPlacementMatch(match)) {
    return `${match.homeScore} x ${match.awayScore}`;
  }

  const ranked = sortedParticipants(match.participants).filter(
    (p) => p.placement != null && p.placement > 0,
  );
  if (ranked.length === 0) return 'Colocações pendentes';

  return ranked
    .map((p) => `${placementLabel(p.placement!)} ${p.team}`)
    .join(' · ');
}

export function formatMatchHeadline(match: MatchDisplayInput): string {
  const prova = match.division ? ` — ${match.division}` : '';
  return `${formatMatchTeamsLabel(match)}${prova}`;
}

/** Cronômetro e período para partidas ao vivo. */
export function formatLiveMatchClock(match: MatchDisplayInput): string | null {
  if (match.status && match.status !== 'live') return null;

  const parts: string[] = [];
  const elapsed = elapsedSecondsSince(match.liveStartedAt);
  if (elapsed != null) {
    parts.push(`⏱ ${formatElapsedSeconds(elapsed)}`);
  }

  const period = gamePeriodLabel(match.gamePeriod);
  if (period) parts.push(period);

  return parts.length > 0 ? parts.join(' · ') : null;
}
