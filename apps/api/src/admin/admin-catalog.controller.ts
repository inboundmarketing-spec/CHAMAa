import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAccessGuard } from '../auth/full-access.guard';
import { AdminRequestUser, canManageVenues } from '../auth/admin-permissions';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/admin/catalog')
@UseGuards(JwtAuthGuard)
export class AdminCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('campi')
  campi() {
    return this.prisma.campus.findMany({ include: { atleticas: true } });
  }

  @Post('campi')
  createCampus(@Body() dto: { name: string; slug: string }) {
    return this.prisma.campus.create({ data: dto });
  }

  @Post('atleticas')
  createAtletica(@Body() dto: { name: string; campusId: string }) {
    return this.prisma.atletica.create({ data: dto });
  }

  @Get('modalidades')
  modalidades() {
    return this.prisma.modalidade.findMany({
      where: {
        OR: [
          { slug: { endsWith: '-masculino' } },
          { slug: { endsWith: '-feminino' } },
        ],
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }, { gender: 'asc' }],
    });
  }

  @Get('venues')
  venues() {
    return this.prisma.venue.findMany({
      include: { _count: { select: { matches: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('venues')
  createVenue(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: { name: string; address: string; mapUrl?: string },
  ) {
    if (!canManageVenues(req.user.role)) {
      throw new ForbiddenException('Você não pode cadastrar praças esportivas');
    }
    return this.prisma.venue.create({ data: dto });
  }

  @Patch('venues/:id')
  updateVenue(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: { name?: string; address?: string; mapUrl?: string },
  ) {
    if (!canManageVenues(req.user.role)) {
      throw new ForbiddenException('Você não pode editar praças esportivas');
    }
    return this.prisma.venue.update({ where: { id }, data: dto });
  }

  @Get('locations')
  locations() {
    return this.prisma.location.findMany();
  }

  @Post('locations')
  createLocation(
    @Body() dto: { name: string; address: string; mapUrl?: string },
  ) {
    return this.prisma.location.create({ data: dto });
  }

  @Patch('locations/:id')
  updateLocation(
    @Param('id') id: string,
    @Body() dto: { name?: string; address?: string; mapUrl?: string },
  ) {
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  @Get('segments')
  segments() {
    return this.prisma.segment.findMany();
  }

  @Post('segments')
  createSegment(
    @Body() dto: { name: string; slug: string; description?: string },
  ) {
    return this.prisma.segment.create({ data: dto });
  }
}
