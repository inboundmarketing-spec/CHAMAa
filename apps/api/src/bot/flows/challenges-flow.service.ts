import { Injectable } from '@nestjs/common';
import { BOT_BUTTON_IDS, BotMenuState } from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';

@Injectable()
export class ChallengesFlowService {
  private static readonly PAGE_SIZE = 8;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
  ) {}

  async showChallenges(waId: string, waUserId: string, page = 0) {
    await this.session.setMenuState(waUserId, BotMenuState.CHALLENGES);

    const total = await this.prisma.challenge.count();
    if (total === 0) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Nenhum desafio cadastrado no momento.',
      });
      return;
    }

    const start = page * ChallengesFlowService.PAGE_SIZE;
    const challenges = await this.prisma.challenge.findMany({
      include: {
        atletica: { include: { campus: true } },
        campus: true,
      },
      orderBy: { scheduledAt: 'asc' },
      skip: start,
      take: ChallengesFlowService.PAGE_SIZE,
    });

    const hasMore = start + ChallengesFlowService.PAGE_SIZE < total;

    const rows = challenges.map((c) => {
      const dt = c.scheduledAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const who = c.atletica?.name ?? c.campus?.name ?? 'Geral';
      return {
        id: `challenge_${c.id}`,
        title: c.title.slice(0, 24),
        description: `${dt} · ${who}`.slice(0, 72),
      };
    });

    if (hasMore) {
      rows.push({
        id: `challenge_page_${page + 1}`,
        title: '▶ Ver mais',
        description: `${total - start - challenges.length} restantes`,
      });
    } else {
      rows.push({
        id: BOT_BUTTON_IDS.BACK,
        title: '🏠 Menu principal',
        description: 'Voltar',
      });
    }

    const body =
      page === 0
        ? '🎯 *Desafios*\nToque em um para ver detalhes:'
        : `🎯 *Desafios* (página ${page + 1})`;

    await this.whatsapp.sendList(waId, body, 'Ver desafios', [
      { title: 'Agenda', rows },
    ]);
  }

  async showChallengeDetail(waId: string, waUserId: string, challengeId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.CHALLENGES);
    const c = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        atletica: { include: { campus: true } },
        campus: true,
      },
    });
    if (!c) return;

    const dt = c.scheduledAt.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const who = c.atletica?.name ?? c.campus?.name ?? 'Geral';
    const addr = c.address ? `\n📍 ${c.address}` : '';

    await this.whatsapp.sendText({
      to: waId,
      body:
        `🎯 *${c.title}*\n` +
        `👥 ${who}\n` +
        `🕐 ${dt}\n` +
        `📌 ${c.locationName}${addr}`,
    });

    await this.whatsapp.sendList(waId, 'Outro desafio?', 'Ver opções', [
      {
        title: 'Desafios',
        rows: [
          {
            id: 'challenge_list_0',
            title: '📋 Lista de desafios',
            description: 'Voltar à agenda',
          },
          {
            id: BOT_BUTTON_IDS.BACK,
            title: '🏠 Menu principal',
            description: 'Início',
          },
        ],
      },
    ]);
  }

  async handleText(waId: string, waUserId: string, input: string) {
    if (input === 'challenge_list_0') {
      return this.showChallenges(waId, waUserId, 0);
    }
    if (input.startsWith('challenge_page_')) {
      const page = Number.parseInt(input.replace('challenge_page_', ''), 10);
      if (!Number.isNaN(page) && page > 0) {
        return this.showChallenges(waId, waUserId, page);
      }
      return;
    }
    if (input.startsWith('challenge_')) {
      const id = input.replace('challenge_', '');
      return this.showChallengeDetail(waId, waUserId, id);
    }
  }
}
