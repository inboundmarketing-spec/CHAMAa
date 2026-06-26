import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { AtleticaDivisionTier, hasFullAccess } from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAccessGuard } from '../auth/full-access.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { StandingsService } from './standings.service';
import { DivisionService } from './division.service';

class SetDivisionDto {
  @IsString()
  atleticaId!: string;

  @IsString()
  division!: string;
}

@Controller('api/admin/standings')
@UseGuards(JwtAuthGuard)
export class AdminStandingsController {
  constructor(
    private readonly standings: StandingsService,
    private readonly divisions: DivisionService,
  ) {}

  private assertManage(user: AdminRequestUser) {
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito à mesa/criativa');
    }
  }

  @Get()
  async list() {
    const { first, second, updatedAt } =
      await this.standings.listByDivisions();
    return { first, second, all: [...first, ...second], updatedAt };
  }

  @Post('recalculate')
  @UseGuards(FullAccessGuard)
  recalculate() {
    return this.standings.recalculateFromMatches();
  }

  @Get('divisions')
  listDivisions(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.divisions.listDivisions();
  }

  @Patch('divisions')
  setDivision(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: SetDivisionDto,
  ) {
    this.assertManage(req.user);
    if (
      dto.division !== AtleticaDivisionTier.FIRST &&
      dto.division !== AtleticaDivisionTier.SECOND
    ) {
      throw new ForbiddenException('Divisão inválida');
    }
    return this.divisions.setDivision(dto.atleticaId, dto.division);
  }
}
