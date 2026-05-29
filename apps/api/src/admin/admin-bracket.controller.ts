import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ATLETICAS,
  AtleticaDivisionTier,
  DIVISION_LABELS,
  hasFullAccess,
  planEliminationBracket,
  planWithDivisionSuffix,
  usesEliminationBracket,
  buildByeNote,
  describeBracketPlan,
  flattenBracketPlan,
  getFirstRoundByeTeams,
} from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DivisionService } from './division.service';
import {
  getBracketExclusions,
  setBracketExclusions,
} from './bracket-exclusions.util';
import {
  backfillUnnumberedMatches,
  buildDivisionPlans,
  findActiveDivisionPlan,
  findLastRealTeamMatch,
  getBracketDrawProgress,
  matchesForDivision,
  nextRealTeamSlot,
  resolveTeamsForPlannedMatch,
  type BracketMatchRow,
} from './bracket-draw.util';
import {
  buildNumberedBracketInfo,
  findNextRealTeamPlannedMatch,
  occupiedConfrontoSlots,
  parseConfrontoNum,
  pickRandomPair,
  teamsUsedInRealMatches,
} from '@chama/shared';

class DrawBracketDto {
  @IsString()
  modalidadeId!: string;

  @IsArray()
  @IsString({ each: true })
  teams!: string[];

  @IsOptional()
  @IsString()
  bracketRound?: string;

  @IsOptional()
  @IsBoolean()
  clearPhase?: boolean;

  /** Se true (padrão), apaga toda a chave da modalidade e monta todas as rodadas. */
  @IsOptional()
  @IsBoolean()
  fullBracket?: boolean;
}

class PublishBracketDto {
  @IsString()
  modalidadeId!: string;

  @IsBoolean()
  published!: boolean;
}

class ManualBracketMatchDto {
  @IsString()
  modalidadeId!: string;

  @IsString()
  homeTeam!: string;

  @IsString()
  awayTeam!: string;

  @IsString()
  bracketRound!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teams?: string[];

  @IsOptional()
  @IsString()
  bracketInfo?: string;
}

class UpdateBracketMatchDto {
  @IsOptional()
  @IsString()
  homeTeam?: string;

  @IsOptional()
  @IsString()
  awayTeam?: string;

  @IsOptional()
  @IsString()
  bracketRound?: string;

  @IsOptional()
  @IsString()
  bracketInfo?: string;
}

class SetBracketExclusionsDto {
  @IsString()
  modalidadeId!: string;

  @IsArray()
  @IsString({ each: true })
  excludedTeams!: string[];
}

class ResetBracketDto {
  @IsString()
  modalidadeId!: string;
}

class DrawStepDto {
  @IsString()
  modalidadeId!: string;

  @IsArray()
  @IsString({ each: true })
  teams!: string[];

  @IsString()
  action!: 'next' | 'reshuffle';
}

