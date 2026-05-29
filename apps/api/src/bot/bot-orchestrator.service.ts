import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { FlowRouterService } from './flow-router.service';
import { PrismaService } from '../prisma/prisma.service';
import { BOT_BUTTON_IDS } from '@chama/shared';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InstagramModerationService } from '../instagram/instagram-moderation.service';
import { evaluateActivation } from './bot-activation.util';

export interface IncomingMessage {
  waId: string;
  messageId: string;
  text: string;
  contactName?: string;
}

@Injectable()
export class BotOrchestratorService {
  private readonly logger = new Logger(BotOrchestratorService.name);

  constructor(
    private readonly session: SessionService,
    private readonly router: FlowRouterService,
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly instagram: InstagramModerationService,
  ) {}

  async handleIncomingMessage(msg: IncomingMessage): Promise<void> {
    const user = await this.session.ensureUser(msg.waId, msg.contactName);
    const existing = await this.session.peekSession(user.id);
    const isFirstSession = !existing;
    const previousLastAt = existing?.lastMessageAt ?? null;

    let session =
      existing ?? (await this.session.ensureSession(user.id));

    const input = msg.text?.trim() ?? '';

    if (session.mode === 'human') {
      await this.prisma.handoffMessage.create({
        data: {
          waUserId: user.id,
          direction: 'inbound',
          content: input || '(mídia ou botão)',
        },
      });
      await this.session.touchSession(user.id);
      return;
    }

    if (
      input.startsWith(BOT_BUTTON_IDS.IG_APPROVE) ||
      input.startsWith(BOT_BUTTON_IDS.IG_REJECT)
    ) {
      await this.session.touchSession(user.id);
      await this.instagram.handleModerationButton(input, msg.waId);
      return;
    }

    const activation = evaluateActivation({
      input,
      menuState: session.menuState,
      previousLastMessageAt: previousLastAt,
      isFirstSession,
    });

    await this.session.touchSession(user.id);

    if (activation.action === 'ignore') {
      this.logger.debug(`Mensagem ignorada (sem prefixo): ${msg.waId}`);
      return;
    }

    try {
      const welcomeWithMenu =
        activation.action === 'welcome' && activation.routeAfterWelcome;

      if (welcomeWithMenu) {
        await this.router.showRootMenu(msg.waId, user.id, {
          firstName: user.name,
        });
      } else if (activation.action === 'welcome') {
        await this.sendWelcome(msg.waId, user.name);
      }

      const shouldRoute =
        activation.action === 'route' ||
        (activation.action === 'welcome' && activation.routeAfterWelcome);

      if (shouldRoute && !welcomeWithMenu) {
        await this.router.route(msg.waId, user.id, input, session.menuState);
      }
    } catch (err) {
      this.logger.error('Erro no bot', err);
      await this.whatsapp.sendText({
        to: msg.waId,
        body: '⚠️ Ocorreu um erro. Tente novamente ou mande *Oi* / *Chaminha* para recomeçar.',
      });
    }
  }

  private async sendWelcome(waId: string, name?: string | null) {
    const greeting = name?.trim() ? `Oi, *${name.trim().split(' ')[0]}*! ` : 'Oi! ';
    await this.whatsapp.sendText({
      to: waId,
      body:
        `🔥 ${greeting}Eu sou a *Chaminha*, assistente do *Interunesp* no WhatsApp.\n\n` +
        'Te ajudo com *jogos*, *festas* e dúvidas do evento.\n\n' +
        'Para começar, mande *Oi*, *Chaminha* ou *🔥*.',
    });
  }
}
