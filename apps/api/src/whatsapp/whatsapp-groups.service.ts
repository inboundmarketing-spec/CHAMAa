import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

export type WhatsAppGroupDto = {
  id: string;
  waId: string;
  label: string;
  canSend: boolean;
  isRestricted: boolean;
  participantCount: number | null;
  active: boolean;
  lastSyncedAt: string | null;
};

type EvolutionGroupRow = {
  id?: string;
  subject?: string;
  restrict?: boolean;
  announcement?: boolean;
  size?: number;
  participants?: { id?: string; admin?: string | null }[];
};

@Injectable()
export class WhatsappGroupsService {
  private readonly logger = new Logger(WhatsappGroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async listGroups(sync = false): Promise<{
    provider: string;
    synced: boolean;
    groups: WhatsAppGroupDto[];
  }> {
    if (sync) {
      await this.syncFromProvider();
    }

    const rows = await this.prisma.broadcastTarget.findMany({
      where: { type: 'group' },
      orderBy: [{ canSend: 'desc' }, { label: 'asc' }],
    });

    return {
      provider: this.whatsapp.activeProvider,
      synced: sync,
      groups: rows.map((g) => ({
        id: g.id,
        waId: g.waId,
        label: g.label,
        canSend: g.canSend,
        isRestricted: g.isRestricted,
        participantCount: g.participantCount,
        active: g.active,
        lastSyncedAt: g.lastSyncedAt?.toISOString() ?? null,
      })),
    };
  }

  async syncFromProvider(): Promise<{ upserted: number }> {
    const provider = this.whatsapp.activeProvider;

    if (provider === 'evolution') {
      return this.syncFromEvolution();
    }

    if (provider === 'dev') {
      return this.syncDevMockGroups();
    }

    this.logger.warn(
      `Sincronização de grupos não disponível para provedor "${provider}". Cadastre alvos manualmente ou use Evolution no protótipo.`,
    );
    return { upserted: 0 };
  }

  private async syncDevMockGroups(): Promise<{ upserted: number }> {
    const mocks = [
      {
        waId: '120363000000000001@g.us',
        label: 'Grupo demo — Comissão',
        canSend: true,
        isRestricted: false,
        participantCount: 42,
      },
      {
        waId: '120363000000000002@g.us',
        label: 'Grupo demo — Atléticas (somente admins)',
        canSend: false,
        isRestricted: true,
        participantCount: 128,
      },
    ];
    let upserted = 0;
    const now = new Date();
    for (const m of mocks) {
      await this.prisma.broadcastTarget.upsert({
        where: { waId: m.waId },
        create: {
          waId: m.waId,
          label: m.label,
          type: 'group',
          active: true,
          canSend: m.canSend,
          isRestricted: m.isRestricted,
          participantCount: m.participantCount,
          lastSyncedAt: now,
        },
        update: {
          label: m.label,
          canSend: m.canSend,
          isRestricted: m.isRestricted,
          participantCount: m.participantCount,
          lastSyncedAt: now,
        },
      });
      upserted++;
    }
    return { upserted };
  }

  private async syncFromEvolution(): Promise<{ upserted: number }> {
    const baseURL = this.config.get('EVOLUTION_API_URL');
    const instance = this.config.get('EVOLUTION_INSTANCE', 'chama');
    const apiKey = this.config.get('EVOLUTION_API_KEY', '');
    if (!baseURL) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }

    const { data } = await axios.get<EvolutionGroupRow[] | { groups?: EvolutionGroupRow[] }>(
      `${baseURL.replace(/\/$/, '')}/group/fetchAllGroups/${instance}`,
      {
        params: { getParticipants: true },
        headers: {
          ...(apiKey ? { apikey: apiKey } : {}),
        },
      },
    );

    const rows = Array.isArray(data) ? data : (data.groups ?? []);
    const botJid = await this.resolveBotJid(baseURL, instance, apiKey);
    const now = new Date();
    let upserted = 0;

    for (const row of rows) {
      const waId = this.normalizeGroupJid(row.id);
      if (!waId) continue;

      const isRestricted = Boolean(row.restrict || row.announcement);
      const canSend = this.groupCanSend(row, botJid);
      const label =
        row.subject?.trim() ||
        `Grupo ${waId.replace('@g.us', '').slice(-8)}`;

      await this.prisma.broadcastTarget.upsert({
        where: { waId },
        create: {
          waId,
          label,
          type: 'group',
          active: true,
          canSend,
          isRestricted,
          participantCount: row.size ?? row.participants?.length ?? null,
          lastSyncedAt: now,
        },
        update: {
          label,
          canSend,
          isRestricted,
          participantCount: row.size ?? row.participants?.length ?? null,
          lastSyncedAt: now,
        },
      });
      upserted++;
    }

    return { upserted };
  }

  private groupCanSend(row: EvolutionGroupRow, botJid: string | null): boolean {
    const restricted = Boolean(row.restrict || row.announcement);
    if (!restricted) return true;
    if (!botJid || !row.participants?.length) return false;
    return row.participants.some(
      (p) =>
        p.id === botJid &&
        (p.admin === 'admin' || p.admin === 'superadmin'),
    );
  }

  private async resolveBotJid(
    baseURL: string,
    instance: string,
    apiKey: string,
  ): Promise<string | null> {
    try {
      const { data } = await axios.get<{ wuid?: string; owner?: string }>(
        `${baseURL.replace(/\/$/, '')}/instance/connectionState/${instance}`,
        { headers: { ...(apiKey ? { apikey: apiKey } : {}) } },
      );
      const raw = data.wuid ?? data.owner;
      if (!raw) return null;
      return raw.includes('@') ? raw : `${raw.replace(/\D/g, '')}@s.whatsapp.net`;
    } catch {
      return null;
    }
  }

  private normalizeGroupJid(id?: string): string | null {
    if (!id?.trim()) return null;
    const trimmed = id.trim();
    if (trimmed.includes('@g.us')) return trimmed;
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return null;
    return `${digits}@g.us`;
  }
}
