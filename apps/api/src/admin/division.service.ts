import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AtleticaDivisionSource,
  AtleticaDivisionTier,
  InterEditionStatus,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StandingsService } from './standings.service';

const PROMOTE_COUNT = 3;
const RELEGATE_COUNT = 3;

@Injectable()
export class DivisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
  ) {}

  async getEdition() {
    return this.prisma.interEdition.upsert({
      where: { id: 'current' },
      update: {},
      create: { id: 'current', status: InterEditionStatus.ACTIVE },
      include: {
        gameDays: { orderBy: { dayIndex: 'asc' } },
      },
    });
  }

  async listDivisions() {
    const rows = await this.prisma.atleticaDivision.findMany({
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

  async getTeamDivision(teamName: string): Promise<string> {
    const atleticas = await this.prisma.atletica.findMany({
      include: { campus: true },
    });
    const atletica = atleticas.find(
      (a) => a.campus.name.toLowerCase() === teamName.trim().toLowerCase(),
    );
    if (!atletica) {
      throw new BadRequestException(`Atlética não encontrada: ${teamName}`);
    }
    const map = await this.divisionMap();
    return map.get(atletica.id) ?? AtleticaDivisionTier.FIRST;
  }

  async assertTeamsSameDivision(teams: string[]) {
    const normalized = teams.map((t) => t.trim()).filter(Boolean);
    if (normalized.length < 2) return;

    const divisions = await Promise.all(
      normalized.map((team) => this.getTeamDivision(team)),
    );
    const unique = new Set(divisions);
    if (unique.size > 1) {
      throw new BadRequestException(
        'Confrontos só são permitidos entre atléticas da mesma divisão',
      );
    }
  }

  async setDivision(atleticaId: string, division: string) {
    if (
      division !== AtleticaDivisionTier.FIRST &&
      division !== AtleticaDivisionTier.SECOND
    ) {
      throw new BadRequestException('Divisão inválida');
    }
    return this.prisma.atleticaDivision.upsert({
      where: { atleticaId },
      create: {
        atleticaId,
        division,
        source: AtleticaDivisionSource.MANUAL,
      },
      update: {
        division,
        source: AtleticaDivisionSource.MANUAL,
      },
    });
  }

  /** 3 últimos da 1ª caem; 3 primeiros da 2ª sobem. */
  async applyPromotionRelegation() {
    const standings = await this.standings.list();
    const divisionMap = await this.divisionMap();

    const firstRows = standings
      .filter((r) => divisionMap.get(r.atleticaId) === AtleticaDivisionTier.FIRST)
      .sort((a, b) => a.position - b.position);
    const secondRows = standings
      .filter((r) => divisionMap.get(r.atleticaId) === AtleticaDivisionTier.SECOND)
      .sort((a, b) => a.position - b.position);

    const relegateIds = firstRows
      .slice(-RELEGATE_COUNT)
      .map((r) => r.atleticaId);
    const promoteIds = secondRows
      .slice(0, PROMOTE_COUNT)
      .map((r) => r.atleticaId);

    await this.prisma.$transaction([
      ...relegateIds.map((atleticaId) =>
        this.prisma.atleticaDivision.update({
          where: { atleticaId },
          data: {
            division: AtleticaDivisionTier.SECOND,
            source: AtleticaDivisionSource.PROMOTION,
          },
        }),
      ),
      ...promoteIds.map((atleticaId) =>
        this.prisma.atleticaDivision.update({
          where: { atleticaId },
          data: {
            division: AtleticaDivisionTier.FIRST,
            source: AtleticaDivisionSource.PROMOTION,
          },
        }),
      ),
    ]);

    return {
      relegated: relegateIds,
      promoted: promoteIds,
    };
  }

  async closeGameDay(dayIndex?: number) {
    const edition = await this.getEdition();
    if (edition.status === InterEditionStatus.CLOSED) {
      throw new BadRequestException('Inter já encerrado');
    }

    const idx = dayIndex ?? edition.currentGameDayIndex;
    const day = await this.prisma.interGameDay.findUnique({
      where: { editionId_dayIndex: { editionId: 'current', dayIndex: idx } },
    });
    if (!day) throw new NotFoundException('Dia de jogos não encontrado');
    if (day.closedAt) {
      throw new BadRequestException('Este dia já foi encerrado');
    }

    const promotion = await this.applyPromotionRelegation();

    await this.prisma.$transaction([
      this.prisma.interGameDay.update({
        where: { id: day.id },
        data: { closedAt: new Date() },
      }),
      this.prisma.interEdition.update({
        where: { id: 'current' },
        data: {
          currentGameDayIndex: Math.min(idx + 1, 3),
        },
      }),
    ]);

    return { dayIndex: idx, promotion };
  }

  async closeInter() {
    const edition = await this.getEdition();
    if (edition.status === InterEditionStatus.CLOSED) {
      throw new BadRequestException('Inter já encerrado');
    }

    const promotion = await this.applyPromotionRelegation();

    await this.prisma.interEdition.update({
      where: { id: 'current' },
      data: { status: InterEditionStatus.CLOSED },
    });

    const openDays = await this.prisma.interGameDay.findMany({
      where: { editionId: 'current', closedAt: null },
    });
    await this.prisma.$transaction(
      openDays.map((d) =>
        this.prisma.interGameDay.update({
          where: { id: d.id },
          data: { closedAt: new Date() },
        }),
      ),
    );

    return { promotion };
  }

  private async divisionMap() {
    const rows = await this.prisma.atleticaDivision.findMany();
    return new Map(rows.map((r) => [r.atleticaId, r.division]));
  }
}
