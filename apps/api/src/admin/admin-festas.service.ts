import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { deleteFestasFileByUrl } from './festas-media.util';

const HOURS_PER_DAY = 12;

export class UpdateFestivalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  mapUrl?: string | null;

  @IsOptional()
  @IsString()
  passportPurchaseUrl?: string | null;

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsOptional()
  @IsString()
  promoVideoUrl?: string | null;

  @IsOptional()
  @IsString()
  promoImageUrl?: string | null;
}

export class FestivalDayDto {
  @IsInt()
  @Min(1)
  @Max(3)
  dayIndex!: number;

  @IsString()
  title!: string;

  @IsDateString()
  startsAt!: string;
}

export class UpdateFestivalDayDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;
}

export class FestivalArtistDto {
  @IsString()
  name!: string;

  @IsIn(['headliner', 'supporting'])
  role!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  setStartsAt?: string;
}

export class UpdateFestivalArtistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['headliner', 'supporting'])
  role?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  setStartsAt?: string | null;
}

function endsAtFromStart(startsAt: Date) {
  return new Date(startsAt.getTime() + HOURS_PER_DAY * 60 * 60 * 1000);
}

@Injectable()
export class AdminFestasService {
  constructor(private readonly prisma: PrismaService) {}

  async getFestival() {
    let festival = await this.prisma.festival.findFirst({
      include: this.fullInclude(),
      orderBy: { createdAt: 'asc' },
    });
    if (!festival) {
      festival = await this.prisma.festival.create({
        data: { name: 'Interunesp' },
        include: this.fullInclude(),
      });
    }
    return festival;
  }

  async updateFestival(dto: UpdateFestivalDto) {
    const festival = await this.getFestival();
    return this.prisma.festival.update({
      where: { id: festival.id },
      data: dto,
      include: this.fullInclude(),
    });
  }

  async createDay(dto: FestivalDayDto) {
    const festival = await this.getFestival();
    const startsAt = new Date(dto.startsAt);
    const existing = await this.prisma.festivalDay.findUnique({
      where: {
        festivalId_dayIndex: {
          festivalId: festival.id,
          dayIndex: dto.dayIndex,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`Dia ${dto.dayIndex} já cadastrado`);
    }

    return this.prisma.festivalDay.create({
      data: {
        festivalId: festival.id,
        dayIndex: dto.dayIndex,
        title: dto.title,
        startsAt,
        endsAt: endsAtFromStart(startsAt),
      },
      include: { artists: { orderBy: { sortOrder: 'asc' } }, media: true },
    });
  }

  async updateDay(id: string, dto: UpdateFestivalDayDto) {
    const day = await this.prisma.festivalDay.findUnique({ where: { id } });
    if (!day) throw new NotFoundException('Dia não encontrado');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : day.startsAt;
    return this.prisma.festivalDay.update({
      where: { id },
      data: {
        title: dto.title,
        startsAt: dto.startsAt ? startsAt : undefined,
        endsAt: dto.startsAt ? endsAtFromStart(startsAt) : undefined,
      },
      include: { artists: { orderBy: { sortOrder: 'asc' } }, media: true },
    });
  }

  async deleteDay(id: string) {
    const day = await this.prisma.festivalDay.findUnique({
      where: { id },
      include: { media: true, artists: { include: { media: true } } },
    });
    if (!day) throw new NotFoundException('Dia não encontrado');

    for (const m of day.media) await deleteFestasFileByUrl(m.url);
    for (const a of day.artists) {
      for (const m of a.media) await deleteFestasFileByUrl(m.url);
    }

    await this.prisma.festivalDay.delete({ where: { id } });
    return { deleted: true };
  }

  async createArtist(dayId: string, dto: FestivalArtistDto) {
    const day = await this.prisma.festivalDay.findUnique({ where: { id: dayId } });
    if (!day) throw new NotFoundException('Dia não encontrado');

    if (dto.role === 'headliner') {
      const existing = await this.prisma.festivalArtist.findFirst({
        where: { festivalDayId: dayId, role: 'headliner' },
      });
      if (existing) {
        throw new BadRequestException(
          'Este dia já tem um headliner. Edite ou remova o atual.',
        );
      }
    }

    return this.prisma.festivalArtist.create({
      data: {
        festivalDayId: dayId,
        name: dto.name,
        role: dto.role,
        sortOrder: dto.sortOrder ?? 0,
        setStartsAt: dto.setStartsAt ? new Date(dto.setStartsAt) : null,
      },
      include: { media: true },
    });
  }

  async updateArtist(id: string, dto: UpdateFestivalArtistDto) {
    const artist = await this.prisma.festivalArtist.findUnique({
      where: { id },
    });
    if (!artist) throw new NotFoundException('Artista não encontrado');

    if (dto.role === 'headliner' && artist.role !== 'headliner') {
      const existing = await this.prisma.festivalArtist.findFirst({
        where: {
          festivalDayId: artist.festivalDayId,
          role: 'headliner',
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException('Este dia já tem um headliner');
      }
    }

    return this.prisma.festivalArtist.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        sortOrder: dto.sortOrder,
        setStartsAt:
          dto.setStartsAt === null
            ? null
            : dto.setStartsAt
              ? new Date(dto.setStartsAt)
              : undefined,
      },
      include: { media: true },
    });
  }

  async deleteArtist(id: string) {
    const artist = await this.prisma.festivalArtist.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!artist) throw new NotFoundException('Artista não encontrado');

    for (const m of artist.media) await deleteFestasFileByUrl(m.url);
    await this.prisma.festivalArtist.delete({ where: { id } });
    return { deleted: true };
  }

