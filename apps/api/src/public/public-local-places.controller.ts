import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import {
  IsArray,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { LocalGuidePlaceStatus, LocalGuidePlaceType } from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geo/geocoding.service';

class SubmitLocalPlaceDto {
  @IsString()
  @IsIn([
    LocalGuidePlaceType.MARMITA,
    LocalGuidePlaceType.PHARMACY,
    LocalGuidePlaceType.HOSPITAL,
    LocalGuidePlaceType.FAST_FOOD,
  ])
  type!: string;

  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  menuUrl?: string;

  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  submittedBy?: string;
}

@Controller('api/public/local-places')
export class PublicLocalPlacesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

  @Post()
  async submit(@Body() dto: SubmitLocalPlaceDto) {
    if (dto.type === LocalGuidePlaceType.SPORTS_SQUARE) {
      throw new ForbiddenException(
        'Praças esportivas são cadastradas apenas pela organização do Inter',
      );
    }
    const geo = await this.geocoding.geocodeAddress(dto.address);
    return this.prisma.localGuidePlace.create({
      data: {
        type: dto.type,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        siteUrl: dto.siteUrl,
        menuUrl: dto.menuUrl,
        imageUrls: dto.imageUrls ?? [],
        submittedBy: dto.submittedBy,
        status: LocalGuidePlaceStatus.PENDING,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
      },
    });
  }
}
