import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CampaignProcessor } from './campaign.processor';
import { MatchAlertProcessor } from './match-alert.processor';
import { InstagramDispatchProcessor } from './instagram-dispatch.processor';
import { InstagramPollScheduler } from './instagram-poll.scheduler';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { InternalModule } from '../internal/internal.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [
    WhatsappModule,
    InternalModule,
    InstagramModule,
    BullModule.registerQueue(
      { name: 'campaigns' },
      { name: 'match-alerts' },
      { name: 'instagram-dispatch' },
    ),
  ],
  providers: [
    CampaignProcessor,
    MatchAlertProcessor,
    InstagramDispatchProcessor,
    InstagramPollScheduler,
  ],
})
export class WorkersModule {}