  async addMedia(params: {
    scope: 'festival' | 'day' | 'artist';
    targetId: string;
    type: 'image' | 'video' | 'link';
    url: string;
    caption?: string;
  }) {
    const data: {
      type: string;
      url: string;
      caption?: string;
      festivalId?: string;
      festivalDayId?: string;
      festivalArtistId?: string;
    } = {
      type: params.type,
      url: params.url,
      caption: params.caption,
    };

    if (params.scope === 'festival') {
      const festival = await this.prisma.festival.findUnique({
        where: { id: params.targetId },
      });
      if (!festival) throw new NotFoundException('Festival não encontrado');
      data.festivalId = festival.id;

      if (params.type === 'video') {
        await this.prisma.festival.update({
          where: { id: festival.id },
          data: { promoVideoUrl: params.url, promoImageUrl: null },
        });
      } else {
        await this.prisma.festival.update({
          where: { id: festival.id },
          data: { promoImageUrl: params.url },
        });
      }
    } else if (params.scope === 'day') {
      const day = await this.prisma.festivalDay.findUnique({
        where: { id: params.targetId },
      });
      if (!day) throw new NotFoundException('Dia não encontrado');
      data.festivalDayId = day.id;
    } else {
      const artist = await this.prisma.festivalArtist.findUnique({
        where: { id: params.targetId },
      });
      if (!artist) throw new NotFoundException('Artista não encontrado');
      data.festivalArtistId = artist.id;
    }

    return this.prisma.festivalMedia.create({ data });
  }

  async deleteMedia(id: string) {
    const media = await this.prisma.festivalMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Mídia não encontrada');

    await deleteFestasFileByUrl(media.url);

    if (media.type !== 'link' && media.festivalId) {
      const festival = await this.prisma.festival.findUnique({
        where: { id: media.festivalId },
      });
      if (festival?.promoVideoUrl === media.url) {
        await this.prisma.festival.update({
          where: { id: festival.id },
          data: { promoVideoUrl: null },
        });
      }
      if (festival?.promoImageUrl === media.url) {
        await this.prisma.festival.update({
          where: { id: festival.id },
          data: { promoImageUrl: null },
        });
      }
    }

    await this.prisma.festivalMedia.delete({ where: { id } });
    return { deleted: true };
  }

  private fullInclude() {
    return {
      location: true,
      days: {
        orderBy: { dayIndex: 'asc' as const },
        include: {
          artists: {
            orderBy: { sortOrder: 'asc' as const },
            include: { media: { orderBy: { sortOrder: 'asc' as const } } },
          },
          media: { orderBy: { sortOrder: 'asc' as const } },
        },
      },
      media: { orderBy: { sortOrder: 'asc' as const } },
    };
  }
}
