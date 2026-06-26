import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { InstagramModule } from '../instagram/instagram.module';
import { AdminMatchesController } from './admin-matches.controller';
import { AdminFestasController } from './admin-festas.controller';
import { AdminFestasService } from './admin-festas.service';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { AdminHandoffController } from './admin-handoff.controller';
import { AdminInstagramController } from './admin-instagram.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { AdminWhatsappGroupsController } from './admin-whatsapp-groups.controller';
import { HandoffService } from './handoff.service';
import { CampaignService } from './campaign.service';
import { AdminConfirmationsController } from './admin-confirmations.controller';
import { AdminHelpController } from './admin-help.controller';
import { AdminHelpService } from './admin-help.service';
import { AdminAuthorizationsController } from './admin-authorizations.controller';
import { AdminStandingsController } from './admin-standings.controller';
import { AdminInterController } from './admin-inter.controller';
import { AdminChallengesController } from './admin-challenges.controller';
import { ChallengeDivisionService } from './challenge-division.service';
import { AdminLocalPlacesController } from './admin-local-places.controller';
import { AdminBracketController } from './admin-bracket.controller';
import { StandingsModule } from '../standings/standings.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [
    AuthModule,
    WhatsappModule,
    InstagramModule,
    StandingsModule,
    GeoModule,
    BullModule.registerQueue(
      { name: 'campaigns' },
      { name: 'match-alerts' },
    ),
  ],
  controllers: [
    AdminMatchesController,
    AdminFestasController,
    AdminCampaignsController,
    AdminHandoffController,
    AdminInstagramController,
    AdminDashboardController,
    AdminCatalogController,
    AdminBroadcastController,
    AdminWhatsappGroupsController,
    AdminHelpController,
    AdminConfirmationsController,
    AdminAuthorizationsController,
    AdminStandingsController,
    AdminInterController,
    AdminChallengesController,
    AdminLocalPlacesController,
    AdminBracketController,
  ],
  providers: [
    HandoffService,
    CampaignService,
    AdminHelpService,
    AdminFestasService,
    ChallengeDivisionService,
  ],
})
export class AdminModule {}
