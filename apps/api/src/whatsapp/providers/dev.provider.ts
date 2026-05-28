import { Injectable, Logger } from '@nestjs/common';
import {
  IWhatsAppProvider,
  InteractiveButton,
  SendTextOptions,
} from '../interfaces/whatsapp-provider.interface';
import type { DevChatEntry } from './dev-chat.types';

/**
 * Protótipo / demo: não envia WhatsApp real.
 * Mensagens aparecem no log e no painel via GET /api/dev/chat-log.
 */
@Injectable()
export class DevWhatsAppProvider implements IWhatsAppProvider {
  readonly name = 'dev';
  private readonly logger = new Logger(DevWhatsAppProvider.name);

  static readonly chatLog: DevChatEntry[] = [];

  isConfigured(): boolean {
    return true;
  }

  private static pushEntry(entry: Omit<DevChatEntry, 'at'>) {
    DevWhatsAppProvider.chatLog.push({ ...entry, at: new Date() });
    if (DevWhatsAppProvider.chatLog.length > 200) {
      DevWhatsAppProvider.chatLog.shift();
    }
  }

  static clearLogFor(waId: string) {
    const normalized = waId.replace(/\D/g, '');
    const log = DevWhatsAppProvider.chatLog;
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].to.replace(/\D/g, '') === normalized) {
        log.splice(i, 1);
      }
    }
  }

  static logInbound(to: string, body: string, displayBody?: string) {
    DevWhatsAppProvider.pushEntry({
      to,
      direction: 'in',
      type: 'text',
      body: displayBody?.trim() ? displayBody : body,
    });
  }

  private log(entry: Omit<DevChatEntry, 'at' | 'direction'>) {
    DevWhatsAppProvider.pushEntry({ ...entry, direction: 'out' });
    const preview =
      entry.body?.slice(0, 80) ??
      entry.buttons?.map((b) => b.title).join(', ') ??
      entry.type;
    this.logger.log(`[DEV WhatsApp] -> ${entry.to} [${entry.type}]: ${preview}`);
  }

  async sendText({ to, body }: SendTextOptions): Promise<void> {
    this.log({ to, type: 'text', body });
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
    this.log({ to, type: 'image', imageUrl, caption });
  }

  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<void> {
    this.log({ to, type: 'video', videoUrl, caption });
  }

  async sendReplyButtons(
    to: string,
    body: string,
    buttons: InteractiveButton[],
  ): Promise<void> {
    this.log({ to, type: 'buttons', body, buttons });
  }

  async sendList(
    to: string,
    body: string,
    buttonText: string,
    sections: {
      title: string;
      rows: { id: string; title: string; description?: string }[];
    }[],
  ): Promise<void> {
    this.log({ to, type: 'list', body, listButton: buttonText, sections });
  }

  async sendTemplate(
    to: string,
    templateName: string,
    _languageCode?: string,
    _components?: object[],
  ): Promise<void> {
    this.log({
      to,
      type: 'template',
      templateName,
      body: `Template: ${templateName}`,
    });
  }
}
