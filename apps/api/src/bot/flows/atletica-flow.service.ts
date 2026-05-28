import { Injectable } from '@nestjs/common';
import { BotMenuState } from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';
import {
  formatMatchScoreLabel,
  formatMatchTeamsLabel,
} from '../../admin/match-display.util';

const matchInclude = {
  modalidade: true,
  venue: true,
  participants: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class AtleticaFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
  ) {}

  private static readonly PAGE_SIZE = 9;

  async showAtleticaPrompt(waId: string, waUserId: string, page = 0) {
    await this.session.setMenuState(waUserId, BotMenuState.ATLETICA);
    const atleticas = await this.prisma.atletica.findMany({
      include: { campus: true },
      orderBy: { campus: { name: 'asc' } },
    });

    if (!atleticas.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Atléticas ainda não cadastradas.',
      });
      return;
    }

    const start = page * AtleticaFlowService.PAGE_SIZE;
    const slice = atleticas.slice(start, start + AtleticaFlowService.PAGE_SIZE);
    const hasMore = start + AtleticaFlowService.PAGE_SIZE < atleticas.length;

    const rows = slice.map((a) => ({
      id: `atletica_${a.id}`,
      title: a.name.slice(0, 24),
      description: a.campus.name,
    }));

    if (hasMore) {
      rows.push({
        id: `atletica_page_${page + 1}`,
        title: '▶ Ver mais',
        description: `${atleticas.length - start - slice.length} restantes`,
      });
    }

    await this.whatsapp.sendList(
      waId,
      'Escolha sua atlética para ver agenda de jogos e desafios:',
      'Ver atléticas',
      [{ title: 'Atléticas', rows }],
    );
  }

  async showAgenda(waId: string, waUserId: string, atleticaId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ATLETICA_VIEW);
    const atletica = await this.prisma.atletica.findUnique({
      where: { id: atleticaId },
      include: { campus: true },
    });
    if (!atletica) return;

    await this.session.setAtletica(waUserId, atletica.id, atletica.campusId);
    const teamName = atletica.campus.name;

    const edition = await this.prisma.interEdition.findUnique({
      where: { id: 'current' },
    });
    const days = await this.prisma.interGameDay.findMany({
      where: { editionId: 'current' },
      orderBy: { dayIndex: 'asc' },
    });

    const rangeStart = days[0]?.startsAt ?? new Date(0);
    const rangeEnd =
      days[days.length - 1]?.endsAt ?? new Date(8640000000000000);

    const matches = await this.prisma.match.findMany({
      where: {
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        OR: [
          { homeTeam: { equals: teamName, mode: 'insensitive' } },
          { awayTeam: { equals: teamName, mode: 'insensitive' } },
          {
            participants: {
              some: { team: { equals: teamName, mode: 'insensitive' } },
            },
          },
        ],
      },
      include: matchInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 12,
    });

    const challenges = await this.prisma.challenge.findMany({
      where: {
        OR: [{ atleticaId }, { campusId: atletica.campusId }],
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
    });

    const matchLines = matches.map((m) => {
      const dt = m.scheduledAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const prova = m.division ? ` (${m.division})` : '';
      const score =
        m.status === 'live' || m.status === 'finished'
          ? ` — ${formatMatchScoreLabel(m)}`
          : '';
      return `⚽ *${m.modalidade.name}*${prova}\n${formatMatchTeamsLabel(m)}${score}\n🕐 ${dt} · ${m.venue?.name ?? 'TBD'}`;
    });

    const challengeLines = challenges.map((c) => {
      const dt = c.scheduledAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `🎯 *${c.title}*\n📍 ${c.locationName}\n🕐 ${dt}`;
    });

    const parts = [
      `🏛 *${atletica.name}*`,
      edition?.status === 'closed' ? '_Inter encerrado_' : '',
      '',
      '*Jogos*',
      matchLines.length ? matchLines.join('\n\n') : '_Nenhum jogo no período do Inter_',
      '',
      '*Desafios*',
      challengeLines.length
        ? challengeLines.join('\n\n')
        : '_Nenhum desafio agendado_',
    ];

    await this.whatsapp.sendText({
      to: waId,
      body: parts.filter((p) => p !== '').join('\n'),
    });
  }

  async handleText(
    waId: string,
    waUserId: string,
    input: string,
    _menuState: string,
  ) {
    if (input.startsWith('atletica_page_')) {
      const page = Number.parseInt(input.replace('atletica_page_', ''), 10);
      if (!Number.isNaN(page) && page > 0) {
        return this.showAtleticaPrompt(waId, waUserId, page);
      }
      return;
    }
    if (input.startsWith('atletica_')) {
      const id = input.replace('atletica_', '');
      return this.showAgenda(waId, waUserId, id);
    }
  }
}
