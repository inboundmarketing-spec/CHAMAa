import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MATCH_POINTS_DEFAULTS,
  MatchDisciplineType,
  ScoringMode,
  defaultPointsDeltaForDiscipline,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';

export type ComputedMatchPoints = {
  homePointsAwarded: number;
  awayPointsAwarded: number;
  pointsWarning: boolean;
};

@Injectable()
export class MatchPointsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForMatch(matchId: string): Promise<ComputedMatchPoints> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        modalidade: true,
        disciplines: true,
      },
    });
    if (!match) throw new NotFoundException('Partida não encontrada');

    if (match.modalidade.scoringMode !== ScoringMode.VERSUS) {
      return {
        homePointsAwarded: 0,
        awayPointsAwarded: 0,
        pointsWarning: false,
      };
    }

    if (!match.homeTeam || !match.awayTeam) {
      return {
        homePointsAwarded: 0,
        awayPointsAwarded: 0,
        pointsWarning: false,
      };
    }

    const base = match.pointsBase ?? MATCH_POINTS_DEFAULTS.winBase;
    let home = 0;
    let away = 0;

    if (match.homeScore > match.awayScore) {
      home = base;
    } else if (match.homeScore < match.awayScore) {
      away = base;
    } else {
      home = MATCH_POINTS_DEFAULTS.drawSplit;
      away = MATCH_POINTS_DEFAULTS.drawSplit;
    }

    for (const d of match.disciplines) {
      const delta = d.pointsDelta;
      if (d.team === match.homeTeam) home += delta;
      else if (d.team === match.awayTeam) away += delta;
    }

    home = Math.max(0, home);
    away = Math.max(0, away);

    const hasManualOverride =
      match.homePointsAwarded != null &&
      match.awayPointsAwarded != null &&
      (match.homePointsAwarded !== home || match.awayPointsAwarded !== away);

    const pointsWarning =
      hasManualOverride &&
      !this.manualExplainedByDisciplines(match.disciplines, home, away, {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        computedHome: home,
        computedAway: away,
      });

    const homePointsAwarded = match.homePointsAwarded ?? home;
    const awayPointsAwarded = match.awayPointsAwarded ?? away;

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        homePointsAwarded,
        awayPointsAwarded,
        pointsWarning,
      },
    });

    return { homePointsAwarded, awayPointsAwarded, pointsWarning };
  }

  async syncAfterFinish(matchId: string) {
    return this.computeForMatch(matchId);
  }

  async updateDisciplines(
    matchId: string,
    items: {
      team: string;
      type: MatchDisciplineType;
      pointsDelta?: number;
      athleteName?: string;
      minute?: number;
      notes?: string;
    }[],
    createdById?: string,
  ) {
    await this.prisma.matchDiscipline.deleteMany({ where: { matchId } });
    if (items.length) {
      await this.prisma.matchDiscipline.createMany({
        data: items.map((item) => ({
          matchId,
          team: item.team,
          type: item.type,
          pointsDelta:
            item.pointsDelta ??
            defaultPointsDeltaForDiscipline(item.type),
          athleteName: item.athleteName,
          minute: item.minute,
          notes: item.notes,
          createdById,
        })),
      });
    }
    await this.prisma.match.update({
      where: { id: matchId },
      data: { homePointsAwarded: null, awayPointsAwarded: null },
    });
    return this.computeForMatch(matchId);
  }

  async setManualPoints(
    matchId: string,
    homePointsAwarded: number,
    awayPointsAwarded: number,
  ) {
    const computed = await this.computeForMatch(matchId);
    const pointsWarning =
      homePointsAwarded !== computed.homePointsAwarded ||
      awayPointsAwarded !== computed.awayPointsAwarded;

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        homePointsAwarded,
        awayPointsAwarded,
        pointsWarning,
      },
    });

    return { homePointsAwarded, awayPointsAwarded, pointsWarning };
  }

  private manualExplainedByDisciplines(
    disciplines: { type: string; pointsDelta: number }[],
    targetHome: number,
    targetAway: number,
    ctx: {
      homeTeam: string;
      awayTeam: string;
      computedHome: number;
      computedAway: number;
    },
  ): boolean {
    if (disciplines.length > 0) return true;
    return (
      targetHome === ctx.computedHome && targetAway === ctx.computedAway
    );
  }
}
