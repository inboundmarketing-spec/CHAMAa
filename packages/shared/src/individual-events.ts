/** Provas oficiais do Inter — Atletismo (Art. 70º). */
export const ATLETISMO_PROVAS = [
  '3000 metros rasos',
  '200 metros rasos',
  '1500 metros rasos',
  '100 metros rasos',
  '400 metros rasos',
  'Revezamento 4x100 metros rasos',
  'Salto em altura',
  'Salto em distância',
  'Arremesso de peso',
] as const;

/** Provas oficiais do Inter — Natação (Art. 155º). */
export const NATACAO_PROVAS = [
  '100 metros medley',
  '50 metros livres',
  '50 metros costas',
  '50 metros peito',
  '100 metros livres',
  'Revezamento 4X50 metros livres',
  '50 metros borboleta',
  '200 metros livres',
  'Revezamento 4X50 metros medley',
] as const;

export type AtletismoProva = (typeof ATLETISMO_PROVAS)[number];
export type NatacaoProva = (typeof NATACAO_PROVAS)[number];

export function provasForSportSlug(slug: string): readonly string[] | null {
  if (slug.startsWith('atletismo-')) return ATLETISMO_PROVAS;
  if (slug.startsWith('natacao-')) return NATACAO_PROVAS;
  return null;
}
