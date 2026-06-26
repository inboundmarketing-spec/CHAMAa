import { Module, forwardRef } from '@nestjs/common';
import { BotOrchestratorService } from './bot-orchestrator.service';
import { SessionService } from './session.service';
import { FlowRouterService } from './flow-router.service';
import { SportsFlowService } from './flows/sports-flow.service';
import { FestasFlowService } from './flows/festas-flow.service';
import { AlertsFlowService } from './flows/alerts-flow.service';
import { HelpFlowService } from './flows/help-flow.service';
import { HelpAiService } from './help/help-ai.service';
import { HelpKnowledgeService } from './help/help-knowledge.service';
import { HelpLlmService } from './help/help-llm.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InstagramModule } from '../instagram/instagram.module';
import { StandingsModule } from '../standings/standings.module';
import { GeoModule } from '../geo/geo.module';
import { AtleticaFlowService } from './flows/atletica-flow.service';
import { ChallengesFlowService } from './flows/challenges-flow.service';
import { AccommodationFlowService } from './flows/accommodation-flow.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WhatsappModule),
    forwardRef(() => InstagramModule),
    StandingsModule,
    GeoModule,
  ],
  providers: [
    BotOrchestratorService,
    SessionService,
    FlowRouterService,
    SportsFlowService,
    FestasFlowService,
    AlertsFlowService,
    AtleticaFlowService,
    ChallengesFlowService,
    AccommodationFlowService,
    HelpFlowService,
    HelpAiService,
    HelpKnowledgeService,
    HelpLlmService,
  ],
  exports: [BotOrchestratorService, HelpLlmService],
})
export class BotModule {}
