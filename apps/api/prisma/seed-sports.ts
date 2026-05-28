import { PrismaClient } from '@prisma/client';
import { ScoringMode } from '@chama/shared';
import { GENDERS, SPORTS_CATALOG } from './sports-catalog';

const CANONICAL_SLUG_SUFFIXES = ['-masculino', '-feminino'] as const;

function isCanonicalSlug(slug: string): boolean {
  return CANONICAL_SLUG_SUFFIXES.some((suffix) => slug.endsWith(suffix));
}

/** Remove modalidades legadas (ex.: slug "futsal" sem sufixo de divisão). */
async function cleanupLegacyModalidades(prisma: PrismaClient) {
  const legacy = await prisma.modalidade.findMany({
    where: {
      NOT: {
        OR: CANONICAL_SLUG_SUFFIXES.map((suffix) => ({
          slug: { endsWith: suffix },
        })),
      },
    },
    include: { _count: { select: { matches: true } } },
  });

  for (const mod of legacy) {
    const canonical = await prisma.modalidade.findFirst({
      where: {
        name: mod.name,
        category: mod.category,
        gender: mod.gender,
        slug: { endsWith: mod.gender === 'female' ? '-feminino' : '-masculino' },
      },
    });

    if (canonical && mod._count.matches > 0) {
      await prisma.match.updateMany({
        where: { modalidadeId: mod.id },
        data: { modalidadeId: canonical.id },
      });
    }

    if (canonical || mod._count.matches === 0) {
      await prisma.modalidade.delete({ where: { id: mod.id } });
    }
  }
}

export async function seedSports(prisma: PrismaClient) {
  for (const sport of SPORTS_CATALOG) {
    for (const gender of GENDERS) {
      const slug = `${sport.slugBase}-${gender.suffix}`;
      const name = sport.name;
      const scoringMode =
        sport.slugBase === 'atletismo' || sport.slugBase === 'natacao'
          ? ScoringMode.PLACEMENT
          : ScoringMode.VERSUS;

      await prisma.modalidade.upsert({
        where: { slug },
        update: {
          name,
          category: sport.category,
          gender: gender.key,
          scoringMode,
        },
        create: {
          name,
          slug,
          category: sport.category,
          gender: gender.key,
          scoringMode,
        },
      });
    }
  }

  await cleanupLegacyModalidades(prisma);
}

export { isCanonicalSlug };