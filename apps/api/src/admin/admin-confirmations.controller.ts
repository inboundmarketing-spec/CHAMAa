import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AdminRole, ClosureRequestStatus, isPlacementModalidade } from '@chama/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AdminRequestUser,
  hasFullAccess,
  isCoordinatorAuthorized,
  isNeutralRole,
  isVenueCoordinatorRole,
} from '../auth/admin-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { recordGameEndedAt } from './match-incident.service';
import { StandingsService } from './standings.service';

class AssignNeutralDto {
  @IsString()
  matchId!: string;

  @IsString()
  neutralUserId!: string;
}

class CreateClosureRequestDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;
}

class AuthorizeCoordinatorDto {
  @IsString()
  coordinatorId!: string;
}

@Controller('api/admin/confirmations')
@UseGuards(JwtAuthGuard)
export class AdminConfirmationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly standings: StandingsService,
    @InjectQueue('match-alerts') private readonly alertQueue: Queue,
  ) {}

  @Get()
  async list(@Req() req: { user: AdminRequestUser }) {
    const user = req.user;

    if (isNeutralRole(user.role)) {
      const requests = await this.prisma.matchClosureRequest.findMany({
        where: { requestedById: user.id },
        include: {
          match: {
            include: {
              modalidade: true,
              venue: true,
              participants: { orderBy: { sortOrder: 'asc' } },
            },
          },
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return { closureRequests: requests, assignments: [] };
    }

    if (isVenueCoordinatorRole(user.role)) {
      const authorized =
        user.venueId &&
        (await isCoordinatorAuthorized(
          this.prisma,
          user.id,
          user.venueId,
        ));

      const matchFilter = user.venueId ? { venueId: user.venueId } : { id: '__none__' };

      const [closureRequests, assignments, neutrals] = await Promise.all([
        this.prisma.matchClosureRequest.findMany({
          where: {
            status: ClosureRequestStatus.PENDING,
            match: matchFilter,
          },
          include: {
            match: {
              include: {
                modalidade: true,
                venue: true,
                participants: { orderBy: { sortOrder: 'asc' } },
              },
            },
            requestedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.matchAssignment.findMany({
          where: { match: matchFilter },
          include: {
            match: {
              include: { modalidade: true, venue: true },
            },
            adminUser: { select: { id: true, name: true, email: true } },
            assignedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.adminUser.findMany({
          where: { role: AdminRole.NEUTRAL },
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' },
        }),
      ]);

      return {
        closureRequests,
        assignments,
        neutrals,
        venueAuthorized: Boolean(authorized),
      };
    }

    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }

    const matchFilter = {};

    const [closureRequests, assignments, neutrals, coordinators, venueAuthorizations] =
      await Promise.all([
      this.prisma.matchClosureRequest.findMany({
        where: {
          status: ClosureRequestStatus.PENDING,
          match: matchFilter,
        },
        include: {
          match: {
            include: {
              modalidade: true,
              venue: true,
              participants: { orderBy: { sortOrder: 'asc' } },
            },
          },
          requestedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.matchAssignment.findMany({
        where: { match: matchFilter },
        include: {
          match: {
            include: {
              modalidade: true,
              venue: true,
              participants: { orderBy: { sortOrder: 'asc' } },
            },
          },
          adminUser: { select: { id: true, name: true, email: true } },
          assignedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminUser.findMany({
        where: { role: AdminRole.NEUTRAL },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.adminUser.findMany({
        where: { role: AdminRole.VENUE_COORDINATOR, venueId: { not: null } },
        select: {
          id: true,
          name: true,
          email: true,
          venueId: true,
          venue: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.venueCoordinatorAuthorization.findMany({
        include: {
          coordinator: {
            select: { id: true, name: true, email: true },
          },
          venue: { select: { id: true, name: true } },
          authorizedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      closureRequests,
      assignments,
      neutrals,
      coordinators,
      venueAuthorizations,
    };
  }

  @Post('venue-authorizations')
  async authorizeCoordinator(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: AuthorizeCoordinatorDto,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException(
        'Apenas Diretor C.O., Mesa ou Criativa podem autorizar C.O. da praça',
      );
    }

    const coordinator = await this.prisma.adminUser.findUnique({
      where: { id: dto.coordinatorId },
    });
    if (
      !coordinator ||
      coordinator.role !== AdminRole.VENUE_COORDINATOR ||
      !coordinator.venueId
    ) {
      throw new NotFoundException('C.O. da praça não encontrado');
    }

    return this.prisma.venueCoordinatorAuthorization.upsert({
      where: {
        coordinatorId_venueId: {
          coordinatorId: coordinator.id,
          venueId: coordinator.venueId,
        },
      },
      create: {
        coordinatorId: coordinator.id,
        venueId: coordinator.venueId,
        authorizedById: user.id,
      },
      update: { authorizedById: user.id },
      include: {
        coordinator: { select: { id: true, name: true, email: true } },
        venue: { select: { id: true, name: true } },
        authorizedBy: { select: { id: true, name: true } },
      },
    });
  }

  @Delete('venue-authorizations/:id')
  async revokeCoordinatorAuthorization(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }

    const auth = await this.prisma.venueCoordinatorAuthorization.findUnique({
      where: { id },
    });
    if (!auth) throw new NotFoundException('Autorização não encontrada');

    await this.prisma.venueCoordinatorAuthorization.delete({ where: { id } });
    return { ok: true };
  }

  @Post('assignments')
  async assignNeutral(
    @Req() req: { user: AdminRequestUser },
    @Body() dto: AssignNeutralDto,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role) && !isVenueCoordinatorRole(user.role)) {
      throw new ForbiddenException('Apenas C.O. da praça pode atribuir neutros');
    }

    if (isVenueCoordinatorRole(user.role)) {
      if (!user.venueId) {
        throw new ForbiddenException('Sua conta não está vinculada a uma praça');
      }
      const authorized = await isCoordinatorAuthorized(
        this.prisma,
        user.id,
        user.venueId,
      );
      if (!authorized) {
        throw new ForbiddenException(
          'Aguarde autorização do Diretor C.O., Mesa ou Criativa para atribuir neutros',
        );
      }
    }

    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
    });
    if (!match) throw new NotFoundException('Partida não encontrada');

    if (
      isVenueCoordinatorRole(user.role) &&
      match.venueId !== user.venueId
    ) {
      throw new ForbiddenException('Partida fora da sua praça');
    }

    const neutral = await this.prisma.adminUser.findUnique({
      where: { id: dto.neutralUserId },
    });
    if (!neutral || neutral.role !== AdminRole.NEUTRAL) {
      throw new NotFoundException('Neutro não encontrado');
    }

    return this.prisma.matchAssignment.upsert({
      where: {
        matchId_adminUserId: {
          matchId: dto.matchId,
          adminUserId: dto.neutralUserId,
        },
      },
      create: {
        matchId: dto.matchId,
        adminUserId: dto.neutralUserId,
        assignedById: user.id,
      },
      update: {},
      include: {
        match: { include: { modalidade: true, venue: true } },
        adminUser: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    });
  }

  @Delete('assignments/:id')
  async revokeAssignment(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role) && !isVenueCoordinatorRole(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }

    const assignment = await this.prisma.matchAssignment.findUnique({
      where: { id },
      include: { match: true },
    });
    if (!assignment) throw new NotFoundException('Atribuição não encontrada');

    if (
      isVenueCoordinatorRole(user.role) &&
      assignment.match.venueId !== user.venueId
    ) {
      throw new ForbiddenException('Atribuição fora da sua praça');
    }

    await this.prisma.matchAssignment.delete({ where: { id } });
    return { ok: true };
  }

  @Post('closure-requests/:matchId')
  async requestClosure(
    @Req() req: { user: AdminRequestUser },
    @Param('matchId') matchId: string,
    @Body() dto: CreateClosureRequestDto,
  ) {
    const user = req.user;
    if (!isNeutralRole(user.role)) {
      throw new ForbiddenException('Apenas neutros solicitam encerramento');
    }

    const assignment = await this.prisma.matchAssignment.findUnique({
      where: {
        matchId_adminUserId: { matchId, adminUserId: user.id },
      },
      include: { match: { include: { modalidade: true, participants: true } } },
    });
    if (!assignment) {
      throw new ForbiddenException('Você não tem acesso a esta partida');
    }

    const placement = isPlacementModalidade(
      assignment.match.modalidade.slug,
      assignment.match.modalidade.scoringMode,
    );
    if (placement) {
      const ranked = assignment.match.participants.filter(
        (p) => p.placement != null && p.placement > 0,
      );
      if (ranked.length < 1) {
        throw new ForbiddenException(
          'Registre as colocações antes de solicitar encerramento',
        );
      }
    }

    const existing = await this.prisma.matchClosureRequest.findFirst({
      where: {
        matchId,
        requestedById: user.id,
        status: ClosureRequestStatus.PENDING,
      },
    });
    if (existing) {
      throw new ForbiddenException('Já existe uma solicitação pendente');
    }

    return this.prisma.matchClosureRequest.create({
      data: {
        matchId,
        requestedById: user.id,
        homeScore: dto.homeScore ?? 0,
        awayScore: dto.awayScore ?? 0,
      },
      include: {
        match: {
          include: {
            modalidade: true,
            venue: true,
            participants: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }

  @Patch('closure-requests/:id/approve')
  async approveClosure(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role) && !isVenueCoordinatorRole(user.role)) {
      throw new ForbiddenException('Apenas C.O. da praça pode aprovar');
    }

    const request = await this.prisma.matchClosureRequest.findUnique({
      where: { id },
      include: { match: { include: { modalidade: true } } },
    });
    if (!request || request.status !== ClosureRequestStatus.PENDING) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (
      isVenueCoordinatorRole(user.role) &&
      request.match.venueId !== user.venueId
    ) {
      throw new ForbiddenException('Partida fora da sua praça');
    }

    const placement = isPlacementModalidade(
      request.match.modalidade.slug,
      request.match.modalidade.scoringMode,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.update({
        where: { id: request.matchId },
        data: placement
          ? { status: 'finished' }
          : {
              homeScore: request.homeScore,
              awayScore: request.awayScore,
              status: 'finished',
            },
        include: {
          venue: true,
          modalidade: true,
          participants: { orderBy: { sortOrder: 'asc' } },
        },
      });

      await tx.matchClosureRequest.update({
        where: { id },
        data: {
          status: ClosureRequestStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });

      return match;
    });

    await recordGameEndedAt(this.prisma, request.matchId);
    void this.standings.recalculateFromMatches().catch(() => undefined);

    await this.alertQueue.add('match-updated', {
      matchId: request.matchId,
      venueChanged: false,
      statusChanged: 'finished',
      scoreChanged: true,
    });

    return updated;
  }

  @Patch('closure-requests/:id/reject')
  async rejectClosure(
    @Req() req: { user: AdminRequestUser },
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!hasFullAccess(user.role) && !isVenueCoordinatorRole(user.role)) {
      throw new ForbiddenException('Apenas C.O. da praça pode rejeitar');
    }

    const request = await this.prisma.matchClosureRequest.findUnique({
      where: { id },
      include: { match: true },
    });
    if (!request || request.status !== ClosureRequestStatus.PENDING) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (
      isVenueCoordinatorRole(user.role) &&
      request.match.venueId !== user.venueId
    ) {
      throw new ForbiddenException('Partida fora da sua praça');
    }

    return this.prisma.matchClosureRequest.update({
      where: { id },
      data: {
        status: ClosureRequestStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });
  }
}
