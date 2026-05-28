import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { WhatsappInboundService } from './whatsapp-inbound.service';

@Controller()
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
    private readonly inbound: WhatsappInboundService,
  ) {}

  /** Verificação webhook Meta (somente WHATSAPP_PROVIDER=cloud) */
  @Get('webhook/whatsapp')
  verifyCloud(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get('WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  @Post('webhook/whatsapp')
  @HttpCode(200)
  async handleCloudWebhook(@Req() req: Request, @Res() res: Response) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (rawBody && !this.whatsapp.verifyCloudSignature(rawBody, signature)) {
      this.logger.warn('Assinatura webhook Meta inválida');
      return res.status(401).send('Invalid signature');
    }

    res.status(200).send('EVENT_RECEIVED');
    const messages = this.inbound.parseCloudWebhook(req.body);
    await this.inbound.handle(messages);
  }

  /** Webhook Evolution API — protótipo */
  @Post('webhook/evolution')
  @HttpCode(200)
  async handleEvolutionWebhook(@Req() req: Request, @Res() res: Response) {
    res.status(200).send({ received: true });
    const messages = this.inbound.parseEvolutionWebhook(
      req.body as Record<string, unknown>,
    );
    await this.inbound.handle(messages);
  }
}
