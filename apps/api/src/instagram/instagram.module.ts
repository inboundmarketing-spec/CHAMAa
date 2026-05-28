import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { InstagramModerationService } from './instagram-moderation.service';

@Module({
  imports: [
    forwardRef(() => WhatsappModule),
    BullModule.registerQueue({ name: 'instagram-dispatch' }),
  ],
  providers: [InstagramModerationService],
  exports: [InstagramModerationService],
})
export class InstagramModule {}
