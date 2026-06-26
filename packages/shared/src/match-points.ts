export enum MatchDisciplineType {
  YELLOW = 'yellow',
  RED = 'red',
  WO = 'wo',
  FICHA = 'ficha',
}

/** Valores provisórios até regulamento oficial. */
export const MATCH_POINTS_DEFAULTS = {
  winBase: 10,
  drawSplit: 5,
  yellow: -2,
  red: -5,
  wo: -10,
  ficha: 0,
} as const;

export const MATCH_DISCIPLINE_LABELS: Record<MatchDisciplineType, string> = {
  [MatchDisciplineType.YELLOW]: 'Cartão amarelo',
  [MatchDisciplineType.RED]: 'Cartão vermelho',
  [MatchDisciplineType.WO]: 'W.O.',
  [MatchDisciplineType.FICHA]: 'Ficha de intercorrência',
};

export function defaultPointsDeltaForDiscipline(
  type: MatchDisciplineType,
): number {
  switch (type) {
    case MatchDisciplineType.YELLOW:
      return MATCH_POINTS_DEFAULTS.yellow;
    case MatchDisciplineType.RED:
      return MATCH_POINTS_DEFAULTS.red;
    case MatchDisciplineType.WO:
      return MATCH_POINTS_DEFAULTS.wo;
    case MatchDisciplineType.FICHA:
      return MATCH_POINTS_DEFAULTS.ficha;
    default:
      return 0;
  }
}
