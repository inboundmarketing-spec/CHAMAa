import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IWhatsAppProvider,
  InteractiveButton,
  SendTextOptions,
  WhatsAppProviderType,
} from './interfaces/whatsapp-provider.interface';
import { DevWhatsAppProvider } from './providers/dev.provider';
import { CloudApiWhatsAppProvider } from './providers/cloud-api.provider';
import { EvolutionApiWhatsAppProvider } from './providers/evolution-api.provider';

export type { SendTextOptions, InteractiveButton };

/**
 * Fachada: delega para o provedor definido em WHATSAPP_PROVIDER.
 * Troca para produção: WHATSAPP_PROVIDER=cloud + credenciais Meta.
 */
@Injectable()
export class WhatsappService implements IWhatsAppProvider {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly provider: IWhatsAppProvider;
  readonly activeProvider: WhatsAppProviderType;

  constructor(
    private readonly config: ConfigService,
    private readonly dev: DevWhatsAppProvider,
    private readonly cloud: CloudApiWhatsAppProvider,
    private readonly evolution: EvolutionApiWhatsAppProvider,
  ) {
    const configured = (this.config.get('WHATSAPP_PROVIDER') ??
      'dev') as WhatsAppProviderType;
    this.activeProvider = ['dev', 'evolution', 'cloud'].includes(configured)
      ? configured
      : 'dev';

    switch (this.activeProvider) {
      case 'cloud':
        this.provider = this.cloud;
        break;
      case 'evolution':
        this.provider = this.evolution;
        break;
      default:
        this.provider = this.dev;
    }

    this.logger.log(
      `WhatsApp ativo: ${this.provider.name} (protótipo — migre com WHATSAPP_PROVIDER=cloud)`,
    );
  }

  get name(): string {
    return this.provider.name;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  verifyCloudSignature(
    rawBody: Buffer,
    signature: string | undefined,
  ): boolean {
    return this.cloud.verifyWebhookSignature(rawBody, signature);
  }

  sendText(options: SendTextOptions): Promise<void> {
    return this.provider.sendText(options);
  }

  sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
    return this.provider.sendImage(to, imageUrl, caption);
  }

  sendVideo(to: string, videoUrl: string, caption?: string): Promise<void> {
    return this.provider.sendVideo(to, videoUrl, caption);
  }

  sendReplyButtons(
    to: string,
    body: string,
    buttons: InteractiveButton[],
  ): Promise<void> {
    return this.provider.sendReplyButtons(to, body, buttons);
  }

  sendList(
    to: string,
    body: string,
    buttonText: string,
    sections: {
      title: string;
      rows: { id: string; title: string; description?: string }[];
    }[],
  ): Promise<void> {
    return this.provider.sendList(to, body, buttonText, sections);
  }

  sendTemplate(
    to: string,
    templateName: string,
    languageCode?: string,
    components?: object[],
  ): Promise<void> {
    return this.provider.sendTemplate(
      to,
      templateName,
      languageCode,
      components,
    );
  }
}
