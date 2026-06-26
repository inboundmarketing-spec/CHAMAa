import { Injectable } from '@nestjs/common';
import {
  AtleticaDivisionTier,
  ScoringMode,
  STANDINGS_POINTS,
  sortStandingsRows,
  type StandingRow,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MatchPointsService } from './match-points.service';

@Injectable()
export class StandingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchPoints: MatchPointsService,
  ) {}

  async list(divisionFilter?: string): Promise<StandingRow[]> {
    await this.ensureRows();
    const divisionMap = await this.divisionMap();
    const rows = await this.prisma.atleticaStanding.findMany({
      include: { atletica: { include: { campus: true } } },
    });

    const sorted = sortStandingsRows(
      rows.map((r) => ({
        atleticaId: r.atleticaId,
        team: r.atletica.campus.name,
        division: divisionMap.get(r.atleticaId),
        points: r.points,
        played: r.played,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
      })),
    );

    if (!divisionFilter) return sorted;

    const filtered = sorted.filter((r) => r.division === divisionFilter);
    return filtered.map((r, i) => ({ ...r, position: i + 1 }));
  }

  /** Classificação por modalidade (jogos finalizados daquela prova). */
  async listForModalidade(modalidadeId: string): Promise<StandingRow[]> {
    const modalidade = await this.prisma.modalidade.findUnique({
      where: { id: modalidadeId },
    });
    if (!modalidade) return [];

    const atleticas = await this.prisma.atletica.findMany({
      include: { campus: true },
    });
    const teamToAtletica = new Map(
      atleticas.map((a) => [a.campus.name.toLowerCase(), a.id]),
    );

    type Acc = {
      team: string;
      atleticaId: string;
      points: number;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };

    const acc = new Map<string, Acc>();

    const matches = await this.prisma.match.findMany({
      where: {
        modalidadeId,
        status: 'finished',
        homeTeam: { not: null },
        awayTeam: { not: null },
        modalidade: { scoringMode: ScoringMode.VERSUS },
      },
      select: {
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        homePointsAwarded: true,
        awayPointsAwarded: true,
      },
    });

    for (const m of matches) {
      const homeName = m.homeTeam!.trim();
      const awayName = m.awayTeam!.trim();
      const homeId = teamToAtletica.get(homeName.toLowerCase());
      const awayId = teamToAtletica.get(awayName.toLowerCase());
      if (!homeId || !awayId) continue;

      if (!acc.has(homeId)) {
        const a = atleticas.find((x) => x.id === homeId)!;
        acc.set(homeId, {
          team: a.campus.name,
          atleticaId: homeId,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        });
      }
      if (!acc.has(awayId)) {
        const a = atleticas.find((x) => x.id === awayId)!;
        acc.set(awayId, {
          team: a.campus.name,
          atleticaId: awayId,
          points: 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        });
      }

      const home = acc.get(homeId)!;
      const away = acc.get(awayId)!;

      home.played += 1;
      away.played += 1;
      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;

      const homePts = m.homePointsAwarded ?? 0;
      const awayPts = m.awayPointsAwarded ?? 0;
      home.points += homePts;
      away.points += awayPts;

      if (m.homeScore > m.awayScore) {
        home.wins += 1;
        away.losses += 1;
      } else if (m.homeScore < m.awayScore) {
        away.wins += 1;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
      }
    }

    return sortStandingsRows([...acc.values()]);
  }

  async listByDivisions(): Promise<{
    first: StandingRow[];
    second: StandingRow[];
    updatedAt: Date;
  }> {
    const all = await this.list();
    const first = all
      .filter(
        (r) =>
          r.division === AtleticaDivisionTier.FIRST || r.division == null,
      )
      .map((r, i) => ({ ...r, position: i + 1 }));
    const second = all
      .filter((r) => r.division === AtleticaDivisionTier.SECOND)
      .map((r, i) => ({ ...r, position: i + 1 }));

    const latest = await this.prisma.atleticaStanding.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      first,
      second,
      updatedAt: latest?.updatedAt ?? new Date(),
    };
  }

  /** Recalcula pontos de partidas finalizadas e agrega na classificação. */
  async recalculateFromMatches() {
    const finished = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        homeTeam: { not: null },
        awayTeam: { not: null },
        modalidade: { scoringMode: ScoringMode.VERSUS },
      },
      select: { id: true },
    });

    for (const m of finished) {
      await this.matchPoints.computeForMatch(m.id);
    }

    const atleticas = await this.prisma.atletica.findMany({
      include: { campus: true },
    });
    const teamToAtletica = new Map(
      atleticas.map((a) => [a.campus.name.toLowerCase(), a.id]),
    );

    type Acc = {
      points: number;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    };

    const acc = new Map<string, Acc>();
    for (const a of atleticas) {
      acc.set(a.id, {
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      });
    }

    const matches = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        homeTeam: { not: null },
        awayTeam: { not: null },
        modalidade: { scoringMode: ScoringMode.VERSUS },
      },
      select: {
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        homePointsAwarded: true,
        awayPointsAwarded: true,
      },
    });

    for (const m of matches) {
      const homeId = teamToAtletica.get(m.homeTeam!.trim().toLowerCase());
      const awayId = teamToAtletica.get(m.awayTeam!.trim().toLowerCase());
      if (!homeId || !awayId) continue;

      const home = acc.get(homeId)!;
      const away = acc.get(awayId)!;

      home.played += 1;
      away.played += 1;
      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;

      const homePts = m.homePointsAwarded ?? 0;
      const awayPts = m.awayPointsAwarded ?? 0;
      home.points += homePts;
      away.points += awayPts;

      if (m.homeScore > m.awayScore) {
        home.wins += 1;
        away.losses += 1;
      } else if (m.homeScore < m.awayScore) {
        away.wins += 1;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
      }
    }

    await this.prisma.$transaction(
      [...acc.entries()].map(([atleticaId, stats]) =>
        this.prisma.atleticaStanding.upsert({
          where: { atleticaId },
          create: { atleticaId, ...stats },
          update: stats,
        }),
      ),
    );

    return this.list();
  }

  private async divisionMap() {
    const rows = await this.prisma.atleticaDivision.findMany();
    return new Map(rows.map((r) => [r.atleticaId, r.division]));
  }

  private async ensureRows() {
    const atleticas = await this.prisma.atletica.findMany({
      select: { id: true },
    });
    const existing = await this.prisma.atleticaStanding.count();
    if (existing >= atleticas.length) return;

    await this.prisma.$transaction(
      atleticas.map((a) =>
        this.prisma.atleticaStanding.upsert({
          where: { atleticaId: a.id },
          create: { atleticaId: a.id },
          update: {},
        }),
      ),
    );
  }
}
