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
import { ProximityService } from '../../geo/proximity.service';

@Injectable()
export class AccommodationFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
    private readonly proximity: ProximityService,
  ) {}

  async showCampusPrompt(waId: string, waUserId: string) {
    const session = await this.session.peekSession(waUserId);
    if (session?.campusId) {
      const atletica = await this.prisma.atletica.findFirst({
        where: { campusId: session.campusId },
        select: { id: true },
      });
      if (atletica) {
        return this.showAccommodation(waId, waUserId, atletica.id);
      }
    }

    await this.session.setMenuState(waUserId, BotMenuState.ACCOMMODATION_CAMPUS);
    const campi = await this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
      include: {
        atleticas: {
          include: {
            accommodationLinks: { include: { accommodation: true } },
          },
        },
      },
    });

    const rows = campi.slice(0, 10).map((c) => {
      const hasAcc = c.atleticas.some((a) => a.accommodationLinks.length > 0);
      return {
        id: `acc_campus_${c.id}`,
        title: c.name.slice(0, 24),
        description: hasAcc ? 'Alojamento cadastrado' : 'Sem alojamento',
      };
    });

    await this.whatsapp.sendList(
      waId,
      'Selecione seu campus para ver o alojamento:',
      'Campi',
      [{ title: 'Campus', rows }],
    );
  }

  async showAccommodation(waId: string, waUserId: string, atleticaId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ACCOMMODATION);
    const link = await this.prisma.accommodationAtletica.findFirst({
      where: { atleticaId },
      include: {
        accommodation: true,
        atletica: { include: { campus: true } },
      },
    });

    if (!link) {
      await this.whatsapp.sendText({
        to: waId,
        body: 'Alojamento ainda não cadastrado para esta atlética.',
      });
      return;
    }

    const acc = link.accommodation;

    await this.prisma.conversationSession.update({
      where: { waUserId },
      data: {
        campusId: link.atletica.campusId,
        lastMessageAt: new Date(),
      },
    });

    const mapLine = acc.mapUrl
      ? `\n🗺 ${acc.mapUrl}`
      : acc.latitude
        ? `\n🗺 https://www.google.com/maps?q=${acc.latitude},${acc.longitude}`
        : '';

    const hosted = await this.prisma.accommodationAtletica.findMany({
      where: { accommodationId: acc.id },
      include: { atletica: { include: { campus: true } } },
    });
    const hosts =
      hosted.length > 1
        ? `\n👥 Atléticas: ${hosted.map((h) => h.atletica.campus.name).join(', ')}`
        : '';

    await this.whatsapp.sendText({
      to: waId,
      body:
        `🏠 *Alojamento — ${link.atletica.campus.name}*\n` +
        `*${acc.name}*\n` +
        `📍 ${acc.address}${mapLine}${hosts}` +
        (acc.notes ? `\n\n_${acc.notes}_` : ''),
    });

    await this.whatsapp.sendReplyButtons(
      waId,
      'O que você precisa perto do alojamento?',
      [
        { id: BOT_BUTTON_IDS.ACC_MARMITA, title: '🍱 Marmita' },
        { id: BOT_BUTTON_IDS.ACC_PHARMACY, title: '💊 Farmácia' },
        { id: BOT_BUTTON_IDS.ACC_HOSPITAL, title: '🏥 Hospital' },
      ],
    );
    await this.whatsapp.sendReplyButtons(waId, 'Mais:', [
      { id: BOT_BUTTON_IDS.ACC_FAST_FOOD, title: '🍔 Fast Food' },
      { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
    ]);
  }

  async showNearby(
    waId: string,
    waUserId: string,
    type: LocalGuidePlaceType,
  ) {
    await this.session.setMenuState(waUserId, BotMenuState.ACCOMMODATION_GUIDE);
    const session = await this.session.peekSession(waUserId);
    if (!session?.campusId) {
      return this.showCampusPrompt(waId, waUserId);
    }

    const atletica = await this.prisma.atletica.findFirst({
      where: { campusId: session.campusId },
      select: { id: true },
    });
    if (!atletica) {
      return this.showCampusPrompt(waId, waUserId);
    }

    try {
      const nearest = await this.proximity.findNearestFromAtletica(
        atletica.id,
        type,
        5,
      );

      if (!nearest.length) {
        await this.whatsapp.sendText({
          to: waId,
          body: `Nenhum local de *${LOCAL_GUIDE_TYPE_LABELS[type]}* aprovado perto do seu alojamento.`,
        });
        return;
      }

      const lines = nearest.map((p, i) => {
        const dist = formatDistanceKm(p.distanceKm);
        const phone = p.phone ? `\n📞 ${p.phone}` : '';
        const link = p.siteUrl ? `\n🔗 ${p.siteUrl}` : '';
        const menu = p.menuUrl ? `\n📋 ${p.menuUrl}` : '';
        return `${i + 1}. *${p.name}* (${dist})\n📍 ${p.address}${phone}${link}${menu}`;
      });

      await this.whatsapp.sendText({
        to: waId,
        body:
          `*${LOCAL_GUIDE_TYPE_LABELS[type]}* — 5 mais próximos do alojamento\n\n` +
          lines.join('\n\n'),
      });
    } catch {
      await this.whatsapp.sendText({
        to: waId,
        body:
          'Não foi possível calcular proximidade. Cadastre coordenadas do alojamento no painel.',
      });
    }
  }

  async handleText(waId: string, waUserId: string, input: string) {
    if (input.startsWith('acc_campus_')) {
      const campusId = input.replace('acc_campus_', '');
      const atletica = await this.prisma.atletica.findFirst({
        where: { campusId },
        select: { id: true },
      });
      if (atletica) {
        return this.showAccommodation(waId, waUserId, atletica.id);
      }
    }
  }
}
