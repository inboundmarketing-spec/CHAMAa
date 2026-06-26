/** Períodos de jogo (regulamento a definir pela comissão). */
export const GAME_PERIODS = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  'interval',
  'extra_1',
  'extra_2',
] as const;

export type GamePeriod = (typeof GAME_PERIODS)[number];

const GAME_PERIOD_LABELS: Record<GamePeriod, string> = {
  '1st': '1º tempo',
  '2nd': '2º tempo',
  '3rd': '3º tempo',
  '4th': '4º tempo',
  interval: 'Intervalo',
  extra_1: 'Prorrogação 1',
  extra_2: 'Prorrogação 2',
};

export function gamePeriodLabel(period: string | null | undefined): string | null {
  if (!period) return null;
  return GAME_PERIOD_LABELS[period as GamePeriod] ?? period;
}

export function formatElapsedSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function elapsedSecondsSince(
  startedAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!startedAt) return null;
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(0, Math.floor((nowMs - start.getTime()) / 1000));
}
