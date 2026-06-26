export interface SendTextOptions {
  to: string;
  body: string;
}

export interface InteractiveButton {
  id: string;
  title: string;
}

/**
 * Contrato único de envio/recebimento WhatsApp.
 * Implementações: dev (protótipo), evolution (protótipo real), cloud (produção Meta).
 */
export interface IWhatsAppProvider {
  readonly name: string;

  isConfigured(): boolean;

  sendText(options: SendTextOptions): Promise<void>;

  sendImage(to: string, imageUrl: string, caption?: string): Promise<void>;

  sendVideo(to: string, videoUrl: string, caption?: string): Promise<void>;

  sendReplyButtons(
    to: string,
    body: string,
    buttons: InteractiveButton[],
  ): Promise<void>;

  sendList(
    to: string,
    body: string,
    buttonText: string,
    sections: {
      title: string;
      rows: { id: string; title: string; description?: string }[];
    }[],
  ): Promise<void>;

  sendTemplate(
    to: string,
    templateName: string,
    languageCode?: string,
    components?: object[],
  ): Promise<void>;
}

export type WhatsAppProviderType = 'dev' | 'evolution' | 'cloud';
