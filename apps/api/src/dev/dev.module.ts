import { Module } from '@nestjs/common';
import { DevSimulatorController } from './dev-simulator.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BotModule } from '../bot/bot.module';
import { SessionService } from '../bot/session.service';

@Module({
  imports: [WhatsappModule, PrismaModule, BotModule],
  controllers: [DevSimulatorController],
  providers: [SessionService],
})
export class DevModule {}
