import { PrismaService } from '../prisma/prisma.service';

export const BRACKET_EXCLUSIONS_CONFIG_KEY = 'bracket_exclusions';

export type BracketExclusionsMap = Record<string, string[]>;

export async function getBracketExclusions(
  prisma: PrismaService,
  modalidadeId: string,
): Promise<string[]> {
  const row = await prisma.appConfig.findUnique({
    where: { key: BRACKET_EXCLUSIONS_CONFIG_KEY },
  });
  if (!row?.value) return [];
  try {
    const map = JSON.parse(row.value) as BracketExclusionsMap;
    return Array.isArray(map[modalidadeId]) ? map[modalidadeId] : [];
  } catch {
    return [];
  }
}

export async function setBracketExclusions(
  prisma: PrismaService,
  modalidadeId: string,
  excludedTeams: string[],
): Promise<string[]> {
  const row = await prisma.appConfig.findUnique({
    where: { key: BRACKET_EXCLUSIONS_CONFIG_KEY },
  });
  let map: BracketExclusionsMap = {};
  if (row?.value) {
    try {
      map = JSON.parse(row.value) as BracketExclusionsMap;
    } catch {
      map = {};
    }
  }
  map[modalidadeId] = excludedTeams;
  await prisma.appConfig.upsert({
    where: { key: BRACKET_EXCLUSIONS_CONFIG_KEY },
    create: { key: BRACKET_EXCLUSIONS_CONFIG_KEY, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });
  return excludedTeams;
}