@Controller('api/admin/bracket')
@UseGuards(JwtAuthGuard)
export class AdminBracketController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly divisions: DivisionService,
  ) {}

  private assertManage(user: AdminRequestUser) {
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }
  }

  private async publishModalidade(modalidadeId: string) {
    return this.prisma.modalidade.update({
      where: { id: modalidadeId },
      data: { bracketPublished: true },
    });
  }

  private async requireBracketModalidade(modalidadeId: string) {
    const mod = await this.prisma.modalidade.findUnique({
      where: { id: modalidadeId },
    });
    if (!mod) throw new NotFoundException('Modalidade não encontrada');
    if (!usesEliminationBracket(mod.slug, mod.scoringMode)) {
      throw new BadRequestException(
        'Natação e atletismo não usam chaveamento (provas com várias atléticas ao mesmo tempo)',
      );
    }
    return mod;
  }

  @Get('modalidades')
  async listModalidades(
    @Req() req: { user: AdminRequestUser },
    @Query('gender') gender?: string,
  ) {
    this.assertManage(req.user);
    const rows = await this.prisma.modalidade.findMany({
      where: gender ? { gender } : undefined,
      orderBy: { name: 'asc' },
    });
    return rows.filter((m) =>
      usesEliminationBracket(m.slug, m.scoringMode),
    );
  }

  @Post('reset')
  async resetBracket(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: ResetBracketDto,
  ) {
    this.assertManage(req.user);
    await this.requireBracketModalidade(dto.modalidadeId);

    const deleted = await this.prisma.match.deleteMany({
      where: {
        modalidadeId: dto.modalidadeId,
        bracketRound: { not: null },
      },
    });

    await this.prisma.modalidade.update({
      where: { id: dto.modalidadeId },
      data: { bracketPublished: false },
    });

    return {
      ok: true,
      deletedCount: deleted.count,
      modalidadeId: dto.modalidadeId,
    };
  }

  @Get('matches')
  listMatches(
    @Req() req: { user: AdminRequestUser },
    @Query('modalidadeId') modalidadeId: string,
  ) {
    this.assertManage(req.user);
    return this.prisma.match.findMany({
      where: { modalidadeId },
      include: { venue: true, modalidade: true },
      orderBy: [{ bracketRound: 'asc' }, { scheduledAt: 'asc' }],
    });
  }

  @Get('eligibility')
  async getEligibility(
    @Req() req: { user: AdminRequestUser },
    @Query('modalidadeId') modalidadeId: string,
  ) {
    this.assertManage(req.user);
    if (!modalidadeId) {
      throw new BadRequestException('modalidadeId é obrigatório');
    }
    await this.requireBracketModalidade(modalidadeId);

    const excluded = new Set(
      await getBracketExclusions(this.prisma, modalidadeId),
    );
    const eligibleTeams = ATLETICAS.filter((t) => !excluded.has(t));
    const divisionPlans = await buildDivisionPlans(
      eligibleTeams,
      this.divisions,
    );

    return {
      modalidadeId,
      totalRegistered: ATLETICAS.length,
      excludedCount: excluded.size,
      excludedTeams: [...excluded].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      eligibleCount: eligibleTeams.length,
      divisions: divisionPlans.map((dp) => {
        const oitavasRound = dp.plan.rounds.find((r) =>
          r.roundName.replace(/\s*\(.*\)$/, '').trim().startsWith('Oitavas'),
        );
        return {
          division: dp.division,
          divisionLabel: dp.divisionLabel,
          teamCount: dp.teams.length,
          teams: [...dp.teams].sort((a, b) => a.localeCompare(b, 'pt-BR')),
          firstRoundByeTeams: getFirstRoundByeTeams(dp.plan),
          oitavasMatchCount: oitavasRound?.matches.length ?? 0,
          totalConfrontos: flattenBracketPlan(dp.plan).length,
          structure: describeBracketPlan(dp.teams.length),
          byeNote: buildByeNote(dp.plan),
        };
      }),
    };
  }

  @Get('exclusions')
  async getExclusions(
    @Req() req: { user: AdminRequestUser },
    @Query('modalidadeId') modalidadeId: string,
  ) {
    this.assertManage(req.user);
    if (!modalidadeId) {
      throw new BadRequestException('modalidadeId é obrigatório');
    }
    const excluded = await getBracketExclusions(this.prisma, modalidadeId);
    return { modalidadeId, excludedTeams: excluded };
  }

  @Put('exclusions')
  async putExclusions(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: SetBracketExclusionsDto,
  ) {
    this.assertManage(req.user);
    const excludedTeams = await setBracketExclusions(
      this.prisma,
      dto.modalidadeId,
      dto.excludedTeams,
    );
    return { modalidadeId: dto.modalidadeId, excludedTeams };
  }

  @Patch('matches/:id')
  async updateMatch(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateBracketMatchDto,
  ) {
    this.assertManage(req.user);
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Confronto não encontrado');
    if (!match.bracketRound) {
      throw new BadRequestException('Apenas confrontos de chaveamento podem ser editados aqui');
    }

    const homeTeam = dto.homeTeam ?? match.homeTeam;
    const awayTeam = dto.awayTeam ?? match.awayTeam;
    if (!homeTeam || !awayTeam) {
      throw new BadRequestException('Informe os dois times');
    }
    await this.divisions.assertTeamsSameDivision([homeTeam, awayTeam]);

    return this.prisma.match.update({
      where: { id },
      data: {
        homeTeam,
        awayTeam,
        bracketRound: dto.bracketRound ?? match.bracketRound,
        bracketInfo: dto.bracketInfo ?? match.bracketInfo,
      },
      include: { modalidade: true, venue: true },
    });
  }

  @Delete('matches/:id')
  async deleteMatch(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    this.assertManage(req.user);
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Confronto não encontrado');
    if (!match.bracketRound) {
      throw new BadRequestException('Apenas confrontos de chaveamento podem ser excluídos aqui');
    }
    await this.prisma.match.delete({ where: { id } });
    return { ok: true };
  }

  @Post('draw-step')
  async drawStep(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: DrawStepDto,
  ) {
    this.assertManage(req.user);
    await this.requireBracketModalidade(dto.modalidadeId);

    if (dto.action !== 'next' && dto.action !== 'reshuffle') {
      throw new BadRequestException('action deve ser next ou reshuffle');
    }

    const excluded = new Set(
      await getBracketExclusions(this.prisma, dto.modalidadeId),
    );
    const eligibleTeams = dto.teams.filter((t) => !excluded.has(t));
    const divisionPlans = await buildDivisionPlans(eligibleTeams, this.divisions);

    if (!divisionPlans.length) {
      throw new BadRequestException('É preciso ao menos 2 atléticas elegíveis');
    }

    const allMatches = await this.prisma.match.findMany({
      where: { modalidadeId: dto.modalidadeId, bracketRound: { not: null } },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        bracketRound: true,
        bracketInfo: true,
      },
    });
    let rows = allMatches as BracketMatchRow[];

    for (const dp of divisionPlans) {
      const dm = matchesForDivision(rows, dp.divisionLabel);
      const updated = await backfillUnnumberedMatches(
        this.prisma,
        dp.plan,
        dm,
      );
      rows = [
        ...rows.filter(
          (m) => !dm.some((d) => d.id === m.id),
        ),
        ...updated,
      ];
    }

    if (dto.action === 'reshuffle') {
      const active = findActiveDivisionPlan(divisionPlans, rows);
      if (!active) {
        throw new BadRequestException('Não há confronto para resortear');
      }
      const divMatches = matchesForDivision(rows, active.divisionLabel);
      const last = findLastRealTeamMatch(divMatches);
      if (!last) {
        throw new BadRequestException('Nenhum confronto com times definidos para resortear');
      }

      const confronto = parseConfrontoNum(last.bracketInfo);
      const slot = flattenBracketPlan(active.plan).find(
        (m) => m.confronto === confronto,
      );

      if (!slot?.homeTeam || !slot.awayTeam) {
        throw new BadRequestException(
          'Só é possível resortear confrontos com atléticas sorteadas',
        );
      }

      const pool = [
        ...active.teams.filter(
          (t) =>
            !teamsUsedInRealMatches(
              divMatches.filter((m) => m.id !== last.id),
            ).has(t),
        ),
      ];
      const pair = pickRandomPair(pool);
      if (!pair) {
        throw new BadRequestException('Não há atléticas disponíveis para resortear');
      }

      const updated = await this.prisma.match.update({
        where: { id: last.id },
        data: {
          homeTeam: pair[0],
          awayTeam: pair[1],
          bracketInfo: `Confronto ${confronto} · ${pair[0]} × ${pair[1]}`,
        },
        include: { modalidade: true, venue: true },
      });

      return {
        action: 'reshuffle',
        match: updated,
        pair: { home: pair[0], away: pair[1], round: updated.bracketRound, info: updated.bracketInfo },
        progress: getBracketDrawProgress(
          divisionPlans,
          rows.map((m) => (m.id === last.id ? { ...m, homeTeam: pair[0], awayTeam: pair[1], bracketInfo: updated.bracketInfo } : m)),
        ),
      };
    }

    const active = findActiveDivisionPlan(divisionPlans, rows);
    if (!active) {
      throw new BadRequestException('Chave já está completa para todas as divisões');
    }

    let divMatches = matchesForDivision(rows, active.divisionLabel);
    divMatches = await backfillUnnumberedMatches(
      this.prisma,
      active.plan,
      divMatches,
    );

    const occupied = occupiedConfrontoSlots(divMatches, active.plan);
    const next = findNextRealTeamPlannedMatch(active.plan, occupied);
    if (!next) {
      throw new BadRequestException('Não há próximo confronto nesta divisão');
    }

    let homeTeam: string | null;
    let awayTeam: string | null;
    try {
      ({ homeTeam, awayTeam } = resolveTeamsForPlannedMatch(
        next,
        active.teams,
        divMatches,
      ));
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Não há atléticas suficientes para o confronto',
      );
    }

    const bracketInfo = buildNumberedBracketInfo(
      next.confronto,
      homeTeam!,
      awayTeam!,
    );

    const created = await this.prisma.match.create({
      data: {
        modalidadeId: dto.modalidadeId,
        homeTeam,
        awayTeam,
        scheduledAt: new Date(),
        bracketRound: next.roundName,
        bracketInfo,
        status: 'scheduled',
      },
      include: { modalidade: true, venue: true },
    });

    const mergedRows: BracketMatchRow[] = [
      ...rows.map((m) => divMatches.find((d) => d.id === m.id) ?? m),
      created as BracketMatchRow,
    ];
    const progress = getBracketDrawProgress(divisionPlans, mergedRows);

    if (progress.isComplete) {
      await this.publishModalidade(dto.modalidadeId);
    }

    return {
      action: 'next',
      match: created,
      pair: {
        home: homeTeam ?? next.homeLabel,
        away: awayTeam ?? next.awayLabel,
        round: next.roundName,
        info: bracketInfo,
      },
      progress,
      published: progress.isComplete,
    };
  }

  @Post('draw')
  async draw(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: DrawBracketDto,
  ) {
    this.assertManage(req.user);
    await this.requireBracketModalidade(dto.modalidadeId);

    const fullBracket = dto.fullBracket !== false;

    if (fullBracket) {
      await this.prisma.match.deleteMany({
        where: {
          modalidadeId: dto.modalidadeId,
          bracketRound: { not: null },
        },
      });
    } else if (dto.clearPhase) {
      await this.prisma.match.deleteMany({
        where: {
          modalidadeId: dto.modalidadeId,
          bracketRound: dto.bracketRound,
        },
      });
    }

    const excluded = new Set(
      await getBracketExclusions(this.prisma, dto.modalidadeId),
    );
    const eligibleTeams = dto.teams.filter((t) => !excluded.has(t));

    const byDivision = new Map<string, string[]>();
    for (const team of eligibleTeams) {
      const division = await this.divisions.getTeamDivision(team);
      const list = byDivision.get(division) ?? [];
      list.push(team);
      byDivision.set(division, list);
    }

    const scheduledAt = new Date();
    const toCreate: {
      homeTeam: string | null;
      awayTeam: string | null;
      bracketRound: string;
      bracketInfo: string;
    }[] = [];

    for (const [division, teams] of byDivision) {
      if (teams.length < 2) continue;
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const basePlan = planEliminationBracket(shuffled);
      const divLabel = DIVISION_LABELS[division] ?? division;
      const plan =
        byDivision.size > 1
          ? planWithDivisionSuffix(basePlan, divLabel)
          : basePlan;

      for (const round of plan.rounds) {
        for (const m of round.matches) {
          toCreate.push({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            bracketRound: m.roundName,
            bracketInfo: m.bracketInfo,
          });
        }
      }
    }

    const created = await this.prisma.$transaction(
      toCreate.map((row) =>
        this.prisma.match.create({
          data: {
            modalidadeId: dto.modalidadeId,
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            scheduledAt,
            bracketRound: row.bracketRound,
            bracketInfo: row.bracketInfo,
            status: 'scheduled',
          },
          include: { modalidade: true, venue: true },
        }),
      ),
    );

    await this.publishModalidade(dto.modalidadeId);

    const skippedByExclusion = dto.teams.filter((t) => excluded.has(t));
    const pairs = toCreate.map((p) => ({
      home: p.homeTeam ?? '',
      away: p.awayTeam,
      round: p.bracketRound,
      info: p.bracketInfo,
    }));
    return {
      pairs,
      matches: created,
      skippedByExclusion,
      fullBracket,
    };
  }

  @Post('manual')
  async createManual(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: ManualBracketMatchDto,
  ) {
    this.assertManage(req.user);
    await this.requireBracketModalidade(dto.modalidadeId);
    await this.divisions.assertTeamsSameDivision([dto.homeTeam, dto.awayTeam]);

    const excluded = new Set(
      await getBracketExclusions(this.prisma, dto.modalidadeId),
    );
    const eligibleTeams = (dto.teams ?? [...ATLETICAS]).filter(
      (t) => !excluded.has(t),
    );
    const divisionPlans = await buildDivisionPlans(
      eligibleTeams,
      this.divisions,
    );

    const teamDiv = await this.divisions.getTeamDivision(dto.homeTeam);
    const active = divisionPlans.find((dp) => dp.division === teamDiv);
    if (!active) {
      throw new BadRequestException(
        'Não foi possível determinar a divisão deste confronto',
      );
    }

    const existing = await this.prisma.match.findMany({
      where: { modalidadeId: dto.modalidadeId, bracketRound: { not: null } },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        bracketRound: true,
        bracketInfo: true,
      },
    });
    let divMatches = matchesForDivision(
      existing as BracketMatchRow[],
      active.divisionLabel,
    );
    divMatches = await backfillUnnumberedMatches(
      this.prisma,
      active.plan,
      divMatches,
    );

    const slot = nextRealTeamSlot(active.plan, divMatches);
    if (!slot) {
      throw new BadRequestException(
        'Todos os confrontos com atléticas já foram definidos nesta divisão',
      );
    }

    const used = teamsUsedInRealMatches(divMatches);
    if (used.has(dto.homeTeam) || used.has(dto.awayTeam)) {
      throw new BadRequestException(
        'Uma das atléticas já está em outro confronto desta divisão',
      );
    }

    const bracketRound = dto.bracketRound.includes(active.divisionLabel)
      ? dto.bracketRound
      : slot.roundName;
    const bracketInfo =
      dto.bracketInfo ??
      buildNumberedBracketInfo(slot.confronto, dto.homeTeam, dto.awayTeam);

    const match = await this.prisma.match.create({
      data: {
        modalidadeId: dto.modalidadeId,
        homeTeam: dto.homeTeam,
        awayTeam: dto.awayTeam,
        scheduledAt: new Date(),
        bracketRound,
        bracketInfo,
        status: 'scheduled',
      },
      include: { modalidade: true, venue: true },
    });

    await this.publishModalidade(dto.modalidadeId);

    return match;
  }

  @Patch('publish')
  publish(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: PublishBracketDto,
  ) {
    this.assertManage(req.user);
    return this.prisma.modalidade.update({
      where: { id: dto.modalidadeId },
      data: { bracketPublished: dto.published },
    });
  }
}
