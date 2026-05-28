import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LocalGuidePlaceStatus,
  LocalGuidePlaceType,
  sortByDistance,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProximityService {
  constructor(private readonly prisma: PrismaService) {}

  async findNearestFromCampus(
    campusId: string,
    type: LocalGuidePlaceType,
    limit = 5,
  ) {
    const atletica = await this.prisma.atletica.findFirst({
      where: { campusId },
      select: { id: true },
    });
    if (!atletica) {
      throw new NotFoundException('Atlética não encontrada para este campus');
    }
    return this.findNearestFromAtletica(atletica.id, type, limit);
  }

  async findNearestFromAtletica(
    atleticaId: string,
    type: LocalGuidePlaceType,
    limit = 5,
  ) {
    const link = await this.prisma.accommodationAtletica.findFirst({
      where: { atleticaId },
      include: { accommodation: true },
    });
    const accommodation = link?.accommodation;
    if (!accommodation?.latitude || !accommodation?.longitude) {
      throw new NotFoundException(
        'Alojamento sem coordenadas. Cadastre o endereço no painel.',
      );
    }

    const places = await this.prisma.localGuidePlace.findMany({
      where: {
        type,
        status: LocalGuidePlaceStatus.APPROVED,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    return sortByDistance(
      {
        latitude: accommodation.latitude,
        longitude: accommodation.longitude,
      },
      places.map((p) => ({
        ...p,
        latitude: p.latitude!,
        longitude: p.longitude!,
      })),
    ).slice(0, limit);
  }

  async findNearestFromCoords(
    lat: number,
    lng: number,
    type: LocalGuidePlaceType,
    limit = 5,
  ) {
    const places = await this.prisma.localGuidePlace.findMany({
      where: {
        type,
        status: LocalGuidePlaceStatus.APPROVED,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    return sortByDistance(
      { latitude: lat, longitude: lng },
      places.map((p) => ({
        ...p,
        latitude: p.latitude!,
        longitude: p.longitude!,
      })),
    ).slice(0, limit);
  }
}
