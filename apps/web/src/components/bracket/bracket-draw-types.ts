export type BracketDrawContext = {
  sportLabel: string;
  genderLabel: string;
  divisionLabel: string;
  teamCount: number;
  /** True quando a 1ª divisão já foi sorteada e agora é a 2ª */
  isNextDivision: boolean;
};

export type BracketDrawOutcome = BracketDrawContext & {
  confronto: number;
  home: string;
  away: string | null;
  published?: boolean;
  autoNote?: string;
  /** Rodadas só com vencedor confronto N (sem atléticas sorteadas). */
  isPlaceholderBatch?: boolean;
  isBye: boolean;
};

export type BracketDrawOverlayPhase =
  | 'idle'
  | 'announce'
  | 'spinning'
  | 'result';
