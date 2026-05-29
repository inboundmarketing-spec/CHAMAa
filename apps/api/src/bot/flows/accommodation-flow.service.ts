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

const ADMIN_NOTE_PATTERN =
  /cadastrar.*painel|endere[cç]o no painel|coordenadas no painel/i;

function isAdminOnlyNote(notes: string | null | undefined): boolean {
  return Boolean(notes?.trim() && ADMIN_NOTE_PATTERN.test(notes));
}

function formatAccommodationBody(params: {
  campusName: string;
  accName: string;
  address: string;
  mapLine: string;
  hostsLine: string;
  notes: string | null | undefined;
}): string {
  const { campusName, accName, address, mapLine, hostsLine, notes } = params;
  const campus = campusName.trim();
  const name = accName.trim();

  let title: string;
  if (!name) {
    title = `🏠 *Alojamento — ${campus}*`;
  } else {
    const nameLower = name.toLowerCase();
    const campusLower = campus.toLowerCase();
    const repeatsCampus =
      campus &&
      (nameLower.includes(campusLower) ||
        nameLower === `alojamento ${campusLower}`);
    title = repeatsCampus ? `🏠 *${name}*` : `🏠 *${name}*\n_${campus}_`;
  }

  const parts = [`${title}\n📍 ${address.trim()}${mapLine}${hostsLine}`];
  const publicNotes = notes?.trim();
  if (publicNotes && !isAdminOnlyNote(publicNotes)) {
    parts.push('', `ℹ️ ${publicNotes}`);
  }
  return parts.join('\n');
}

const NEARBY_SERVICE_ROWS: {
  id: string;
  title: string;
  description: string;
}[] = [
  {
    id: BOT_BUTTON_IDS.ACC_MARMITA,
    title: '🍱 Marmita',
    description: 'Refeição perto do alojamento',
  },
  {
    id: BOT_BUTTON_IDS.ACC_PHARMACY,
    title: '💊 Farmácia',
    description: 'Medicamentos',
  },
  {
    id: BOT_BUTTON_IDS.ACC_HOSPITAL,
    title: '🏥 Hospital',
    description: 'Emergência e saúde',
  },
  {
    id: BOT_BUTTON_IDS.ACC_FAST_FOOD,
    title: '🍔 Fast food',
    description: 'Lanches rápidos',
  },
  {
    id: BOT_BUTTON_IDS.BACK,
    title: '🏠 Menu principal',
    description: 'Voltar ao início',
  },
];

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
        description: hasAcc ? 'Ver endereço' : 'Indisponível',
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

    await this.session.setAtletica(
      waUserId,
      link.atletica.id,
      link.atletica.campusId,
    );

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
      body: formatAccommodationBody({
        campusName: link.atletica.campus.name,
        accName: acc.name,
        address: acc.address,
        mapLine,
        hostsLine: hosts,
        notes: acc.notes,
      }),
    });

    await this.showServicesMenu(waId, waUserId);
  }

  private async showServicesMenu(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ACCOMMODATION);
    await this.whatsapp.sendList(
      waId,
      'Serviços perto do seu alojamento:',
      'O que precisa?',
      [{ title: 'Perto de você', rows: NEARBY_SERVICE_ROWS }],
    );
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
          `*${LOCAL_GUIDE_TYPE_LABELS[type]}* — mais próximos\n\n` +
          lines.join('\n\n'),
      });

      await this.whatsapp.sendReplyButtons(waId, 'Precisa de mais alguma coisa?', [
        { id: 'acc_more_services', title: '📍 Outros serviços' },
        { id: BOT_BUTTON_IDS.BACK, title: '🏠 Menu' },
      ]);
    } catch {
      await this.whatsapp.sendText({
        to: waId,
        body:
          'Não foi possível calcular proximidade. Cadastre coordenadas do alojamento no painel.',
      });
    }
  }

  async handleText(waId: string, waUserId: string, input: string) {
    if (input === 'acc_more_services') {
      const session = await this.session.peekSession(waUserId);
      if (session?.atleticaId) {
        return this.showServicesMenu(waId, waUserId);
      }
      return this.showCampusPrompt(waId, waUserId);
    }

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
