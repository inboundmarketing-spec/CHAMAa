export enum ChallengeType {
  BATTERY = 'battery',
  CHEER = 'cheer',
}

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  [ChallengeType.BATTERY]: 'Desafio de Baterias',
  [ChallengeType.CHEER]: 'Desafio de Cheer',
};

export const CHALLENGE_TYPES = [
  ChallengeType.BATTERY,
  ChallengeType.CHEER,
] as const;

export function challengeTypeLabel(type: string): string {
  return (
    CHALLENGE_TYPE_LABELS[type as ChallengeType] ??
    type
  );
}
