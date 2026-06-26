import { Injectable } from '@nestjs/common';
import {
  BOT_BUTTON_IDS,
  BotMenuState,
  LOCAL_GUIDE_TYPE_LABELS,
  LocalGuidePlaceType,
  formatDistanceKm,
} from '@chama/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { SessionService } from '../session.service';
import { publicMediaUrl } from '../../admin/festas-media.util';
import { ProximityService } from '../../geo/proximity.service';

@Injectable()
export class FestasFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
    private readonly proximity: ProximityService,
  ) {}

  async showFestasMenu(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS);
    const festival = await this.getFestival();
    const festaName = festival?.name?.trim() || 'Festas do Inter';

    const rows: { id: string; title: string; description?: string }[] = [
      {
        id: BOT_BUTTON_IDS.FESTAS_TODAY,
        title: '📅 Hoje',
        description: 'Programação do dia',
      },
      {
        id: BOT_BUTTON_IDS.FESTAS_LINEUP,
        title: '🎤 Os 3 dias',
        description: 'Visão geral',
      },
      {
        id: BOT_BUTTON_IDS.FESTAS_TENDA,
        title: '📍 Local',
        description: 'Onde é a festa',
      },
      {
        id: BOT_BUTTON_IDS.FESTAS_NEARBY,
        title: '📍 Serviços perto',
        description: 'Marmita, farmácia…',
      },
      {
        id: BOT_BUTTON_IDS.FESTAS_PROMO,
        title: '🎬 Vídeo promo',
        description: 'Assista no celular',
      },
    ];
    if (festival?.passportPurchaseUrl?.trim()) {
      rows.splice(3, 0, {
        id: BOT_BUTTON_IDS.FESTAS_PASSPORT,
        title: '🎫 Passaporte',
        description: 'Comprar ingresso',
      });
    }
    rows.push({
      id: BOT_BUTTON_IDS.BACK,
      title: '🏠 Menu principal',
      description: 'Voltar',
    });

    await this.whatsapp.sendList(
      waId,
      `🎉 *${festaName}*\n\nCada dia dura cerca de *12 horas*. Escolha:`,
      'Ver opções',
      [{ title: 'Festas', rows }],
    );
  }

  async sendTodaySchedule(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS_TODAY);
    const day = await this.findDayForToday();
    if (!day) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Nenhuma festa cadastrada para hoje.',
      });
      return;
    }
    await this.sendDayDetails(waId, day.id);
  }

  async sendLineupOverview(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS_LINEUP);
    const festival = await this.getFestival();
    if (!festival?.days.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Line-up em breve!',
      });
      return;
    }

    const festaName = festival.name?.trim() || 'Festas';
    const lines = festival.days.map((d) => this.formatDaySummary(d));
    await this.whatsapp.sendText({
      to: waId,
      body: `🎤 *${festaName} — 3 dias*\n\n${lines.join('\n\n')}`,
    });

    await this.whatsapp.sendReplyButtons(
      waId,
      'Ver detalhes de qual dia?',
      [
        { id: BOT_BUTTON_IDS.FESTAS_DAY_1, title: 'Dia 1' },
        { id: BOT_BUTTON_IDS.FESTAS_DAY_2, title: 'Dia 2' },
        { id: BOT_BUTTON_IDS.FESTAS_DAY_3, title: 'Dia 3' },
      ],
    );
  }

  async sendDayByIndex(waId: string, waUserId: string, dayIndex: number) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS_DAY);
    const day = await this.prisma.festivalDay.findFirst({
      where: { dayIndex },
      include: {
        artists: { orderBy: { sortOrder: 'asc' } },
        media: true,
        festival: true,
      },
    });
    if (!day) {
      await this.whatsapp.sendText({
        to: waId,
        body: `Dia ${dayIndex} ainda não cadastrado.`,
      });
      return;
    }
    await this.sendDayDetails(waId, day.id);
  }

  async sendPromo(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS);
    const festival = await this.getFestival();
    if (!festival) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Vídeo promocional em breve!',
      });
      return;
    }

    const festaName = festival.name?.trim() || 'Festas do Inter';

    if (festival.promoVideoUrl) {
      await this.whatsapp.sendVideo(
        waId,
        publicMediaUrl(festival.promoVideoUrl),
        `🎬 *${festaName}* — os 3 dias de festa`,
      );
      return;
    }

    if (festival.promoImageUrl) {
      await this.whatsapp.sendImage(
        waId,
        publicMediaUrl(festival.promoImageUrl),
        `🎬 *${festaName}*`,
      );
      return;
    }

    await this.whatsapp.sendText({
      to: waId,
      body: 'Vídeo promocional em breve!',
    });
  }

  async sendPassportLink(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS);
    const festival = await this.getFestival();
    const url = festival?.passportPurchaseUrl?.trim();

    if (!url) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Link de compra do passaporte ainda não disponível.',
      });
      return;
    }

    const festaName = festival?.name?.trim() || 'Festas do Inter';
    await this.whatsapp.sendText({
      to: waId,
      body: `🎫 *Passaporte — ${festaName}*\n\nCompre aqui:\n${url}`,
    });
  }

  async sendLocationInfo(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS_TENDA);
    const festival = await this.getFestival();
    const festaName = festival?.name?.trim() || 'Festas do Inter';

    const placeName = festival?.location?.name?.trim() || '';
    const address =
      festival?.address?.trim() || festival?.location?.address?.trim() || '';

    if (!address && !placeName) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Local da festa ainda não cadastrado.',
      });
      return;
    }

    const lines = [`📍 *Local — ${festaName}*`];
    if (placeName) lines.push(placeName);
    if (address) lines.push(address);

    const mapUrl =
      festival?.mapUrl?.trim() || festival?.location?.mapUrl?.trim();
    if (mapUrl) lines.push(`🗺 ${mapUrl}`);

    await this.whatsapp.sendText({
      to: waId,
      body: lines.join('\n'),
    });

    await this.whatsapp.sendList(waId, 'Mais opções:', 'Ver opções', [
      {
        title: 'Festas',
        rows: [
          {
            id: BOT_BUTTON_IDS.FESTAS_NEARBY,
            title: '📍 Serviços perto',
            description: 'Do local da festa',
          },
          {
            id: BOT_BUTTON_IDS.BACK,
            title: '🏠 Menu principal',
            description: 'Voltar',
          },
        ],
      },
    ]);
  }

  async sendNearbyServices(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.FESTAS_NEARBY);
    const festival = await this.getFestival();
    const loc = festival?.location;
    const lat =
      loc?.latitude ??
      (festival?.locationId
        ? (
            await this.prisma.location.findUnique({
              where: { id: festival.locationId },
            })
          )?.latitude
        : null);
    const lng = loc?.longitude;

    if (lat == null || lng == null) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Local da festa sem coordenadas para busca de proximidade.',
      });
      return;
    }

    await this.whatsapp.sendList(
      waId,
      'Serviços perto da festa:',
      'Ver opções',
      [
        {
          title: 'Perto da festa',
          rows: [
            {
              id: 'festa_near_marmita',
              title: '🍱 Marmita',
              description: LOCAL_GUIDE_TYPE_LABELS[LocalGuidePlaceType.MARMITA],
            },
            {
              id: 'festa_near_pharmacy',
              title: '💊 Farmácia',
              description: LOCAL_GUIDE_TYPE_LABELS[LocalGuidePlaceType.PHARMACY],
            },
            {
              id: 'festa_near_fast',
              title: '🍔 Fast food',
              description: LOCAL_GUIDE_TYPE_LABELS[LocalGuidePlaceType.FAST_FOOD],
            },
            {
              id: BOT_BUTTON_IDS.BACK,
              title: '🏠 Menu principal',
              description: 'Voltar',
            },
          ],
        },
      ],
    );
  }

  async sendNearbyType(waId: string, type: LocalGuidePlaceType) {
    const festival = await this.getFestival();
    const loc = festival?.location;
    if (!loc?.latitude || !loc?.longitude) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Coordenadas do local da festa não cadastradas.',
      });
      return;
    }

    const nearest = await this.proximity.findNearestFromCoords(
      loc.latitude,
      loc.longitude,
      type,
      5,
    );

    if (!nearest.length) {
      await this.whatsapp.sendText({
        to: waId,
        body: `Nenhum *${LOCAL_GUIDE_TYPE_LABELS[type]}* aprovado perto da festa.`,
      });
      return;
    }

    const lines = nearest.map((p, i) => {
      const dist = formatDistanceKm(p.distanceKm);
      return `${i + 1}. *${p.name}* (${dist})\n📍 ${p.address}`;
    });

    await this.whatsapp.sendText({
      to: waId,
      body: `*${LOCAL_GUIDE_TYPE_LABELS[type]}* perto da festa\n\n${lines.join('\n\n')}`,
    });
  }

  /** @deprecated use sendLocationInfo */
  async sendTendaInfo(waId: string, waUserId: string) {
    return this.sendLocationInfo(waId, waUserId);
  }

  async handleText(waId: string, _waUserId: string, input: string) {
    if (input === 'festa_near_marmita') {
      return this.sendNearbyType(waId, LocalGuidePlaceType.MARMITA);
    }
    if (input === 'festa_near_pharmacy') {
      return this.sendNearbyType(waId, LocalGuidePlaceType.PHARMACY);
    }
    if (input === 'festa_near_fast') {
      return this.sendNearbyType(waId, LocalGuidePlaceType.FAST_FOOD);
    }
    await this.whatsapp.sendText({
      to: waId,
      body: 'Use os botões do menu Festas para navegar.',
    });
  }

  private async getFestival() {
    return this.prisma.festival.findFirst({
      include: {
        location: true,
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            artists: { orderBy: { sortOrder: 'asc' } },
            media: true,
          },
        },
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  private async findDayForToday() {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.festivalDay.findFirst({
      where: {
        OR: [
          { startsAt: { lte: now }, endsAt: { gte: now } },
          { startsAt: { gte: start, lte: end } },
        ],
      },
      include: {
        artists: { orderBy: { sortOrder: 'asc' } },
        media: true,
      },
      orderBy: { dayIndex: 'asc' },
    });
  }

  private async sendDayDetails(waId: string, dayId: string) {
    const day = await this.prisma.festivalDay.findUnique({
      where: { id: dayId },
      include: {
        artists: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
        media: true,
      },
    });
    if (!day) return;

    for (const m of day.media) {
      await this.sendMediaItem(waId, m.type, m.url, m.caption);
    }

    const headliner = day.artists.find((a) => a.role === 'headliner');
    if (headliner) {
      for (const m of headliner.media) {
        await this.sendMediaItem(
          waId,
          m.type,
          m.url,
          m.caption ?? `⭐ ${headliner.name}`,
        );
      }
    }

    await this.whatsapp.sendText({
      to: waId,
      body: this.formatDayDetail(day),
    });
  }

  private async sendMediaItem(
    waId: string,
    type: string,
    url: string,
    caption?: string | null,
  ) {
    if (type === 'link') {
      const label = caption?.trim() || '🔗 Link';
      await this.whatsapp.sendText({
        to: waId,
        body: `${label}\n${url}`,
      });
      return;
    }

    const publicUrl = publicMediaUrl(url);
    if (type === 'video') {
      await this.whatsapp.sendVideo(waId, publicUrl, caption ?? undefined);
    } else {
      await this.whatsapp.sendImage(waId, publicUrl, caption ?? undefined);
    }
  }

  private formatDaySummary(
    day: {
      dayIndex: number;
      title: string;
      startsAt: Date;
      endsAt: Date;
      artists: { name: string; role: string }[];
    },
  ) {
    const headliner = day.artists.find((a) => a.role === 'headliner');
    const supporting = day.artists.filter((a) => a.role === 'supporting');
    const date = day.startsAt.toLocaleDateString('pt-BR');
    const start = day.startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = day.endsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    let text = `*Dia ${day.dayIndex} — ${day.title}*\n📅 ${date} · ${start}–${end}`;
    if (headliner) text += `\n⭐ Headliner: *${headliner.name}*`;
    if (supporting.length) {
      text += `\n🎵 ${supporting.map((a) => a.name).join(', ')}`;
    }
    return text;
  }

  private formatDayDetail(
    day: {
      dayIndex: number;
      title: string;
      startsAt: Date;
      endsAt: Date;
      artists: {
        name: string;
        role: string;
        setStartsAt: Date | null;
      }[];
    },
  ) {
    const headliner = day.artists.find((a) => a.role === 'headliner');
    const supporting = day.artists.filter((a) => a.role === 'supporting');
    const date = day.startsAt.toLocaleDateString('pt-BR');
    const start = day.startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = day.endsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const lines = [
      `🎉 *Dia ${day.dayIndex} — ${day.title}*`,
      `📅 ${date}`,
      `🕐 ${start} → ${end} (*12h*)`,
    ];

    if (headliner) {
      const set = headliner.setStartsAt
        ? ` — ${headliner.setStartsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : '';
      lines.push(`\n⭐ *Headliner:* ${headliner.name}${set}`);
    }

    if (supporting.length) {
      lines.push('\n🎵 *Line-up:*');
      for (const a of supporting) {
        const set = a.setStartsAt
          ? ` (${a.setStartsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
          : '';
        lines.push(`• ${a.name}${set}`);
      }
    }

    return lines.join('\n');
  }
}
