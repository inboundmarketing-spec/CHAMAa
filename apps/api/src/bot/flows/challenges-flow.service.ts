import { Injectable } from '@nestjs/common';
import { BotMenuState } from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';

@Injectable()
export class ChallengesFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
  ) {}

  async showChallenges(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.CHALLENGES);
    const challenges = await this.prisma.challenge.findMany({
      include: {
        atletica: { include: { campus: true } },
        campus: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 15,
    });

    if (!challenges.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Nenhum desafio cadastrado no momento.',
      });
      return;
    }

    const lines = challenges.map((c) => {
      const dt = c.scheduledAt.toLocaleString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const who =
        c.atletica?.name ?? c.campus?.name ?? 'Geral';
      const addr = c.address ? `\n📍 ${c.address}` : '';
      return `*${c.title}* (${who})\n🕐 ${dt}\n📌 ${c.locationName}${addr}`;
    });

    await this.whatsapp.sendText({
      to: waId,
      body: `🎯 *Desafios*\n\n${lines.join('\n\n')}`,
    });
  }
}
