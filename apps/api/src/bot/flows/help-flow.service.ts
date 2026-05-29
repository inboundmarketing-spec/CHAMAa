import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BOT_BUTTON_IDS, BotMenuState } from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';
import { HelpAiService, HelpTurn } from '../help/help-ai.service';
import { FlowRouterService } from '../flow-router.service';

@Injectable()
export class HelpFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
    private readonly ai: HelpAiService,
    @Inject(forwardRef(() => FlowRouterService))
    private readonly router: FlowRouterService,
  ) {}

  async startHelp(waId: string, waUserId: string) {
    await this.closeActiveSessions(waUserId);
    await this.prisma.helpSession.create({
      data: { waUserId, status: 'active', history: [] },
    });

    await this.session.setMenuState(waUserId, BotMenuState.HELP_ACTIVE);
    await this.whatsapp.sendReplyButtons(
      waId,
      '💬 *Ajuda*\n\n' +
        'Escreva sua dúvida sobre o *Interunesp* — jogos, festas, horários…\n\n' +
        '_Respondo com base nas informações do evento. Toque em *Encerrar* quando terminar._',
      [
        { id: BOT_BUTTON_IDS.HELP_DONE, title: '✅ Encerrar' },
        { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
      ],
    );
  }

  async handle(waId: string, waUserId: string, input: string, menuState: string) {
    switch (input) {
      case BOT_BUTTON_IDS.HELP_DONE:
        return this.startFeedback(waId, waUserId);
      case BOT_BUTTON_IDS.HELP_RESOLVED_YES:
        return this.afterResolved(waId, waUserId, true);
      case BOT_BUTTON_IDS.HELP_RESOLVED_NO:
        return this.afterResolved(waId, waUserId, false);
      case BOT_BUTTON_IDS.HELP_SKIP_SUGGESTION:
        return this.finishFeedback(waId, waUserId, null);
      case BOT_BUTTON_IDS.HELP_SUGGESTION:
        return this.startSuggestion(waId, waUserId);
      case BOT_BUTTON_IDS.SOS:
        await this.closeActiveSessions(waUserId);
        await this.session.setMenuState(waUserId, BotMenuState.ROOT);
        return this.router.triggerLieuSos(waId, waUserId);
      case BOT_BUTTON_IDS.BACK:
        return this.cancelHelp(waId, waUserId);
      default:
        break;
    }

    if (menuState === BotMenuState.HELP_FEEDBACK) {
      return this.whatsapp.sendReplyButtons(
        waId,
        '✨ *Antes de ir*\n\nConsegui te ajudar com sua dúvida?',
        [
          { id: BOT_BUTTON_IDS.HELP_RESOLVED_YES, title: '✅ Deu certo' },
          { id: BOT_BUTTON_IDS.HELP_RESOLVED_NO, title: '❌ Ainda não' },
          { id: BOT_BUTTON_IDS.HELP_SUGGESTION, title: '💡 Sugestão' },
        ],
      );
    }

    if (menuState === BotMenuState.HELP_SUGGESTION) {
      const text = input.trim();
      if (!text) {
        return this.startSuggestion(waId, waUserId);
      }
      return this.finishFeedback(waId, waUserId, text);
    }

    if (menuState === BotMenuState.HELP_ACTIVE) {
      return this.handleQuestion(waId, waUserId, input);
    }

    return this.startHelp(waId, waUserId);
  }

  private async handleQuestion(waId: string, waUserId: string, question: string) {
    const helpSession = await this.getActiveSession(waUserId);
    if (!helpSession) {
      await this.startHelp(waId, waUserId);
      return;
    }

    const history = (helpSession.history as HelpTurn[]) ?? [];
    history.push({ role: 'user', content: question });

    const { answer } = await this.ai.answer(question, history);
    history.push({ role: 'assistant', content: answer });

    await this.prisma.helpSession.update({
      where: { id: helpSession.id },
      data: { history },
    });

    await this.whatsapp.sendText({ to: waId, body: answer });
  }

  private async startFeedback(waId: string, waUserId: string) {
    const helpSession = await this.getActiveSession(waUserId);
    if (!helpSession) {
      return this.router.showRootMenu(waId, waUserId);
    }

    await this.prisma.helpSession.update({
      where: { id: helpSession.id },
      data: { status: 'closed', closedAt: new Date() },
    });

    await this.session.setMenuState(waUserId, BotMenuState.HELP_FEEDBACK);
    await this.whatsapp.sendReplyButtons(
      waId,
      '✨ *Antes de ir*\n\nConsegui te ajudar com sua dúvida?',
      [
        { id: BOT_BUTTON_IDS.HELP_RESOLVED_YES, title: '✅ Deu certo' },
        { id: BOT_BUTTON_IDS.HELP_RESOLVED_NO, title: '❌ Ainda não' },
        { id: BOT_BUTTON_IDS.HELP_SUGGESTION, title: '💡 Sugestão' },
      ],
    );
  }

  private async startSuggestion(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.HELP_SUGGESTION);
    await this.whatsapp.sendReplyButtons(
      waId,
      '💬 *Sua sugestão*\n\nEscreva em uma mensagem o que podemos melhorar:',
      [{ id: BOT_BUTTON_IDS.HELP_SKIP_SUGGESTION, title: '⏭️ Encerrar' }],
    );
  }

  private async afterResolved(waId: string, waUserId: string, resolved: boolean) {
    const helpSession = await this.prisma.helpSession.findFirst({
      where: { waUserId, status: 'closed' },
      orderBy: { closedAt: 'desc' },
    });
    if (!helpSession) {
      return this.router.showRootMenu(waId, waUserId);
    }

    await this.prisma.helpFeedback.upsert({
      where: { helpSessionId: helpSession.id },
      create: {
        helpSessionId: helpSession.id,
        waUserId,
        resolved,
      },
      update: { resolved },
    });

    if (resolved) {
      return this.finishFeedback(waId, waUserId, null, 'positive');
    }

    await this.session.setMenuState(waUserId, BotMenuState.HELP_SUGGESTION);
    await this.whatsapp.sendReplyButtons(
      waId,
      '💬 *Poxa, sinto não ter resolvido.*\n\n' +
        'Se quiser, escreva o que faltou (opcional).\n' +
        'Ou fale direto com a *Lieu*:',
      [
        { id: BOT_BUTTON_IDS.SOS, title: '🆘 Lieu' },
        { id: BOT_BUTTON_IDS.HELP_SKIP_SUGGESTION, title: '⏭️ Encerrar' },
      ],
    );
  }

  private async finishFeedback(
    waId: string,
    waUserId: string,
    suggestion: string | null,
    tone: 'positive' | 'neutral' = 'neutral',
  ) {
    const helpSession = await this.prisma.helpSession.findFirst({
      where: { waUserId, status: 'closed' },
      orderBy: { closedAt: 'desc' },
    });

    if (helpSession && suggestion) {
      await this.prisma.helpFeedback.upsert({
        where: { helpSessionId: helpSession.id },
        create: {
          helpSessionId: helpSession.id,
          waUserId,
          suggestion,
        },
        update: { suggestion },
      });
    }

    await this.session.setMenuState(waUserId, BotMenuState.ROOT);

    let body: string;
    if (suggestion) {
      body = '🔥 *Obrigada pela sugestão!*\n\nVou levar seu retorno em conta. Até a próxima! 👋';
    } else if (tone === 'positive') {
      body =
        '🔥 *Que bom que deu certo!*\n\n' +
        'Se precisar de mim de novo, é só abrir *Ajuda* no menu. Até! 👋';
    } else {
      body =
        '🔥 *Sem problemas.*\n\n' +
        'Estou por aqui no menu *Ajuda* quando precisar. Até! 👋';
    }

    await this.whatsapp.sendReplyButtons(waId, body, [
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  private async cancelHelp(waId: string, waUserId: string) {
    await this.closeActiveSessions(waUserId);
    return this.router.showRootMenu(waId, waUserId);
  }

  private async getActiveSession(waUserId: string) {
    return this.prisma.helpSession.findFirst({
      where: { waUserId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async closeActiveSessions(waUserId: string) {
    await this.prisma.helpSession.updateMany({
      where: { waUserId, status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });
  }
}
