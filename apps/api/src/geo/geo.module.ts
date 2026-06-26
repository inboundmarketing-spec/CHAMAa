import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { ProximityService } from './proximity.service';

@Module({
  providers: [GeocodingService, ProximityService],
  exports: [GeocodingService, ProximityService],
})
export class GeoModule {}
