import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  campusTeamNamesFromAtleticas,
  matchInvolvesCampusTeams,
} from '../alerts/sports-alert-match.util';
import {
  formatMatchScoreLabel,
  formatMatchTeamsLabel,
} from '../admin/match-display.util';

export interface MatchUpdatedJob {
  matchId: string;
  venueChanged?: boolean;
  statusChanged?: string;
  scoreChanged?: boolean;
}

@Injectable()
export class MatchAlertService {
  private readonly logger = new Logger(MatchAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async processUpdate(job: MatchUpdatedJob) {
    const match = await this.prisma.match.findUnique({
      where: { id: job.matchId },
      include: {
        modalidade: true,
        venue: true,
        participants: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!match) return;

    const teamsLabel = formatMatchTeamsLabel(match);
    const scoreLabel = formatMatchScoreLabel(match);
    const prova = match.division ? ` (${match.division})` : '';

    let alertBody: string | null = null;

    if (job.venueChanged && match.venue) {
      alertBody =
        `⚠️ *Mudança de local*\n${match.modalidade.name}${prova}: ${teamsLabel}\nNovo local: ${match.venue.name} — ${match.venue.address}`;
    } else if (
      job.statusChanged === 'delayed' ||
      job.statusChanged === 'cancelled'
    ) {
      alertBody =
        `⚠️ *Jogo ${job.statusChanged === 'delayed' ? 'adiado' : 'cancelado'}*\n${match.modalidade.name}${prova}: ${teamsLabel}`;
    } else if (job.scoreChanged && match.status === 'live') {
      alertBody =
        `📊 *Resultado atualizado*\n${match.modalidade.name}${prova}\n${scoreLabel}`;
    }

    if (!alertBody) return;

    const subscribers = await this.prisma.sportsAlertAtletica.findMany({
      include: {
        waUser: true,
        atletica: { include: { campus: true } },
      },
    });

    const byUser = new Map<
      string,
      { waId: string; atleticas: { campus: { name: string } }[] }
    >();

    for (const sub of subscribers) {
      const existing = byUser.get(sub.waUserId);
      if (existing) {
        existing.atleticas.push(sub.atletica);
      } else {
        byUser.set(sub.waUserId, {
          waId: sub.waUser.waId,
          atleticas: [sub.atletica],
        });
      }
    }

    for (const { waId, atleticas } of byUser.values()) {
      const teams = campusTeamNamesFromAtleticas(atleticas);
      if (!matchInvolvesCampusTeams(match, teams)) continue;

      try {
        await this.whatsapp.sendText({ to: waId, body: alertBody });
      } catch (err) {
        this.logger.warn(`Falha alerta esportivo para ${waId}`, err);
      }
    }
  }
}
