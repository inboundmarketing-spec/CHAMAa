import { Injectable } from '@nestjs/common';
import {
  ALERT_ATLETICA_TOGGLE_PREFIX,
  BOT_BUTTON_IDS,
  BotMenuState,
} from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';

@Injectable()
export class AlertsFlowService {
  private static readonly ATLETICA_PAGE_SIZE = 9;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
  ) {}

  async showAlertsMenu(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ALERTS);
    const optIn = await this.prisma.notificationOptIn.findUnique({
      where: {
        waUserId_segment: { waUserId, segment: 'general' },
      },
    });

    const sportsCount = await this.prisma.sportsAlertAtletica.count({
      where: { waUserId },
    });

    const status = optIn?.active
      ? '✅ Você está recebendo avisos gerais no PV.'
      : '🔕 Avisos gerais desativados no PV.';

    const sportsStatus =
      sportsCount > 0
        ? `⚽ Alertas esportivos: *${sportsCount}* atlética(s) selecionada(s).`
        : '⚽ Alertas esportivos: nenhuma atlética — escolha abaixo para receber placar e mudanças de jogo.';

    await this.whatsapp.sendText({
      to: waId,
      body:
        `🔔 *Avisos do Inter*\n\n${status}\n${sportsStatus}\n\n` +
        '• *Avisos gerais*: campanhas, Instagram aprovado e comunicados.\n' +
        '• *Esportes*: só jogos das atléticas que você marcar.\n\n' +
        'Ao ativar avisos gerais, você concorda em receber mensagens oficiais conforme a LGPD.',
    });

    await this.whatsapp.sendReplyButtons(waId, 'O que deseja fazer?', [
      { id: BOT_BUTTON_IDS.OPT_IN_YES, title: '✅ Ativar gerais' },
      { id: BOT_BUTTON_IDS.OPT_IN_NO, title: '🔕 Desativar gerais' },
      { id: BOT_BUTTON_IDS.ALERTS_ATLETICAS, title: '⚽ Atléticas' },
    ]);
    await this.whatsapp.sendReplyButtons(waId, ' ', [
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  async optIn(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ALERTS_OPT_IN);
    await this.prisma.notificationOptIn.upsert({
      where: {
        waUserId_segment: { waUserId, segment: 'general' },
      },
      update: { active: true },
      create: { waUserId, segment: 'general', active: true },
    });
    await this.whatsapp.sendText({
      to: waId,
      body:
        '✅ Avisos gerais ativados no PV!\n\n' +
        'Para alertas de *jogos*, escolha uma ou mais atléticas em *⚽ Atléticas*.',
    });
    await this.whatsapp.sendReplyButtons(waId, 'Configurar esportes agora?', [
      { id: BOT_BUTTON_IDS.ALERTS_ATLETICAS, title: '⚽ Escolher atléticas' },
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  async optOut(waId: string, waUserId: string) {
    await this.prisma.notificationOptIn.upsert({
      where: {
        waUserId_segment: { waUserId, segment: 'general' },
      },
      update: { active: false },
      create: { waUserId, segment: 'general', active: false },
    });
    await this.whatsapp.sendText({
      to: waId,
      body: '🔕 Avisos gerais desativados. Alertas esportivos das atléticas marcadas continuam ativos.',
    });
  }

  async showAtleticaSelection(waId: string, waUserId: string, page = 0) {
    await this.session.setMenuState(waUserId, BotMenuState.ALERTS_ATLETICAS);

    const [atleticas, subscribed] = await Promise.all([
      this.prisma.atletica.findMany({
        include: { campus: true },
        orderBy: [{ campus: { name: 'asc' } }, { name: 'asc' }],
      }),
      this.prisma.sportsAlertAtletica.findMany({
        where: { waUserId },
        select: { atleticaId: true },
      }),
    ]);

    const subscribedIds = new Set(subscribed.map((s) => s.atleticaId));

    if (!atleticas.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Atléticas ainda não cadastradas no sistema.',
      });
      return;
    }

    const pageSize = AlertsFlowService.ATLETICA_PAGE_SIZE;
    const start = page * pageSize;
    const slice = atleticas.slice(start, start + pageSize);
    const hasMore = start + pageSize < atleticas.length;

    const rows = slice.map((a) => {
      const on = subscribedIds.has(a.id);
      return {
        id: `${ALERT_ATLETICA_TOGGLE_PREFIX}${a.id}`,
        title: `${on ? '✅' : '⬜'} ${a.name}`.slice(0, 24),
        description: `${a.campus.name} — toque para ${on ? 'remover' : 'adicionar'}`,
      };
    });

    if (hasMore) {
      rows.push({
        id: `alert_atl_page_${page + 1}`,
        title: '▶ Ver mais atléticas',
        description: `${atleticas.length - start - pageSize} restantes`,
      });
    }

    const body =
      page === 0
        ? 'Marque as atléticas para receber alertas de jogos (placar, local, adiamento):'
        : `Atléticas (página ${page + 1}) — toque para alternar:`;

    await this.whatsapp.sendList(waId, body, 'Atléticas', [
      { title: 'Suas atléticas', rows },
    ]);
    await this.whatsapp.sendReplyButtons(waId, 'Pronto?', [
      { id: BOT_BUTTON_IDS.ALERTS, title: '🔔 Voltar avisos' },
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  async toggleAtletica(waId: string, waUserId: string, atleticaId: string) {
    const atletica = await this.prisma.atletica.findUnique({
      where: { id: atleticaId },
      include: { campus: true },
    });
    if (!atletica) return;

    const existing = await this.prisma.sportsAlertAtletica.findUnique({
      where: {
        waUserId_atleticaId: { waUserId, atleticaId },
      },
    });

    if (existing) {
      await this.prisma.sportsAlertAtletica.delete({
        where: {
          waUserId_atleticaId: { waUserId, atleticaId },
        },
      });
      await this.whatsapp.sendText({
        to: waId,
        body: `🔕 Removido: *${atletica.name}* (${atletica.campus.name}).`,
      });
    } else {
      await this.prisma.sportsAlertAtletica.create({
        data: { waUserId, atleticaId },
      });
      await this.whatsapp.sendText({
        to: waId,
        body: `✅ Adicionado: *${atletica.name}* (${atletica.campus.name}) — você receberá alertas dos jogos deste campus.`,
      });
    }
  }

  async handleText(waId: string, waUserId: string, input: string) {
    if (input.startsWith('alert_atl_page_')) {
      const page = Number.parseInt(input.replace('alert_atl_page_', ''), 10);
      if (!Number.isNaN(page) && page > 0) {
        return this.showAtleticaSelection(waId, waUserId, page);
      }
      return;
    }

    if (input.startsWith(ALERT_ATLETICA_TOGGLE_PREFIX)) {
      const atleticaId = input.replace(ALERT_ATLETICA_TOGGLE_PREFIX, '');
      await this.toggleAtletica(waId, waUserId, atleticaId);
      return this.showAtleticaSelection(waId, waUserId, 0);
    }
  }
}
