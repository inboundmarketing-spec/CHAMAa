import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  BOT_BUTTON_IDS,
  BotMenuState,
  LocalGuidePlaceType,
} from '@chama/shared';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SportsFlowService } from './flows/sports-flow.service';
import { FestasFlowService } from './flows/festas-flow.service';
import { AlertsFlowService } from './flows/alerts-flow.service';
import { HelpFlowService } from './flows/help-flow.service';
import { AtleticaFlowService } from './flows/atletica-flow.service';
import { ChallengesFlowService } from './flows/challenges-flow.service';
import { AccommodationFlowService } from './flows/accommodation-flow.service';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { isBotButtonOrCommand } from './bot-activation.util';

const GREETINGS = ['oi', 'olá', 'ola', 'hey', 'hi', 'menu', 'inicio', 'início'];

/** Evita falso positivo (ex.: `btn_atletica_menu` contém "oi"). */
function matchesGreeting(normalized: string): boolean {
  return GREETINGS.some((g) => {
    if (g === 'oi') return /\boi\b/.test(normalized);
    return normalized.includes(g);
  });
}

function buildWelcomeMenuBody(firstName?: string | null): string {
  const first = firstName?.trim().split(/\s+/)[0];
  const hi = first ? `Oi, *${first}*! ` : 'Oi! ';
  return (
    `🔥 ${hi}Sou a *Chaminha*, assistente do *Interunesp*.\n\n` +
    'Te ajudo com *jogos*, *festas* e dúvidas do evento.\n\n' +
    'Abra o menu e escolha:'
  );
}

