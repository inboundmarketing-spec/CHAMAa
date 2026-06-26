import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoModule } from '../geo/geo.module';
import { PublicLocalPlacesController } from './public-local-places.controller';

@Module({
  imports: [PrismaModule, GeoModule],
  controllers: [PublicLocalPlacesController],
})
export class PublicModule {}
