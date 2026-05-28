import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminRole,
  canGrantAuthorizationRole,
  canManageAuthorizations,
  isHigherAuthorizationRole,
} from '@chama/shared';
import { PrismaService } from '../prisma/prisma.service';

export type AllowedEmailEntry = {
  email: string;
  name: string;
  role: string;
  venueId?: string | null;
};

@Injectable()
export class AllowedEmailsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AllowedEmailEntry | undefined> {
    const normalized = email.trim().toLowerCase();
    const row = await this.prisma.allowedEmail.findUnique({
      where: { email: normalized },
    });
    if (!row) return undefined;
    return {
      email: row.email,
      name: row.name,
      role: row.role,
      venueId: row.venueId,
    };
  }

  async list() {
    return this.prisma.allowedEmail.findMany({
      include: {
        venue: { select: { id: true, name: true } },
        addedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
    });
  }

  async add(
    actor: { id: string; role: string },
    dto: {
      email: string;
      role: string;
      name?: string;
      venueId?: string | null;
    },
  ) {
    if (!canManageAuthorizations(actor.role)) {
      throw new ForbiddenException('Sem permissão para gerenciar autorizações');
    }

    const normalized = dto.email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Informe um e-mail válido');
    }

    if (!canGrantAuthorizationRole(actor.role, dto.role)) {
      throw new ForbiddenException('Você não pode autorizar este cargo');
    }

    if (dto.role === AdminRole.VENUE_COORDINATOR && !dto.venueId) {
      throw new BadRequestException(
        'Selecione a praça esportiva para C.O. Praça',
      );
    }

    const displayName =
      dto.name?.trim() || defaultName(normalized);

    const existing = await this.prisma.allowedEmail.findUnique({
      where: { email: normalized },
    });

    if (
      existing &&
      isHigherAuthorizationRole(existing.role, dto.role)
    ) {
      return {
        skipped: true as const,
        reason:
          'Este e-mail já possui um cargo igual ou superior na lista. Nenhuma alteração foi feita.',
        entry: existing,
      };
    }

    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (
      adminUser &&
      isHigherAuthorizationRole(adminUser.role, dto.role)
    ) {
      return {
        skipped: true as const,
        reason:
          'Este usuário já possui um cargo superior no sistema. Nenhuma alteração foi feita.',
        entry: existing ?? null,
      };
    }

    const data = {
      email: normalized,
      name: displayName,
      role: dto.role,
      venueId:
        dto.role === AdminRole.VENUE_COORDINATOR ? dto.venueId ?? null : null,
      addedById: actor.id,
    };

    const entry = existing
      ? await this.prisma.allowedEmail.update({
          where: { id: existing.id },
          data,
          include: {
            venue: { select: { id: true, name: true } },
            addedBy: { select: { id: true, name: true, email: true } },
          },
        })
      : await this.prisma.allowedEmail.create({
          data,
          include: {
            venue: { select: { id: true, name: true } },
            addedBy: { select: { id: true, name: true, email: true } },
          },
        });

    return { skipped: false as const, entry };
  }

  async remove(actor: { id: string; role: string }, id: string) {
    if (!canManageAuthorizations(actor.role)) {
      throw new ForbiddenException('Sem permissão para gerenciar autorizações');
    }

    const entry = await this.prisma.allowedEmail.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException('Autorização não encontrada');
    }

    if (!canGrantAuthorizationRole(actor.role, entry.role)) {
      throw new ForbiddenException('Você não pode revogar este cargo');
    }

    await this.prisma.allowedEmail.delete({ where: { id } });
    return { ok: true };
  }
}

function defaultName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
