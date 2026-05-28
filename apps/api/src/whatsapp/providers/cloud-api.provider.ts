import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  IWhatsAppProvider,
  InteractiveButton,
  SendTextOptions,
} from '../interfaces/whatsapp-provider.interface';

/** WhatsApp Cloud API (Meta) — uso em produção após contratação. */
@Injectable()
export class CloudApiWhatsAppProvider implements IWhatsAppProvider {
  readonly name = 'cloud';
  private readonly logger = new Logger(CloudApiWhatsAppProvider.name);
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('META_ACCESS_TOKEN', '');
    this.phoneNumberId = this.config.get<string>('META_PHONE_NUMBER_ID', '');
    this.appSecret = this.config.get<string>('META_APP_SECRET', '');
    const baseURL = `https://graph.facebook.com/v21.0/${this.phoneNumberId}`;

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
  ): boolean {
    if (!this.appSecret || !signature) {
      return process.env.NODE_ENV === 'development';
    }
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get('META_ACCESS_TOKEN') &&
        this.config.get('META_PHONE_NUMBER_ID'),
    );
  }

  async sendText({ to, body }: SendTextOptions): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(`[cloud não configurado] -> ${to}`);
      return;
    }
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
  }

  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    });
  }

  async sendVideo(
    to: string,
    videoUrl: string,
    caption?: string,
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'video',
      video: { link: videoUrl, caption },
    });
  }

  async sendReplyButtons(
    to: string,
    body: string,
    buttons: InteractiveButton[],
  ): Promise<void> {
    const limited = buttons.slice(0, 3);
    if (!this.isConfigured()) return;
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: limited.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    });
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
    if (!this.isConfigured()) return;
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: buttonText.slice(0, 20),
          sections: sections.map((s) => ({
            title: s.title.slice(0, 24),
            rows: s.rows.slice(0, 10).map((r) => ({
              id: r.id,
              title: r.title.slice(0, 24),
              description: r.description?.slice(0, 72),
            })),
          })),
        },
      },
    });
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode = 'pt_BR',
    components?: object[],
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }
}
