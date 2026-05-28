import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AtleticaDivisionTier, hasFullAccess } from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { Req } from '@nestjs/common';
import { DivisionService } from './division.service';

class SetDivisionDto {
  @IsString()
  atleticaId!: string;

  @IsString()
  division!: string;
}

class CloseDayDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  dayIndex?: number;
}

@Controller('api/admin/inter')
@UseGuards(JwtAuthGuard)
export class AdminInterController {
  constructor(private readonly divisions: DivisionService) {}

  private assertManage(user: AdminRequestUser) {
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito à mesa/criativa');
    }
  }

  @Get()
  getState(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.divisions.getEdition();
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

  @Post('close-day')
  closeDay(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: CloseDayDto,
  ) {
    this.assertManage(req.user);
    return this.divisions.closeGameDay(dto.dayIndex);
  }

  @Post('close')
  closeInter(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.divisions.closeInter();
  }
}
