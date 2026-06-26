import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InternalMatchesController } from './internal-matches.controller';
import { MatchAlertService } from './match-alert.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    WhatsappModule,
    BullModule.registerQueue({ name: 'match-alerts' }),
  ],
  controllers: [InternalMatchesController],
  providers: [MatchAlertService],
  exports: [MatchAlertService],
})
export class InternalModule {}
