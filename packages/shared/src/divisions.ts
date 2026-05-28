/** Campi na 1ª divisão (classificação geral do Inter). */
export const DIVISION_ONE_CAMPUSES = [
  'Bauru',
  'Presidente Prudente',
  'Rio Claro',
  'São Vicente',
  'Botucatu',
  'Guaratinguetá',
  'Ilha Solteira',
  'Jaboticabal',
  'Araçatuba',
  'Araraquara',
  'São José do Rio Preto',
  'São José dos Campos',
  'São João da Boa Vista',
  'Tupã',
] as const;

export enum AtleticaDivisionTier {
  FIRST = 'first',
  SECOND = 'second',
}

export enum AtleticaDivisionSource {
  SEED = 'seed',
  MANUAL = 'manual',
  PROMOTION = 'promotion',
}

export function isDivisionOneCampus(campusName: string): boolean {
  const normalized = campusName.trim().toLowerCase();
  return DIVISION_ONE_CAMPUSES.some(
    (c) => c.toLowerCase() === normalized,
  );
}

export function divisionTierLabel(tier: string): string {
  return tier === AtleticaDivisionTier.FIRST ? '1ª divisão' : '2ª divisão';
}
