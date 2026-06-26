import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SessionMode } from '@chama/shared';

@Injectable()
export class HandoffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async listQueue() {
    return this.prisma.conversationSession.findMany({
      where: { mode: SessionMode.HUMAN },
      include: {
        waUser: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async listHistory(opts?: { q?: string; limit?: number; skip?: number }) {
    const limit = Math.min(opts?.limit ?? 50, 100);
    const skip = opts?.skip ?? 0;
    const q = opts?.q?.trim();

    const active = await this.prisma.conversationSession.findMany({
      where: { mode: SessionMode.HUMAN },
      select: { waUserId: true },
    });
    const activeIds = new Set(active.map((s) => s.waUserId));

    const groups = await this.prisma.handoffMessage.groupBy({
      by: ['waUserId'],
      _max: { createdAt: true },
      _count: { id: true },
    });

    let closed = groups
      .filter((g) => !activeIds.has(g.waUserId))
      .sort(
        (a, b) =>
          (b._max.createdAt?.getTime() ?? 0) -
          (a._max.createdAt?.getTime() ?? 0),
      );

    if (q) {
      const needle = q.toLowerCase();
      const users = await this.prisma.waUser.findMany({
        where: { id: { in: closed.map((g) => g.waUserId) } },
        select: { id: true, waId: true, name: true },
      });
      const matchIds = new Set(
        users
          .filter(
            (u) =>
              u.waId.includes(needle) ||
              (u.name?.toLowerCase().includes(needle) ?? false),
          )
          .map((u) => u.id),
      );
      closed = closed.filter((g) => matchIds.has(g.waUserId));
    }

    const page = closed.slice(skip, skip + limit);
    const ids = page.map((g) => g.waUserId);
    if (ids.length === 0) return [];

    const [users, closures] = await Promise.all([
      this.prisma.waUser.findMany({ where: { id: { in: ids } } }),
      this.prisma.handoffClosure.findMany({
        where: { waUserId: { in: ids } },
        orderBy: { closedAt: 'desc' },
      }),
    ]);

    const userById = new Map(users.map((u) => [u.id, u]));
    const closedAtByUser = new Map<string, Date>();
    for (const c of closures) {
      if (!closedAtByUser.has(c.waUserId)) {
        closedAtByUser.set(c.waUserId, c.closedAt);
      }
    }

    return page.map((g) => {
      const u = userById.get(g.waUserId)!;
      const lastMessageAt = g._max.createdAt!;
      const closedAt = closedAtByUser.get(g.waUserId) ?? lastMessageAt;
      return {
        waUserId: g.waUserId,
        waUser: { id: u.id, waId: u.waId, name: u.name },
        messageCount: g._count.id,
        lastMessageAt: lastMessageAt.toISOString(),
        closedAt: closedAt.toISOString(),
      };
    });
  }

  getMessages(waUserId: string) {
    return this.prisma.handoffMessage.findMany({
      where: { waUserId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reply(waUserId: string, content: string, agentId: string) {
    const user = await this.prisma.waUser.findUnique({
      where: { id: waUserId },
    });
    if (!user) throw new Error('Usuário não encontrado');

    await this.whatsapp.sendText({ to: user.waId, body: content });
    await this.prisma.handoffMessage.create({
      data: {
        waUserId,
        direction: 'outbound',
        content,
        agentId,
      },
    });
    return { sent: true };
  }

  async close(waUserId: string) {
    const user = await this.prisma.waUser.findUnique({
      where: { id: waUserId },
    });
    if (user) {
      await this.whatsapp.sendText({
        to: user.waId,
        body: '✅ Atendimento encerrado. Digite *oi* para voltar ao menu automático.',
      });
    }
    await this.prisma.conversationSession.update({
      where: { waUserId },
      data: { mode: SessionMode.BOT, assignedTo: null },
    });
    await this.prisma.handoffClosure.create({ data: { waUserId } });
    return { closed: true };
  }

  async assign(waUserId: string, agentId: string) {
    return this.prisma.conversationSession.update({
      where: { waUserId },
      data: { assignedTo: agentId },
    });
  }
}
