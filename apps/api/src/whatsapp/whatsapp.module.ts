import { Module, forwardRef } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappInboundService } from './whatsapp-inbound.service';
import { DevWhatsAppProvider } from './providers/dev.provider';
import { CloudApiWhatsAppProvider } from './providers/cloud-api.provider';
import { EvolutionApiWhatsAppProvider } from './providers/evolution-api.provider';
import { BotModule } from '../bot/bot.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappGroupsService } from './whatsapp-groups.service';

@Module({
  imports: [PrismaModule, forwardRef(() => BotModule)],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    WhatsappGroupsService,
    WhatsappInboundService,
    DevWhatsAppProvider,
    CloudApiWhatsAppProvider,
    EvolutionApiWhatsAppProvider,
  ],
  exports: [WhatsappService, WhatsappInboundService, WhatsappGroupsService],
})
export class WhatsappModule {}