@Injectable()
export class FlowRouterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly session: SessionService,
    private readonly sports: SportsFlowService,
    private readonly festas: FestasFlowService,
    private readonly alerts: AlertsFlowService,
    private readonly atletica: AtleticaFlowService,
    private readonly challenges: ChallengesFlowService,
    private readonly accommodation: AccommodationFlowService,
    @Inject(forwardRef(() => HelpFlowService))
    private readonly help: HelpFlowService,
  ) {}

  /** `welcome` — primeira interação: apresentação + menu numa única mensagem. */
  async showRootMenu(
    waId: string,
    waUserId: string,
    welcome?: { firstName?: string | null },
  ) {
    await this.session.setMenuState(waUserId, BotMenuState.ROOT);
    const body = welcome
      ? buildWelcomeMenuBody(welcome.firstName)
      : 'O que você precisa?';
    await this.whatsapp.sendList(
      waId,
      body,
      'Menu principal',
      [
        {
          title: 'Menu',
          rows: [
            {
              id: BOT_BUTTON_IDS.SPORTS,
              title: '⚽ Esportes',
              description: 'Placar, jogos, classificação',
            },
            {
              id: BOT_BUTTON_IDS.FESTAS,
              title: '🎉 Festas',
              description: 'Programação e local',
            },
            {
              id: BOT_BUTTON_IDS.ALERTS,
              title: '🔔 Avisos',
              description: 'Notificações do Inter',
            },
            {
              id: BOT_BUTTON_IDS.CHALLENGES,
              title: '🎯 Desafios',
              description: 'Horários e locais',
            },
            {
              id: BOT_BUTTON_IDS.ATLETICA,
              title: '🏛 Atlética',
              description: 'Jogos e desafios da sua atlética',
            },
            {
              id: BOT_BUTTON_IDS.ACCOMMODATION,
              title: '🏠 Alojamentos',
              description: 'Onde ficar e serviços perto',
            },
            {
              id: BOT_BUTTON_IDS.HELP,
              title: '💬 Ajuda',
              description: 'Tire dúvidas com a chaminha',
            },
          ],
        },
      ],
    );
  }

  async route(
    waId: string,
    waUserId: string,
    input: string,
    menuState: string,
  ): Promise<void> {
    const normalized = input.trim().toLowerCase();

    if (
      input === BOT_BUTTON_IDS.HELP ||
      menuState === BotMenuState.HELP_ACTIVE ||
      menuState === BotMenuState.HELP_FEEDBACK ||
      menuState === BotMenuState.HELP_SUGGESTION
    ) {
      if (input === BOT_BUTTON_IDS.HELP) {
        return this.help.startHelp(waId, waUserId);
      }
      return this.help.handle(waId, waUserId, input, menuState);
    }

    if (
      !isBotButtonOrCommand(input) &&
      matchesGreeting(normalized)
    ) {
      return this.showRootMenu(waId, waUserId);
    }

    if (normalized === BOT_BUTTON_IDS.BACK || normalized === 'voltar') {
      return this.showRootMenu(waId, waUserId);
    }

    switch (input) {
      case BOT_BUTTON_IDS.SPORTS:
        return this.sports.showSportsMenu(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS:
        return this.festas.showFestasMenu(waId, waUserId);
      case BOT_BUTTON_IDS.ALERTS:
        return this.alerts.showAlertsMenu(waId, waUserId);
      case BOT_BUTTON_IDS.CHALLENGES:
        return this.challenges.showChallenges(waId, waUserId);
      case BOT_BUTTON_IDS.ATLETICA:
        return this.atletica.showAtleticaPrompt(waId, waUserId);
      case BOT_BUTTON_IDS.ACCOMMODATION:
        return this.accommodation.showCampusPrompt(waId, waUserId);
      case BOT_BUTTON_IDS.ACC_MARMITA:
        return this.accommodation.showNearby(
          waId,
          waUserId,
          LocalGuidePlaceType.MARMITA,
        );
      case BOT_BUTTON_IDS.ACC_PHARMACY:
        return this.accommodation.showNearby(
          waId,
          waUserId,
          LocalGuidePlaceType.PHARMACY,
        );
      case BOT_BUTTON_IDS.ACC_HOSPITAL:
        return this.accommodation.showNearby(
          waId,
          waUserId,
          LocalGuidePlaceType.HOSPITAL,
        );
      case BOT_BUTTON_IDS.ACC_FAST_FOOD:
        return this.accommodation.showNearby(
          waId,
          waUserId,
          LocalGuidePlaceType.FAST_FOOD,
        );
      case BOT_BUTTON_IDS.HELP:
        return this.help.startHelp(waId, waUserId);
      case BOT_BUTTON_IDS.SOS:
        return this.triggerLieuSos(waId, waUserId);
      case BOT_BUTTON_IDS.LIVE_SCORE:
        return this.sports.sendLiveScores(waId, waUserId);
      case BOT_BUTTON_IDS.UPCOMING:
        return this.sports.sendUpcoming(waId, waUserId);
      case BOT_BUTTON_IDS.BRACKET:
        return this.sports.sendBracket(waId, waUserId);
      case BOT_BUTTON_IDS.STANDINGS:
        return this.sports.sendStandings(waId, waUserId);
      case BOT_BUTTON_IDS.SPORTS_VENUES:
        return this.sports.sendVenues(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_TODAY:
        return this.festas.sendTodaySchedule(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_TENDA:
        return this.festas.sendLocationInfo(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_NEARBY:
        return this.festas.sendNearbyServices(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_LINEUP:
        return this.festas.sendLineupOverview(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_PROMO:
        return this.festas.sendPromo(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_PASSPORT:
        return this.festas.sendPassportLink(waId, waUserId);
      case BOT_BUTTON_IDS.FESTAS_DAY_1:
        return this.festas.sendDayByIndex(waId, waUserId, 1);
      case BOT_BUTTON_IDS.FESTAS_DAY_2:
        return this.festas.sendDayByIndex(waId, waUserId, 2);
      case BOT_BUTTON_IDS.FESTAS_DAY_3:
        return this.festas.sendDayByIndex(waId, waUserId, 3);
      case BOT_BUTTON_IDS.OPT_IN_YES:
        return this.alerts.optIn(waId, waUserId);
      case BOT_BUTTON_IDS.OPT_IN_NO:
        return this.alerts.optOut(waId, waUserId);
      case BOT_BUTTON_IDS.ALERTS_ATLETICAS:
        return this.alerts.showAtleticaSelection(waId, waUserId);
      default:
        break;
    }

    if (menuState.startsWith('alerts')) {
      return this.alerts.handleText(waId, waUserId, input);
    }

    if (
      menuState.startsWith('atletica') ||
      input.startsWith('atletica_')
    ) {
      return this.atletica.handleText(waId, waUserId, input, menuState);
    }

    if (
      menuState.startsWith('accommodation') ||
      input.startsWith('acc_')
    ) {
      return this.accommodation.handleText(waId, waUserId, input);
    }

    if (menuState.startsWith('sports')) {
      if (/classifica|ranking|tabela|pontua/.test(normalized)) {
        return this.sports.sendStandings(waId, waUserId);
      }
      return this.sports.handleText(waId, waUserId, input, menuState);
    }
    if (menuState.startsWith('festas')) {
      return this.festas.handleText(waId, waUserId, input);
    }

    if (
      menuState.startsWith('challenges') ||
      input.startsWith('challenge_')
    ) {
      return this.challenges.handleText(waId, waUserId, input);
    }

    if (/ajuda|duvida|dúvida|pergunta|help/.test(normalized)) {
      return this.help.startHelp(waId, waUserId);
    }

    const keyword = this.matchKeyword(normalized);
    if (keyword === 'sports') return this.sports.showSportsMenu(waId, waUserId);
    if (keyword === 'festas') return this.festas.showFestasMenu(waId, waUserId);
    if (keyword === 'atletica') {
      return this.atletica.showAtleticaPrompt(waId, waUserId);
    }
    if (keyword === 'accommodation') {
      return this.accommodation.showCampusPrompt(waId, waUserId);
    }
    if (keyword === 'challenges') {
      return this.challenges.showChallenges(waId, waUserId);
    }
    if (keyword === 'alerts') return this.alerts.showAlertsMenu(waId, waUserId);

    if (menuState === BotMenuState.ROOT) {
      return this.showRootMenu(waId, waUserId);
    }

    await this.whatsapp.sendList(waId, 'Não entendi. Escolha uma opção:', 'Ver opções', [
      {
        title: 'Atalhos',
        rows: [
          {
            id: BOT_BUTTON_IDS.SPORTS,
            title: '⚽ Esportes',
            description: 'Placar e jogos',
          },
          {
            id: BOT_BUTTON_IDS.HELP,
            title: '💬 Ajuda',
            description: 'Tirar dúvidas',
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

  private matchKeyword(text: string): string | null {
    if (/jogo|placar|futsal|vôlei|volei|basquete|ginásio|ginasio/.test(text)) {
      return 'sports';
    }
    if (/tenda|festa|show|lineup|dj|headliner/.test(text)) return 'festas';
    if (/atlética|atletica/.test(text)) return 'atletica';
    if (/alojamento|hospedagem|onde ficar/.test(text)) return 'accommodation';
    if (/desafio/.test(text)) return 'challenges';
    if (/aviso|alerta|notifica/.test(text)) return 'alerts';
    return null;
  }

  async triggerLieuSos(waId: string, waUserId: string) {
    await this.session.setMenuState(waUserId, BotMenuState.ROOT);
    await this.session.setMode(waUserId, 'human');
    await this.prisma.handoffMessage.create({
      data: {
        waUserId,
        direction: 'inbound',
        content: '[SOS] Usuário solicitou atendimento humano Lieu',
      },
    });
    await this.whatsapp.sendText({
      to: waId,
      body:
        '🆘 *Atendimento Lieu*\n\n' +
        'Em instantes alguém da *Lieu* assume este chat.\n\n' +
        'Enquanto isso, conte o que aconteceu — local, atlética e o que você precisa.',
    });
  }
}
