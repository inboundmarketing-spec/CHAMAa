import {
  isPlacementModalidade,
  placementLabel,
  provasForSportSlug,
} from '@chama/shared';

export type MatchParticipant = {
  id?: string;
  team: string;
  placement: number | null;
  sortOrder: number;
};

export type ModalidadeWithSlug = {
  slug: string;
  scoringMode?: string;
};

export function isPlacementMatch(
  modalidade: ModalidadeWithSlug | undefined,
): boolean {
  if (!modalidade) return false;
  return isPlacementModalidade(modalidade.slug, modalidade.scoringMode);
}

export function provasForModalidade(slug: string): readonly string[] | null {
  return provasForSportSlug(slug);
}

export function formatPlacementScore(
  participants: MatchParticipant[] | undefined,
): string {
  const ranked = [...(participants ?? [])]
    .filter((p) => p.placement != null && p.placement > 0)
    .sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));
  if (ranked.length === 0) return '—';
  return ranked
    .map((p) => `${placementLabel(p.placement!)} ${p.team}`)
    .join(' · ');
}

export { placementLabel, provasForSportSlug };
