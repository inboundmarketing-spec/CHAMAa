import { PrismaService } from '../prisma/prisma.service';

export async function recordGameStartedAt(
  prisma: PrismaService,
  matchId: string,
) {
  const existing = await prisma.matchIncident.findUnique({
    where: { matchId },
  });
  if (existing?.gameStartedAt) return existing;

  const now = new Date();
  return prisma.matchIncident.upsert({
    where: { matchId },
    create: {
      matchId,
      type: 'other',
      description: 'Não houve intercorrência',
      gameStartedAt: now,
    },
    update: { gameStartedAt: now },
  });
}

export async function recordGameEndedAt(
  prisma: PrismaService,
  matchId: string,
) {
  const now = new Date();
  const existing = await prisma.matchIncident.findUnique({
    where: { matchId },
  });

  if (existing) {
    return prisma.matchIncident.update({
      where: { matchId },
      data: { gameEndedAt: now },
    });
  }

  return prisma.matchIncident.create({
    data: {
      matchId,
      type: 'other',
      description: 'Não houve intercorrência',
      gameEndedAt: now,
    },
  });
}

export async function ensureDefaultIncident(
  prisma: PrismaService,
  matchId: string,
) {
  const existing = await prisma.matchIncident.findUnique({
    where: { matchId },
  });
  if (existing) return existing;

  return prisma.matchIncident.create({
    data: {
      matchId,
      type: 'other',
      description: 'Não houve intercorrência',
    },
  });
}
