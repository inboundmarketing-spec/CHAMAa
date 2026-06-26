export const CATEGORY_LABELS: Record<string, string> = {
  collective: 'Esportes coletivos',
  individual: 'Esportes individuais / combate',
};

export const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
};

/** Nome do esporte sem o sufixo de divisão (ex.: "Basquete — Masculino" → "Basquete"). */
export function modalidadeSportName(name: string, gender?: string): string {
  if (!gender) return name;
  const label = GENDER_LABELS[gender];
  if (!label) return name;
  for (const sep of [' — ', ' - ']) {
    const suffix = `${sep}${label}`;
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length);
  }
  return name;
}

export function formatModalidadeOption(name: string, gender: string): string {
  const sport = modalidadeSportName(name, gender);
  const division = GENDER_LABELS[gender] ?? gender;
  return `${sport} · ${division}`;
}

type ModalidadeLike = {
  id: string;
  name: string;
  slug: string;
  category: string;
  gender: string;
};

function isCanonicalModalidadeSlug(slug: string): boolean {
  return slug.endsWith('-masculino') || slug.endsWith('-feminino');
}

/** Evita duplicatas legadas (ex.: slug "futsal" e "futsal-masculino"). */
export function dedupeModalidades<T extends ModalidadeLike>(list: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const item of list) {
    const key = `${item.name}|${item.category}|${item.gender}`;
    const existing = byKey.get(key);
    if (
      !existing ||
      (isCanonicalModalidadeSlug(item.slug) &&
        !isCanonicalModalidadeSlug(existing.slug))
    ) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  live: 'Ao vivo',
  finished: 'Finalizado',
  delayed: 'Adiado',
  cancelled: 'Cancelado',
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  injury: 'Lesão / acidente',
  equipment: 'Equipamento / estrutura',
  weather: 'Clima',
  dispute: 'Disciplina / conflito',
  security: 'Segurança',
  other: 'Outro',
};
