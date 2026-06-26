import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  LocalGuidePlaceStatus,
  hasFullAccess,
} from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geo/geocoding.service';

class ReviewDto {
  @IsString()
  status!: string;
}

class AccommodationDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsArray()
  @IsString({ each: true })
  atleticaIds!: string[];

  @IsOptional()
  @IsString()
  mapUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminLocalPlacesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

  private assertManage(user: AdminRequestUser) {
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }
  }

  @Get('local-places')
  list(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.prisma.localGuidePlace.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Patch('local-places/:id/review')
  async review(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
    @Body() dto: ReviewDto,
  ) {
    this.assertManage(req.user);
    if (
      ![
        LocalGuidePlaceStatus.APPROVED,
        LocalGuidePlaceStatus.REJECTED,
        LocalGuidePlaceStatus.PENDING,
      ].includes(dto.status as LocalGuidePlaceStatus)
    ) {
      throw new ForbiddenException('Status inválido');
    }
    return this.prisma.localGuidePlace.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  @Get('accommodations')
  listAccommodations(@Req() req: { user: AdminRequestUser }) {
    this.assertManage(req.user);
    return this.prisma.accommodation.findMany({
      include: {
        atleticas: {
          include: {
            atletica: { include: { campus: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('accommodations')
  async upsertAccommodation(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: AccommodationDto,
  ) {
    this.assertManage(req.user);
    if (!dto.atleticaIds.length) {
      throw new ForbiddenException('Selecione ao menos uma atlética');
    }

    const geo = await this.geocoding.geocodeAddress(dto.address);

    if (dto.id) {
      await this.prisma.accommodationAtletica.deleteMany({
        where: { accommodationId: dto.id },
      });
      return this.prisma.accommodation.update({
        where: { id: dto.id },
        data: {
          name: dto.name,
          address: dto.address,
          mapUrl: dto.mapUrl,
          notes: dto.notes,
          imageUrls: dto.imageUrls ?? [],
          latitude: geo?.latitude,
          longitude: geo?.longitude,
          atleticas: {
            create: dto.atleticaIds.map((atleticaId) => ({ atleticaId })),
          },
        },
        include: {
          atleticas: {
            include: { atletica: { include: { campus: true } } },
          },
        },
      });
    }

    return this.prisma.accommodation.create({
      data: {
        name: dto.name,
        address: dto.address,
        mapUrl: dto.mapUrl,
        notes: dto.notes,
        imageUrls: dto.imageUrls ?? [],
        latitude: geo?.latitude,
        longitude: geo?.longitude,
        atleticas: {
          create: dto.atleticaIds.map((atleticaId) => ({ atleticaId })),
        },
      },
      include: {
        atleticas: {
          include: { atletica: { include: { campus: true } } },
        },
      },
    });
  }
}
