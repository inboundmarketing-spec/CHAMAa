/** Catálogo oficial de modalidades do Inter (masculino e feminino). */
export const SPORTS_CATALOG = [
  { name: 'Basquete', slugBase: 'basquete', category: 'collective' as const },
  {
    name: 'Futebol de Campo',
    slugBase: 'futebol-campo',
    category: 'collective' as const,
  },
  {
    name: 'Futebol Society',
    slugBase: 'futebol-society',
    category: 'collective' as const,
  },
  { name: 'Futsal', slugBase: 'futsal', category: 'collective' as const },
  { name: 'Handebol', slugBase: 'handebol', category: 'collective' as const },
  { name: 'Vôlei', slugBase: 'volei', category: 'collective' as const },
  {
    name: 'Vôlei de Praia',
    slugBase: 'volei-praia',
    category: 'collective' as const,
  },
  { name: 'Atletismo', slugBase: 'atletismo', category: 'individual' as const },
  { name: 'Judô', slugBase: 'judo', category: 'individual' as const },
  { name: 'Natação', slugBase: 'natacao', category: 'individual' as const },
  {
    name: 'Tênis de Mesa',
    slugBase: 'tenis-mesa',
    category: 'individual' as const,
  },
  {
    name: 'Tênis de Campo',
    slugBase: 'tenis-campo',
    category: 'individual' as const,
  },
  { name: 'Xadrez', slugBase: 'xadrez', category: 'individual' as const },
] as const;

export const GENDERS = [
  { key: 'male' as const, label: 'Masculino', suffix: 'masculino' },
  { key: 'female' as const, label: 'Feminino', suffix: 'feminino' },
] as const;
