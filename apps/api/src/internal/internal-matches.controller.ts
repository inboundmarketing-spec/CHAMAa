import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MesarioApiGuard } from './mesario-api.guard';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { liveStatusPatch } from '../admin/match-live.util';
import {
  recordGameEndedAt,
  recordGameStartedAt,
} from '../admin/match-incident.service';

class MatchParticipantDto {
  @IsString()
  team!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  placement?: number;
}

class PatchMatchDto {
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
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchParticipantDto)
  participants?: MatchParticipantDto[];
}

class MatchEventDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsInt()
  minute?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('internal/matches')
@UseGuards(MesarioApiGuard)
export class InternalMatchesController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('match-alerts') private readonly alertQueue: Queue,
  ) {}

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchMatchDto) {
    const before = await this.prisma.match.findUnique({ where: { id } });

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
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          status: dto.status,
          venueId: dto.venueId,
          ...livePatch,
        },
        include: {
          modalidade: true,
          venue: true,
          participants: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    if (dto.status === 'live' && before?.status !== 'live') {
      await recordGameStartedAt(this.prisma, id);
    }

    if (dto.status === 'finished' && before?.status !== 'finished') {
      await recordGameEndedAt(this.prisma, id);
    }

    await this.alertQueue.add('match-updated', {
      matchId: id,
      venueChanged: dto.venueId !== undefined && before?.venueId !== dto.venueId,
      statusChanged: dto.status,
      scoreChanged:
        dto.homeScore !== undefined ||
        dto.awayScore !== undefined ||
        dto.participants !== undefined,
    });

    return updated;
  }

  @Post(':id/events')
  async addEvent(@Param('id') id: string, @Body() dto: MatchEventDto) {
    const event = await this.prisma.matchEvent.create({
      data: {
        matchId: id,
        type: dto.type,
        team: dto.team,
        minute: dto.minute,
        note: dto.note,
      },
    });

    if (dto.type === 'goal' && dto.team === 'home') {
      await this.prisma.match.update({
        where: { id },
        data: { homeScore: { increment: 1 } },
      });
    } else if (dto.type === 'goal' && dto.team === 'away') {
      await this.prisma.match.update({
        where: { id },
        data: { awayScore: { increment: 1 } },
      });
    }

    await this.alertQueue.add('match-updated', {
      matchId: id,
      scoreChanged: dto.type === 'goal',
    });

    return event;
  }
}
