import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  AdminRole,
  canManageBroadcasts,
  canManageFestas,
  hasFullAccess,
  isNeutralRole,
  isVenueCoordinatorRole,
} from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRequestUser } from '../auth/admin-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StandingsService } from './standings.service';

type DashboardCard = {
  label: string;
  value: number;
  href?: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  mesa_lieu: 'Mesa da Lieu',
  co_director: 'Diretor C.O.',
  criativa: 'Criativa',
  moderator: 'Moderador',
  agent: 'Agente',
  venue_coordinator: 'C.O. Praça',
  neutral: 'Neutro',
};

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
  ) {}

  @Get()
  async stats(@Req() req: { user: AdminRequestUser }) {
    const user = req.user;
    const role = user.role;
    const cards = await this.buildCards(user);
    const topStandings = await this.topStandings(5);

    return {
      role,
      roleLabel: ROLE_LABELS[role] ?? role,
      cards,
      topStandings,
    };
  }

  private async topStandings(limit: number) {
    const rows = await this.standings.list();
    return rows.slice(0, limit).map((r) => ({
      position: r.position,
      team: r.team,
      points: r.points,
      played: r.played,
    }));
  }

  private async buildCards(user: AdminRequestUser): Promise<DashboardCard[]> {
    const role = user.role;

    if (isVenueCoordinatorRole(role)) {
      return this.venueCoordinatorCards(user);
    }

    if (isNeutralRole(role)) {
      return this.neutralCards(user);
    }

    if (role === AdminRole.CO_DIRECTOR) {
      return this.coDirectorCards();
    }

    if (role === AdminRole.CRIATIVA) {
      return this.criativaCards();
    }

    if (role === AdminRole.MODERATOR || role === AdminRole.AGENT) {
      return this.agentCards();
    }

    if (hasFullAccess(role)) {
      return this.fullAccessCards();
    }

    return [];
  }

  private async fullAccessCards(): Promise<DashboardCard[]> {
    const [liveMatches, handoffQueue, pendingInstagram, optIns] =
      await Promise.all([
        this.prisma.match.count({ where: { status: 'live' } }),
        this.prisma.conversationSession.count({ where: { mode: 'human' } }),
        this.prisma.instagramMediaQueue.count({ where: { status: 'pending' } }),
        this.prisma.notificationOptIn.count({ where: { active: true } }),
      ]);

    return [
      { label: 'Jogos ao vivo', value: liveMatches, href: '/matches' },
      { label: 'Fila SOS', value: handoffQueue, href: '/handoff' },
      { label: 'Instagram pendente', value: pendingInstagram, href: '/instagram' },
      { label: 'Opt-in avisos', value: optIns },
    ];
  }

  private async coDirectorCards(): Promise<DashboardCard[]> {
    const [liveMatches, scheduledToday, pendingClosures, finishedToday] =
      await Promise.all([
        this.prisma.match.count({ where: { status: 'live' } }),
        this.scheduledTodayCount(),
        this.prisma.matchClosureRequest.count({ where: { status: 'pending' } }),
        this.finishedTodayCount(),
      ]);

    return [
      { label: 'Jogos ao vivo', value: liveMatches, href: '/matches' },
      { label: 'Jogos hoje', value: scheduledToday, href: '/matches' },
      {
        label: 'Encerramentos pendentes',
        value: pendingClosures,
        href: '/authorizations?tab=operations',
      },
      { label: 'Finalizados hoje', value: finishedToday, href: '/matches' },
    ];
  }

  private async criativaCards(): Promise<DashboardCard[]> {
    const [pendingInstagram, optIns, liveMatches] = await Promise.all([
      this.prisma.instagramMediaQueue.count({ where: { status: 'pending' } }),
      this.prisma.notificationOptIn.count({ where: { active: true } }),
      this.prisma.match.count({ where: { status: 'live' } }),
    ]);

    const cards: DashboardCard[] = [
      { label: 'Instagram pendente', value: pendingInstagram, href: '/instagram' },
      { label: 'Opt-in avisos', value: optIns },
    ];

    if (canManageBroadcasts(AdminRole.CRIATIVA)) {
      cards.unshift({ label: 'Jogos ao vivo', value: liveMatches, href: '/matches' });
    }

    return cards;
  }

  private async agentCards(): Promise<DashboardCard[]> {
    const [handoffQueue, liveMatches, helpOpen] = await Promise.all([
      this.prisma.conversationSession.count({ where: { mode: 'human' } }),
      this.prisma.match.count({ where: { status: 'live' } }),
      this.prisma.helpSession.count({ where: { status: 'active' } }),
    ]);

    return [
      { label: 'Fila SOS', value: handoffQueue, href: '/handoff' },
      { label: 'Jogos ao vivo', value: liveMatches, href: '/matches' },
      { label: 'Ajuda em andamento', value: helpOpen, href: '/help-feedback' },
    ];
  }

  private async venueCoordinatorCards(
    user: AdminRequestUser,
  ): Promise<DashboardCard[]> {
    const venueFilter = user.venueId ? { venueId: user.venueId } : { id: '__none__' };

    const [liveMatches, scheduledToday, pendingClosures, assignedNeutrals] =
      await Promise.all([
        this.prisma.match.count({
          where: { ...venueFilter, status: 'live' },
        }),
        this.prisma.match.count({
          where: {
            ...venueFilter,
            scheduledAt: { gte: startOfToday(), lt: endOfToday() },
            status: { in: ['scheduled', 'live', 'delayed'] },
          },
        }),
        this.prisma.matchClosureRequest.count({
          where: {
            status: 'pending',
            match: venueFilter,
          },
        }),
        user.venueId
          ? this.prisma.matchAssignment.count({
              where: { match: { venueId: user.venueId } },
            })
          : Promise.resolve(0),
      ]);

    return [
      { label: 'Ao vivo na praça', value: liveMatches, href: '/matches' },
      { label: 'Partidas hoje', value: scheduledToday, href: '/matches' },
      {
        label: 'Encerramentos pendentes',
        value: pendingClosures,
        href: '/authorizations?tab=operations',
      },
      {
        label: 'Neutros atribuídos',
        value: assignedNeutrals,
        href: '/authorizations?tab=operations',
      },
    ];
  }

  private async neutralCards(user: AdminRequestUser): Promise<DashboardCard[]> {
    const [liveMatches, assignedLive, pendingMyClosure] = await Promise.all([
      this.prisma.match.count({ where: { status: 'live' } }),
      this.prisma.match.count({
        where: {
          status: 'live',
          assignments: { some: { adminUserId: user.id } },
        },
      }),
      this.prisma.matchClosureRequest.count({
        where: { status: 'pending', requestedById: user.id },
      }),
    ]);

    return [
      { label: 'Jogos ao vivo (geral)', value: liveMatches, href: '/matches' },
      {
        label: 'Ao vivo (suas partidas)',
        value: assignedLive,
        href: '/matches',
      },
      {
        label: 'Suas solicitações pendentes',
        value: pendingMyClosure,
        href: '/authorizations?tab=operations',
      },
    ];
  }

  private scheduledTodayCount() {
    return this.prisma.match.count({
      where: {
        scheduledAt: { gte: startOfToday(), lt: endOfToday() },
        status: { in: ['scheduled', 'live', 'delayed'] },
      },
    });
  }

  private finishedTodayCount() {
    return this.prisma.match.count({
      where: {
        status: 'finished',
        updatedAt: { gte: startOfToday() },
      },
    });
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
