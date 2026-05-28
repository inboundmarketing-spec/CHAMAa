import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AtleticaDivisionSource,
  AtleticaDivisionTier,
  ChallengeType,
  isDivisionOneCampus,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengeDivisionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(challengeType: string) {
    if (
      challengeType !== ChallengeType.BATTERY &&
      challengeType !== ChallengeType.CHEER
    ) {
      throw new BadRequestException('Tipo de desafio inválido');
    }

    await this.ensureSeeded(challengeType);

    const rows = await this.prisma.atleticaChallengeDivision.findMany({
      where: { challengeType },
      include: {
        atletica: { include: { campus: true } },
      },
      orderBy: { atletica: { campus: { name: 'asc' } } },
    });

    return rows.map((r) => ({
      id: r.id,
      atleticaId: r.atleticaId,
      team: r.atletica.campus.name,
      atleticaName: r.atletica.name,
      division: r.division,
      source: r.source,
      updatedAt: r.updatedAt,
    }));
  }

  async setDivision(
    atleticaId: string,
    challengeType: string,
    division: string,
  ) {
    if (
      challengeType !== ChallengeType.BATTERY &&
      challengeType !== ChallengeType.CHEER
    ) {
      throw new BadRequestException('Tipo de desafio inválido');
    }
    if (
      division !== AtleticaDivisionTier.FIRST &&
      division !== AtleticaDivisionTier.SECOND
    ) {
      throw new BadRequestException('Divisão inválida');
    }

    return this.prisma.atleticaChallengeDivision.upsert({
      where: {
        atleticaId_challengeType: { atleticaId, challengeType },
      },
      create: {
        atleticaId,
        challengeType,
        division,
        source: AtleticaDivisionSource.MANUAL,
      },
      update: {
        division,
        source: AtleticaDivisionSource.MANUAL,
      },
    });
  }

  private async ensureSeeded(challengeType: string) {
    const count = await this.prisma.atleticaChallengeDivision.count({
      where: { challengeType },
    });
    if (count > 0) return;

    const atleticas = await this.prisma.atletica.findMany({
      include: { campus: true },
    });

    await this.prisma.$transaction(
      atleticas.map((a) => {
        const division = isDivisionOneCampus(a.campus.name)
          ? AtleticaDivisionTier.FIRST
          : AtleticaDivisionTier.SECOND;
        return this.prisma.atleticaChallengeDivision.create({
          data: {
            atleticaId: a.id,
            challengeType,
            division,
            source: AtleticaDivisionSource.SEED,
          },
        });
      }),
    );
  }
}
