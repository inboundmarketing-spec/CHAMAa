import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAccessGuard } from '../auth/full-access.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/admin/broadcast-targets')
@UseGuards(JwtAuthGuard, FullAccessGuard)
export class AdminBroadcastController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.broadcastTarget.findMany();
  }

  @Post()
  create(
    @Body()
    dto: {
      waId: string;
      label: string;
      type?: string;
      active?: boolean;
    },
  ) {
    return this.prisma.broadcastTarget.create({
      data: {
        waId: dto.waId,
        label: dto.label,
        type: dto.type ?? 'group',
        active: dto.active ?? true,
      },
    });
  }
}
