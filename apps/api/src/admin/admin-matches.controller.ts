import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { isPlacementModalidade } from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AdminRequestUser,
  canCreateMatches,
  canDeleteMatches,
  canFinishMatchDirectly,
  hasFullAccess,
  isNeutralRole,
  isVenueCoordinatorRole,
  matchListWhereForUser,
  matchWriteWhereForUser,
} from '../auth/admin-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  recordGameEndedAt,
  recordGameStartedAt,
} from './match-incident.service';
import { liveStatusPatch } from './match-live.util';
import { StandingsService } from './standings.service';
import { MatchPointsService } from './match-points.service';
import { DivisionService } from './division.service';
import { MatchDisciplineType } from '@chama/shared';

class MatchParticipantDto {
  @IsString()
  team!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  placement?: number;
}

class CreateMatchDto {
  @IsString()
  modalidadeId!: string;

  @IsString()
  venueId!: string;

  @IsOptional()
  @IsString()
  homeTeam?: string;

  @IsOptional()
  @IsString()
  awayTeam?: string;

  @IsOptional()
  @IsString()
  division?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchParticipantDto)
  participants?: MatchParticipantDto[];

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  bracketRound?: string;

  @IsOptional()
  @IsString()
  bracketInfo?: string;
}

class UpdateMatchDto {
  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsInt()
  homeScore?: number;

  @IsOptional()
  @IsInt()
  awayScore?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  bracketRound?: string;

  @IsOptional()
  @IsString()
  gamePeriod?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchParticipantDto)
  participants?: MatchParticipantDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsBase?: number;

  @IsOptional()
  @IsInt()
  homePointsAwarded?: number;

  @IsOptional()
  @IsInt()
  awayPointsAwarded?: number;
}

class MatchDisciplineItemDto {
  @IsString()
  team!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsInt()
  pointsDelta?: number;

  @IsOptional()
  @IsString()
  athleteName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minute?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateDisciplinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchDisciplineItemDto)
  items!: MatchDisciplineItemDto[];
}

class CreateIncidentDto {
  @IsString()
  type!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  athleteName?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minute?: number;

  @IsOptional()
  @IsString()
  actionTaken?: string;

  @IsOptional()
  @IsString()
  reportedBy?: string;
}

const matchInclude = {
  modalidade: true,
  venue: true,
  participants: { orderBy: { sortOrder: 'asc' as const } },
  disciplines: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { incidents: true } },
};

