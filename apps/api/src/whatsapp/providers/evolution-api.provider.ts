import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IWhatsAppProvider,
  InteractiveButton,
  SendTextOptions,
} from '../interfaces/whatsapp-provider.interface';

/**
 * Evolution API — protótipo com WhatsApp real via QR (sem custo Meta).
 * Migração futura: WHATSAPP_PROVIDER=cloud
 */
@Injectable()
export class EvolutionApiWhatsAppProvider implements IWhatsAppProvider {
  readonly name = 'evolution';
  private readonly logger = new Logger(EvolutionApiWhatsAppProvider.name);
  private readonly client: AxiosInstance;
  private readonly instance: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('EVOLUTION_API_URL');
    if (!baseURL) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }
    this.instance = this.config.get('EVOLUTION_INSTANCE', 'chama');
    this.apiKey = this.config.get('EVOLUTION_API_KEY', '');
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { apikey: this.apiKey } : {}),
      },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.config.get('EVOLUTION_API_URL'));
  }

  /** PV: só dígitos. Grupo: mantém JID (`...@g.us`). */
  private formatDestination(to: string): string {
    if (to.includes('@')) return to.trim();
    return to.replace(/\D/g, '');
  }

  async sendText({ to, body }: SendTextOptions): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn('[evolution não configurado]');
      return;
    }
    await this.client.post(`/message/sendText/${this.instance}`, {
      number: this.formatDestination(to),
      text: body,
    });
  }

  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.client.post(`/message/sendMedia/${this.instance}`, {
      number: this.formatDestination(to),
      mediatype: 'image',
      media: imageUrl,
      caption,
    });
  }

  async sendVideo(
    to: string,
    videoUrl: string,
    caption?: string,
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.client.post(`/message/sendMedia/${this.instance}`, {
      number: this.formatDestination(to),
      mediatype: 'video',
      media: videoUrl,
      caption,
    });
  }

  async sendReplyButtons(
    to: string,
    body: string,
    buttons: InteractiveButton[],
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const limited = buttons.slice(0, 3);
    try {
      await this.client.post(`/message/sendButtons/${this.instance}`, {
        number: this.formatDestination(to),
        title: body.slice(0, 60),
        description: body,
        footer: 'O Inter',
        buttons: limited.map((b) => ({
          type: 'reply',
          displayText: b.title.slice(0, 20),
          id: b.id,
        })),
      });
    } catch {
      const fallback =
        body +
        '\n\n' +
        limited.map((b, i) => `*${i + 1}.* ${b.title}`).join('\n');
      await this.sendText({ to, body: fallback });
    }
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
    const rows = sections.flatMap((s) => s.rows).slice(0, 10);
    const fallback =
      body +
      '\n\n' +
      rows.map((r, i) => `*${i + 1}.* ${r.title} — responda: ${r.id}`).join('\n') +
      `\n\n_${buttonText}_`;
    await this.sendText({ to, body: fallback });
  }

  async sendTemplate(
    to: string,
    templateName: string,
    _languageCode?: string,
    _components?: object[],
  ): Promise<void> {
    await this.sendText({
      to,
      body: `📢 [Aviso oficial — template: ${templateName}]`,
    });
  }
}
