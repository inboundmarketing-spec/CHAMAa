export enum ScoringMode {
  VERSUS = 'versus',
  PLACEMENT = 'placement',
}

export function isPlacementModalidade(slug: string, scoringMode?: string): boolean {
  if (scoringMode === ScoringMode.PLACEMENT) return true;
  return slug.startsWith('atletismo-') || slug.startsWith('natacao-');
}

/** Modalidades com mata-mata (exclui natação e atletismo — provas simultâneas). */
export function usesEliminationBracket(
  slug: string,
  scoringMode?: string,
): boolean {
  return !isPlacementModalidade(slug, scoringMode);
}

export function placementLabel(place: number): string {
  if (place === 1) return '1º';
  if (place === 2) return '2º';
  if (place === 3) return '3º';
  return `${place}º`;
}