@Controller('api/admin/matches')
@UseGuards(JwtAuthGuard)
export class AdminMatchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
    private readonly matchPoints: MatchPointsService,
    private readonly divisions: DivisionService,
    @InjectQueue('match-alerts') private readonly alertQueue: Queue,
  ) {}

  @Get()
  async list(@Req() req: { user: AdminRequestUser }) {
    const user = req.user;
    const matches = await this.prisma.match.findMany({
      where: matchListWhereForUser(user),
      include: matchInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    if (!isNeutralRole(user.role)) {
      return matches.map((m) => ({ ...m, canOperate: true }));
    }

    const assigned = await this.prisma.matchAssignment.findMany({
      where: { adminUserId: user.id },
      select: { matchId: true },
    });
    const assignedIds = new Set(assigned.map((a) => a.matchId));

    return matches.map((m) => ({
      ...m,
      canOperate: assignedIds.has(m.id),
    }));
  }

  @Get(':id')
  async getOne(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    await this.assertMatchAccess(req.user, id);
    return this.prisma.match.findUniqueOrThrow({
      where: { id },
      include: matchInclude,
    });
  }

  @Get(':id/incidents')
  async getIncident(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    await this.assertMatchAccess(req.user, id);
    return this.prisma.matchIncident.findUnique({
      where: { matchId: id },
    });
  }

  @Put(':id/incidents')
  upsertIncident(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.saveIncident(req.user, id, dto);
  }

  @Post(':id/incidents')
  createIncident(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.saveIncident(req.user, id, dto);
  }

  @Get(':id/disciplines')
  async listDisciplines(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    await this.assertMatchAccess(req.user, id);
    return this.prisma.matchDiscipline.findMany({
      where: { matchId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Put(':id/disciplines')
  async updateDisciplines(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateDisciplinesDto,
  ) {
    await this.assertMatchAccess(req.user, id);
    const result = await this.matchPoints.updateDisciplines(
      id,
      dto.items.map((item) => ({
        team: item.team,
        type: item.type as MatchDisciplineType,
        pointsDelta: item.pointsDelta,
        athleteName: item.athleteName,
        minute: item.minute,
        notes: item.notes,
      })),
      req.user.id,
    );
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (match?.status === 'finished') {
      void this.standings.recalculateFromMatches().catch(() => undefined);
    }
    return result;
  }

  @Post()
  async create(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: CreateMatchDto,
  ) {
    if (!canCreateMatches(req.user.role)) {
      throw new ForbiddenException('Você não pode cadastrar novas partidas');
    }

    const modalidade = await this.prisma.modalidade.findUnique({
      where: { id: dto.modalidadeId },
    });
    if (!modalidade) {
      throw new NotFoundException('Modalidade não encontrada');
    }

    const placement = isPlacementModalidade(
      modalidade.slug,
      modalidade.scoringMode,
    );

    const participantTeams = (dto.participants ?? [])
      .map((p) => p.team.trim())
      .filter(Boolean);
    const uniqueTeams = [...new Set(participantTeams)];

    if (placement) {
      if (!dto.division?.trim()) {
        throw new ForbiddenException('Selecione a prova da competição');
      }
      if (uniqueTeams.length < 2) {
        throw new ForbiddenException(
          'Inclua ao menos duas atléticas participantes',
        );
      }
    } else if (!dto.homeTeam?.trim() || !dto.awayTeam?.trim()) {
      throw new ForbiddenException('Informe as duas atléticas');
    } else if (dto.homeTeam.trim() === dto.awayTeam.trim()) {
      throw new ForbiddenException('As atléticas devem ser diferentes');
    } else {
      await this.divisions.assertTeamsSameDivision([
        dto.homeTeam!.trim(),
        dto.awayTeam!.trim(),
      ]);
    }

    if (placement && uniqueTeams.length >= 2) {
      await this.divisions.assertTeamsSameDivision(uniqueTeams);
    }

    const homeTeam = placement ? null : dto.homeTeam!.trim();
    const awayTeam = placement ? null : dto.awayTeam!.trim();

    return this.prisma.$transaction(async (tx) => {
      const match = await tx.match.create({
        data: {
          modalidadeId: dto.modalidadeId,
          venueId: dto.venueId,
          homeTeam,
          awayTeam,
          division: dto.division?.trim() || null,
          scheduledAt: new Date(dto.scheduledAt),
          status: dto.status ?? 'scheduled',
          bracketRound: dto.bracketRound,
          bracketInfo: dto.bracketInfo,
        },
      });

      if (placement && uniqueTeams.length > 0) {
        await tx.matchParticipant.createMany({
          data: uniqueTeams.map((team, index) => ({
            matchId: match.id,
            team,
            sortOrder: index,
            placement: dto.participants?.find((p) => p.team === team)
              ?.placement,
          })),
        });
      }

      return tx.match.findUniqueOrThrow({
        where: { id: match.id },
        include: matchInclude,
      });
    });
  }

  @Patch(':id')
  async update(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateMatchDto,
  ) {
    const match = await this.assertMatchAccess(req.user, id);

    if (dto.status === 'finished' && !canFinishMatchDirectly(req.user.role)) {
      throw new ForbiddenException(
        'Neutros precisam solicitar encerramento em Confirmações',
      );
    }

    if (
      isVenueCoordinatorRole(req.user.role) &&
      dto.venueId !== undefined &&
      dto.venueId !== match.venueId
    ) {
      throw new ForbiddenException('Você não pode alterar a praça da partida');
    }

    if (
      isNeutralRole(req.user.role) &&
      (dto.venueId !== undefined || dto.scheduledAt !== undefined)
    ) {
      throw new ForbiddenException('Alteração não permitida');
    }

    const before = await this.prisma.match.findUnique({
      where: { id },
      include: { venue: true, modalidade: true, participants: true },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.participants !== undefined) {
        await tx.matchParticipant.deleteMany({ where: { matchId: id } });
        const teams = dto.participants
          .map((p) => p.team.trim())
          .filter(Boolean);
        const unique = [...new Set(teams)];
        if (unique.length > 0) {
          await tx.matchParticipant.createMany({
            data: unique.map((team, index) => ({
              matchId: id,
              team,
              sortOrder: index,
              placement: dto.participants!.find((p) => p.team === team)
                ?.placement,
            })),
          });
        }
      }

      const livePatch = liveStatusPatch(dto.status, before?.status);

      return tx.match.update({
        where: { id },
        data: {
          venueId: hasFullAccess(req.user.role) ? dto.venueId : undefined,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          status: dto.status,
          scheduledAt: dto.scheduledAt
            ? new Date(dto.scheduledAt)
            : undefined,
          bracketRound: dto.bracketRound,
          gamePeriod:
            dto.gamePeriod !== undefined ? dto.gamePeriod : undefined,
          pointsBase: dto.pointsBase,
          homePointsAwarded: dto.homePointsAwarded,
          awayPointsAwarded: dto.awayPointsAwarded,
          ...livePatch,
        },
        include: matchInclude,
      });
    });

    const scoreOrPointsChanged =
      dto.homeScore !== undefined ||
      dto.awayScore !== undefined ||
      dto.homePointsAwarded !== undefined ||
      dto.awayPointsAwarded !== undefined ||
      dto.pointsBase !== undefined;

    if (updated.status === 'finished' && scoreOrPointsChanged) {
      await this.matchPoints.computeForMatch(id);
      void this.standings.recalculateFromMatches().catch(() => undefined);
    }

    if (dto.status === 'live' && before?.status !== 'live') {
      await recordGameStartedAt(this.prisma, id);
    }

    if (dto.status === 'finished' && before?.status !== 'finished') {
      await recordGameEndedAt(this.prisma, id);
      void this.standings.recalculateFromMatches().catch(() => undefined);
    }

    const venueChanged =
      dto.venueId !== undefined && before?.venueId !== dto.venueId;
    const statusChanged =
      dto.status !== undefined && before?.status !== dto.status;
    const scoreChanged =
      dto.homeScore !== undefined ||
      dto.awayScore !== undefined ||
      dto.participants !== undefined;

    if (venueChanged || statusChanged === true || scoreChanged) {
      await this.alertQueue.add('match-updated', {
        matchId: id,
        venueChanged,
        statusChanged: dto.status,
        scoreChanged,
      });
    }

    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: { user: AdminRequestUser }, @Param('id') id: string) {
    if (!canDeleteMatches(req.user.role)) {
      throw new ForbiddenException('Você não pode excluir partidas');
    }
    await this.assertMatchAccess(req.user, id);
    return this.prisma.match.delete({ where: { id } });
  }

  private async saveIncident(
    user: AdminRequestUser,
    id: string,
    dto: CreateIncidentDto,
  ) {
    await this.assertMatchAccess(user, id);
    return this.prisma.matchIncident.upsert({
      where: { matchId: id },
      create: {
        matchId: id,
        type: dto.type,
        description: dto.description,
        athleteName: dto.athleteName,
        team: dto.team,
        minute: dto.minute,
        actionTaken: dto.actionTaken,
        reportedBy: dto.reportedBy,
      },
      update: {
        type: dto.type,
        description: dto.description,
        athleteName: dto.athleteName,
        team: dto.team,
        minute: dto.minute,
        actionTaken: dto.actionTaken,
        reportedBy: dto.reportedBy,
      },
    });
  }

  private async assertMatchAccess(user: AdminRequestUser, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, ...matchWriteWhereForUser(user) },
    });
    if (!match) {
      throw new NotFoundException('Partida não encontrada ou sem acesso');
    }
    return match;
  }
}
