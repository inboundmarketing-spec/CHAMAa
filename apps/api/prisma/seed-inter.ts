import { PrismaClient } from '@prisma/client';
import {
  AtleticaDivisionSource,
  AtleticaDivisionTier,
  ChallengeType,
  challengeTypeLabel,
  isDivisionOneCampus,
} from '@chama/shared';

export async function seedInter(prisma: PrismaClient) {
  await prisma.interEdition.upsert({
    where: { id: 'current' },
    update: {},
    create: {
      id: 'current',
      status: 'active',
      currentGameDayIndex: 1,
    },
  });

  const base = new Date();
  base.setHours(8, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const startsAt = new Date(base);
    startsAt.setDate(startsAt.getDate() + i);
    const endsAt = new Date(startsAt);
    endsAt.setHours(22, 0, 0, 0);

    await prisma.interGameDay.upsert({
      where: {
        editionId_dayIndex: { editionId: 'current', dayIndex: i + 1 },
      },
      update: {
        label: `Dia ${i + 1}`,
        startsAt,
        endsAt,
      },
      create: {
        editionId: 'current',
        dayIndex: i + 1,
        label: `Dia ${i + 1}`,
        startsAt,
        endsAt,
      },
    });
  }

  const atleticas = await prisma.atletica.findMany({
    include: { campus: true },
  });

  for (const a of atleticas) {
    const division = isDivisionOneCampus(a.campus.name)
      ? AtleticaDivisionTier.FIRST
      : AtleticaDivisionTier.SECOND;

    await prisma.atleticaDivision.upsert({
      where: { atleticaId: a.id },
      update: { division },
      create: {
        atleticaId: a.id,
        division,
        source: AtleticaDivisionSource.SEED,
      },
    });

    for (const challengeType of [ChallengeType.BATTERY, ChallengeType.CHEER]) {
      await prisma.atleticaChallengeDivision.upsert({
        where: {
          atleticaId_challengeType: {
            atleticaId: a.id,
            challengeType,
          },
        },
        update: { division },
        create: {
          atleticaId: a.id,
          challengeType,
          division,
          source: AtleticaDivisionSource.SEED,
        },
      });
    }
  }

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  defaultDate.setHours(19, 0, 0, 0);

  for (const challengeType of [ChallengeType.BATTERY, ChallengeType.CHEER]) {
    await prisma.challenge.upsert({
      where: { challengeType },
      update: {},
      create: {
        challengeType,
        title: challengeTypeLabel(challengeType),
        scheduledAt: defaultDate,
        locationName: 'Local a definir',
        description: 'Cadastre data, local e observações no painel Desafios.',
      },
    });
  }
}
