import { Injectable } from '@nestjs/common';
import {
  BOT_BUTTON_IDS,
  BotMenuState,
  SportGender,
  formatStandingsWhatsApp,
} from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';
import {
  formatLiveMatchClock,
  formatBracketMatchBotLine,
  formatMatchScoreLabel,
  formatMatchTeamsLabel,
} from '../../admin/match-display.util';
import { StandingsService } from '../../admin/standings.service';

const matchBotInclude = {
  modalidade: true,
  venue: true,
  participants: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class SportsFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
    private readonly standings: StandingsService,
  ) {}

  async showSportsMenu(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS);
    await this.whatsapp.sendReplyButtons(
      waId,
      '⚽ *Esportes*\nO que você quer consultar?',
      [
        { id: BOT_BUTTON_IDS.LIVE_SCORE, title: '📊 Placar ao vivo' },
        { id: BOT_BUTTON_IDS.UPCOMING, title: '📅 Próximos jogos' },
        { id: BOT_BUTTON_IDS.STANDINGS, title: '📋 Classificação' },
      ],
    );
    await this.whatsapp.sendReplyButtons(waId, 'Mais:', [
      { id: BOT_BUTTON_IDS.BRACKET, title: '🏆 Chaveamento' },
      { id: BOT_BUTTON_IDS.SPORTS_VENUES, title: '🏟 Praças' },
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  async sendLiveScores(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_LIVE);
    const matches = await this.prisma.match.findMany({
      where: { status: 'live' },
      include: matchBotInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    if (!matches.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Nenhum jogo ao vivo no momento. Confira os próximos jogos!',
      });
      return;
    }

    const lines = matches.map((m) => {
      const venue = m.venue?.name ?? 'Local a definir';
      const time = m.scheduledAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const prova = m.division ? ` — ${m.division}` : '';
      const clock = formatLiveMatchClock(m);
      const clockLine = clock ? `\n${clock}` : '';
      return `*${m.modalidade.name}*${prova}\n${formatMatchScoreLabel(m)}${clockLine}\n📍 ${venue} · ${time}`;
    });

    await this.whatsapp.sendText({
      to: waId,
      body: `📊 *Placar ao vivo*\n\n${lines.join('\n\n')}`,
    });
  }

  async sendUpcoming(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_UPCOMING);
    const now = new Date();
    const matches = await this.prisma.match.findMany({
      where: {
        scheduledAt: { gte: now },
        status: { in: ['scheduled', 'delayed'] },
      },
      include: matchBotInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 8,
    });

    if (!matches.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Sem jogos agendados no momento.',
      });
      return;
    }

    const lines = matches.map((m) => {
      const dt = m.scheduledAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const venue = m.venue
        ? `${m.venue.name} — ${m.venue.address}`
        : 'Local a definir';
      const prova = m.division ? ` — ${m.division}` : '';
      return `*${m.modalidade.name}*${prova}\n${formatMatchTeamsLabel(m)}\n🕐 ${dt}\n📍 ${venue}`;
    });

    await this.whatsapp.sendText({
      to: waId,
      body: `📅 *Próximos jogos*\n\n${lines.join('\n\n')}`,
    });
  }

  async sendStandings(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_STANDINGS);
    const modalidades = await this.prisma.modalidade.findMany({
      where: {
        matches: { some: { status: 'finished' } },
      },
      orderBy: { name: 'asc' },
    });

    const byName = new Map<string, typeof modalidades>();
    for (const m of modalidades) {
      const list = byName.get(m.name) ?? [];
      list.push(m);
      byName.set(m.name, list);
    }

    const rows: { id: string; title: string; description: string }[] = [
      {
        id: 'standings_general',
        title: '📋 Geral (todas)',
        description: 'Classificação do Inter',
      },
    ];

    for (const [name, mods] of [...byName.entries()].slice(0, 9)) {
      rows.push({
        id: `standings_mod_${mods[0]!.id}`,
        title: name.slice(0, 24),
        description: `${mods.length} chave(s)`,
      });
    }

    await this.whatsapp.sendList(
      waId,
      '📋 *Classificação*\n\nEscolha a modalidade (ou geral):',
      'Modalidades',
      [{ title: 'Esportes', rows }],
    );
  }

  async sendStandingsGeneral(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_STANDINGS);
    const { first, second, updatedAt } = await this.standings.listByDivisions();
    const all = [...first, ...second];

    if (!all.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Classificação ainda não disponível.',
      });
      return;
    }

    const body = formatStandingsWhatsApp(all, updatedAt);
    await this.whatsapp.sendText({ to: waId, body });
  }

  async sendStandingsGender(
    waId: string,
    waUserId: string,
    sampleModalidadeId: string,
  ) {
    const sample = await this.prisma.modalidade.findUnique({
      where: { id: sampleModalidadeId },
    });
    if (!sample) return;

    await this.session.setMenuState(
      waUserId,
      BotMenuState.SPORTS_STANDINGS_GENDER,
    );
    await this.whatsapp.sendReplyButtons(
      waId,
      `*${sample.name}* — escolha o gênero:`,
      [
        { id: `standings_gender_${sample.name}_male`, title: '♂ Masculino' },
        { id: `standings_gender_${sample.name}_female`, title: '♀ Feminino' },
        { id: BOT_BUTTON_IDS.STANDINGS, title: '↩ Modalidades' },
      ],
    );
  }

  async sendStandingsBySport(
    waId: string,
    waUserId: string,
    sportName: string,
    gender: string,
  ) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_STANDINGS);
    const modalidade = await this.prisma.modalidade.findFirst({
      where: { name: sportName, gender },
    });

    if (!modalidade) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Classificação não encontrada para esta combinação.',
      });
      return;
    }

    const rows = await this.standings.listForModalidade(modalidade.id);
    if (!rows.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: `Ainda não há jogos finalizados em *${sportName}* (${gender === SportGender.MALE ? 'Masc.' : 'Fem.'}).`,
      });
      return;
    }

    const genderLabel =
      gender === SportGender.MALE ? 'Masculino' : 'Feminino';
    const body = formatStandingsWhatsApp(rows, new Date(), {
      title: `📋 *${sportName}* — ${genderLabel}`,
      showDivisions: false,
    });

    await this.whatsapp.sendText({ to: waId, body });
  }

  async sendVenues(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_VENUES);
    const venues = await this.prisma.venue.findMany({
      orderBy: { name: 'asc' },
      take: 10,
    });

    if (!venues.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Praças esportivas ainda não cadastradas.',
      });
      return;
    }

    const lines = venues.map((v) => {
      const map = v.mapUrl
        ? `\n🗺 ${v.mapUrl}`
        : v.latitude
          ? `\n🗺 https://www.google.com/maps?q=${v.latitude},${v.longitude}`
          : '';
      return `*${v.name}*\n📍 ${v.address}${map}`;
    });

    await this.whatsapp.sendText({
      to: waId,
      body: `🏟 *Praças esportivas*\n\n${lines.join('\n\n')}`,
    });
  }

  async sendBracket(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_BRACKET);
    const modalidades = await this.prisma.modalidade.findMany({
      where: {
        OR: [
          { bracketPublished: true },
          { matches: { some: { bracketRound: { not: null } } } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const byName = new Map<string, typeof modalidades>();
    for (const m of modalidades) {
      const list = byName.get(m.name) ?? [];
      list.push(m);
      byName.set(m.name, list);
    }

    if (!byName.size) {
      await this.whatsapp.sendText({
        to: waId,
        body:
          '🏆 *Chaveamento*\n\n' +
          'Ainda não publicado. O chaveamento costuma sair cerca de 1 mês antes do Inter.',
      });
      return;
    }

    const rows = [...byName.entries()].slice(0, 10).map(([name, mods]) => ({
      id: `bracket_mod_${mods[0]!.id}`,
      title: name.slice(0, 24),
      description: `${mods.length} chave(s)`,
    }));

    await this.whatsapp.sendList(
      waId,
      'Escolha a modalidade:',
      'Modalidades',
      [{ title: 'Esportes', rows }],
    );
  }

  async sendBracketGender(
    waId: string,
    waUserId: string,
    sampleModalidadeId: string,
  ) {
    const sample = await this.prisma.modalidade.findUnique({
      where: { id: sampleModalidadeId },
    });
    if (!sample) return;

    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_BRACKET_GENDER);
    await this.whatsapp.sendReplyButtons(
      waId,
      `*${sample.name}* — escolha o gênero:`,
      [
        { id: `bracket_gender_${sample.name}_male`, title: '♂ Masculino' },
        { id: `bracket_gender_${sample.name}_female`, title: '♀ Feminino' },
        { id: BOT_BUTTON_IDS.BRACKET, title: '↩ Modalidades' },
      ],
    );
  }

  async sendBracketView(
    waId: string,
    waUserId: string,
    sportName: string,
    gender: string,
  ) {
    await this.session.setMenuState(waUserId, BotMenuState.SPORTS_BRACKET_VIEW);
    const modalidade = await this.prisma.modalidade.findFirst({
      where: { name: sportName, gender },
    });

    if (!modalidade) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Chaveamento não encontrado para esta combinação.',
      });
      return;
    }

    const matches = await this.prisma.match.findMany({
      where: {
        modalidadeId: modalidade.id,
        bracketRound: { not: null },
      },
      include: matchBotInclude,
      orderBy: [{ bracketRound: 'asc' }, { scheduledAt: 'asc' }],
      take: 20,
    });

    if (!matches.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: `Sem chaves publicadas para *${sportName}* (${gender === SportGender.MALE ? 'Masc.' : 'Fem.'}).`,
      });
      return;
    }

    const byRound = new Map<string, typeof matches>();
    for (const m of matches) {
      const round = m.bracketRound ?? 'Geral';
      if (!byRound.has(round)) byRound.set(round, []);
      byRound.get(round)!.push(m);
    }

    const blocks: string[] = [
      `🏆 *${sportName}* — ${gender === SportGender.MALE ? 'Masculino' : 'Feminino'}`,
    ];

    for (const [round, roundMatches] of byRound) {
      const lines = roundMatches.map(
        (m) => `• ${formatBracketMatchBotLine(m)}`,
      );
      blocks.push(`\n*${round}*\n${lines.join('\n')}`);
    }

    await this.whatsapp.sendText({
      to: waId,
      body: blocks.join('\n'),
    });
  }

  async handleText(
    waId: string,
    waUserId: string,
    input: string,
    _menuState: string,
  ) {
    if (input === 'standings_general') {
      return this.sendStandingsGeneral(waId, waUserId);
    }

    if (input.startsWith('standings_mod_')) {
      const modalidadeId = input.replace('standings_mod_', '');
      return this.sendStandingsGender(waId, waUserId, modalidadeId);
    }

    if (input.startsWith('standings_gender_')) {
      const rest = input.replace('standings_gender_', '');
      const lastUnderscore = rest.lastIndexOf('_');
      const sportName = rest.slice(0, lastUnderscore);
      const gender = rest.slice(lastUnderscore + 1);
      return this.sendStandingsBySport(waId, waUserId, sportName, gender);
    }

    if (input.startsWith('bracket_mod_')) {
      const modalidadeId = input.replace('bracket_mod_', '');
      return this.sendBracketGender(waId, waUserId, modalidadeId);
    }

    if (input.startsWith('bracket_gender_')) {
      const rest = input.replace('bracket_gender_', '');
      const lastUnderscore = rest.lastIndexOf('_');
      const sportName = rest.slice(0, lastUnderscore);
      const gender = rest.slice(lastUnderscore + 1);
      return this.sendBracketView(waId, waUserId, sportName, gender);
    }
  }
}
