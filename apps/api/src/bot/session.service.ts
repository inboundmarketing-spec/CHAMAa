import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionMode, BotMenuState } from '@chama/shared';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUser(waId: string, name?: string) {
    return this.prisma.waUser.upsert({
      where: { waId },
      update: name ? { name } : {},
      create: { waId, name },
      include: { session: true },
    });
  }

  async peekSession(waUserId: string) {
    return this.prisma.conversationSession.findUnique({
      where: { waUserId },
    });
  }

  async ensureSession(waUserId: string) {
    return this.prisma.conversationSession.upsert({
      where: { waUserId },
      update: {},
      create: {
        waUserId,
        mode: SessionMode.BOT,
        menuState: BotMenuState.ROOT,
      },
    });
  }

  async touchSession(waUserId: string) {
    return this.prisma.conversationSession.update({
      where: { waUserId },
      data: { lastMessageAt: new Date() },
    });
  }

  /** @deprecated Prefira peekSession + touchSession no orchestrator. */
  async getOrCreateSession(waUserId: string) {
    const existing = await this.peekSession(waUserId);
    if (existing) {
      return this.touchSession(waUserId);
    }
    return this.ensureSession(waUserId);
  }

  async setMenuState(waUserId: string, menuState: string) {
    return this.prisma.conversationSession.update({
      where: { waUserId },
      data: { menuState, lastMessageAt: new Date() },
    });
  }

  async setAtletica(
    waUserId: string,
    atleticaId: string,
    campusId: string,
  ) {
    return this.prisma.conversationSession.update({
      where: { waUserId },
      data: {
        atleticaId,
        campusId,
        lastMessageAt: new Date(),
      },
    });
  }

  async setMode(waUserId: string, mode: string, assignedTo?: string) {
    return this.prisma.conversationSession.update({
      where: { waUserId },
      data: { mode, assignedTo, lastMessageAt: new Date() },
    });
  }

  async isHumanMode(waUserId: string): Promise<boolean> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { waUserId },
    });
    return session?.mode === SessionMode.HUMAN;
  }

  /** Simulador: sai do modo SOS/humano para o bot voltar a responder. */
  async resetForSimulator(waUserId: string) {
    const session = await this.prisma.conversationSession.findUnique({
      where: { waUserId },
    });
    if (!session || session.mode !== SessionMode.HUMAN) return;

    await this.prisma.helpSession.updateMany({
      where: { waUserId, status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });
    await this.prisma.conversationSession.update({
      where: { waUserId },
      data: {
        mode: SessionMode.BOT,
        menuState: BotMenuState.ROOT,
        assignedTo: null,
      },
    });
  }

  /** Simulador: zera sessão (bot + menu + ajuda). */
  async fullResetForSimulator(waUserId: string) {
    await this.prisma.helpSession.updateMany({
      where: { waUserId, status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });
    await this.prisma.conversationSession.upsert({
      where: { waUserId },
      update: {
        mode: SessionMode.BOT,
        menuState: BotMenuState.ROOT,
        assignedTo: null,
        lastMessageAt: new Date(0),
      },
      create: {
        waUserId,
        mode: SessionMode.BOT,
        menuState: BotMenuState.ROOT,
        lastMessageAt: new Date(0),
      },
    });
  }
}
