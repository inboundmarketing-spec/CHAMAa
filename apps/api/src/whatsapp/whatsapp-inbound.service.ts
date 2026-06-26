import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { BotOrchestratorService } from '../bot/bot-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';

export interface NormalizedInboundMessage {
  waId: string;
  messageId: string;
  text: string;
  contactName?: string;
}

@Injectable()
export class WhatsappInboundService {
  private readonly logger = new Logger(WhatsappInboundService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => BotOrchestratorService))
    private readonly bot: BotOrchestratorService,
  ) {}

  async handle(messages: NormalizedInboundMessage[]): Promise<void> {
    for (const message of messages) {
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { id: message.messageId },
      });
      if (existing) continue;

      await this.prisma.webhookEvent.create({
        data: { id: message.messageId },
      });

      await this.bot.handleIncomingMessage({
        waId: message.waId,
        messageId: message.messageId,
        text: message.text,
        contactName: message.contactName,
      });
    }
  }

  /** Payload Meta Cloud API */
  parseCloudWebhook(body: {
    object?: string;
    entry?: {
      changes: {
        field: string;
        value: {
          contacts?: { profile: { name: string }; wa_id: string }[];
          messages?: {
            id: string;
            from: string;
            type: string;
            text?: { body: string };
            interactive?: {
              button_reply?: { id: string };
              list_reply?: { id: string };
            };
          }[];
        };
      }[];
    }[];
  }): NormalizedInboundMessage[] {
    const result: NormalizedInboundMessage[] = [];
    if (body.object !== 'whatsapp_business_account') return result;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const contactName = value.contacts?.[0]?.profile?.name;

        for (const message of value.messages ?? []) {
          let text = '';
          if (message.type === 'text' && message.text) {
            text = message.text.body;
          } else if (message.type === 'interactive' && message.interactive) {
            text =
              message.interactive.button_reply?.id ??
              message.interactive.list_reply?.id ??
              '';
          }
          result.push({
            waId: message.from,
            messageId: message.id,
            text,
            contactName,
          });
        }
      }
    }
    return result;
  }

  /** Payload Evolution API v2 (messages.upsert) */
  parseEvolutionWebhook(body: Record<string, unknown>): NormalizedInboundMessage[] {
    const result: NormalizedInboundMessage[] = [];
    const event = body.event as string | undefined;
    if (event !== 'messages.upsert') return result;

    const data = body.data as Record<string, unknown> | undefined;
    if (!data || (data as { key?: { fromMe?: boolean } }).key?.fromMe) {
      return result;
    }

    const key = data.key as { remoteJid?: string; id?: string };
    const jid = key?.remoteJid ?? '';
    const waId = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    if (!waId || jid.includes('@g.us')) return result;

    const msg = data.message as Record<string, unknown> | undefined;
    let text = '';
    if (msg?.conversation) {
      text = String(msg.conversation);
    } else if (msg?.extendedTextMessage) {
      const ext = msg.extendedTextMessage as { text?: string };
      text = ext.text ?? '';
    } else if (msg?.buttonsResponseMessage) {
      const br = msg.buttonsResponseMessage as {
        selectedButtonId?: string;
        selectedDisplayText?: string;
      };
      text = br.selectedButtonId ?? br.selectedDisplayText ?? '';
    } else if (msg?.listResponseMessage) {
      const lr = msg.listResponseMessage as {
        singleSelectReply?: { selectedRowId?: string };
      };
      text = lr.singleSelectReply?.selectedRowId ?? '';
    }

    if (!text) return result;

    const pushName = data.pushName as string | undefined;
    result.push({
      waId,
      messageId: key.id ?? `evo-${Date.now()}`,
      text,
      contactName: pushName,
    });
    return result;
  }
}
