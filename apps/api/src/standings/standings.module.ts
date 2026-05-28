import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoModule } from '../geo/geo.module';
import { StandingsService } from '../admin/standings.service';
import { MatchPointsService } from '../admin/match-points.service';
import { DivisionService } from '../admin/division.service';

@Module({
  imports: [PrismaModule, GeoModule],
  providers: [StandingsService, MatchPointsService, DivisionService],
  exports: [StandingsService, MatchPointsService, DivisionService],
})
export class StandingsModule {}
