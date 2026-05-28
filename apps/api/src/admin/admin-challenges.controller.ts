import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CHALLENGE_TYPES,
  ChallengeType,
  challengeTypeLabel,
  hasFullAccess,
} from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeDivisionService } from './challenge-division.service';

class SetChallengeDivisionDto {
  @IsString()
  atleticaId!: string;

  @IsString()
  challengeType!: string;

  @IsString()
  division!: string;
}

class ChallengeDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  challengeType?: string;

  @IsOptional()
  @IsString()
  atleticaId?: string;

  @IsOptional()
  @IsString()
  campusId?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  locationName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  mapUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertChallengeEventDto {
  @IsString()
  challengeType!: string;

  @IsString()
  title!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  locationName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('api/admin/challenges')
@UseGuards(JwtAuthGuard)
export class AdminChallengesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly challengeDivisions: ChallengeDivisionService,
  ) {}

  private assertManage(user: AdminRequestUser) {
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }
  }

  @Get()
  list(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.prisma.challenge.findMany({
      where: {
        OR: [
          { challengeType: { in: [...CHALLENGE_TYPES] } },
          { challengeType: null },
        ],
      },
      include: {
        atletica: { include: { campus: true } },
        campus: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  @Put('event')
  upsertEvent(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: UpsertChallengeEventDto,
  ) {
    this.assertManage(req.user);
    if (
      dto.challengeType !== ChallengeType.BATTERY &&
      dto.challengeType !== ChallengeType.CHEER
    ) {
      throw new ForbiddenException('Tipo de desafio inválido');
    }
    const title = dto.title || challengeTypeLabel(dto.challengeType);
    return this.prisma.challenge.upsert({
      where: { challengeType: dto.challengeType },
      create: {
        challengeType: dto.challengeType,
        title,
        scheduledAt: new Date(dto.scheduledAt),
        locationName: dto.locationName,
        address: dto.address,
        description: dto.description,
      },
      update: {
        title,
        scheduledAt: new Date(dto.scheduledAt),
        locationName: dto.locationName,
        address: dto.address,
        description: dto.description,
      },
    });
  }

  @Post()
  create(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: ChallengeDto,
  ) {
    this.assertManage(req.user);
    return this.prisma.challenge.create({
      data: {
        ...dto,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });
  }

  @Get('divisions')
  listDivisions(
    @Req() req: { user: AdminRequestUser },
    @Query('type') type: string,
  ) {
    this.assertManage(req.user);
    return this.challengeDivisions.list(type);
  }

  @Patch('divisions')
  setDivision(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: SetChallengeDivisionDto,
  ) {
    this.assertManage(req.user);
    return this.challengeDivisions.setDivision(
      dto.atleticaId,
      dto.challengeType,
      dto.division,
    );
  }

  @Patch(':id')
  update(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: Partial<ChallengeDto>,
  ) {
    this.assertManage(req.user);
    return this.prisma.challenge.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : undefined,
      },
    });
  }

  @Delete(':id')
  remove(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    this.assertManage(req.user);
    return this.prisma.challenge.delete({ where: { id } });
  }
}
