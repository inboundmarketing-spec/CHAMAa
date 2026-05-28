import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { WhatsappInboundService } from '../whatsapp/whatsapp-inbound.service';
import { DevWhatsAppProvider } from '../whatsapp/providers/dev.provider';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../bot/session.service';
import { HelpLlmService } from '../bot/help/help-llm.service';

class SimulateMessageDto {
  @IsString()
  waId!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  /** Rótulo exibido no simulador ao tocar em botão (ex.: "⚽ Esportes"). */
  @IsOptional()
  @IsString()
  displayText?: string;
}

/**
 * Simulador para demo ao chefe — sem WhatsApp, sem Evolution.
 * POST /api/dev/simulate-message { "waId": "5511999999999", "text": "oi" }
 */
@Controller('api/dev')
export class DevSimulatorController {
  private readonly logger = new Logger(DevSimulatorController.name);

  constructor(
    private readonly inbound: WhatsappInboundService,
    private readonly whatsapp: WhatsappService,
    private readonly prisma: PrismaService,
    private readonly session: SessionService,
    private readonly config: ConfigService,
    private readonly helpLlm: HelpLlmService,
  ) {}

  @Get('help-llm-status')
  helpLlmStatus() {
    const enabled = this.helpLlm.isEnabled();
    const key = this.config.get<string>('OPENAI_API_KEY', '')?.trim() ?? '';
    const model = this.config.get<string>('HELP_LLM_MODEL') ?? 'gpt-4o-mini';
    const flag = this.config.get<string>('HELP_LLM_ENABLED', 'false');
    return {
      enabled,
      helpLlmFlag: flag,
      hasApiKey: Boolean(key) && !['sua-chave-aqui', 'sk-...', 'changeme'].includes(key),
      model,
      baseUrl: (
        this.config.get<string>('OPENAI_BASE_URL') ??
        'https://api.openai.com/v1'
      ).replace(/\/$/, ''),
      hint: enabled
        ? 'IA ativa: respostas da Ajuda usam a base de conhecimento + LLM.'
        : 'IA inativa: defina HELP_LLM_ENABLED=true e OPENAI_API_KEY em apps/api/.env e reinicie a API.',
    };
  }

  @Get('provider')
  providerInfo() {
    return {
      active: this.whatsapp.activeProvider,
      hint:
        'Protótipo: dev | WhatsApp real barato: evolution | Produção: cloud',
    };
  }

  @Get('chat-log')
  chatLog(@Query('waId') waId?: string) {
    const normalized = waId?.replace(/\D/g, '');
    let entries = DevWhatsAppProvider.chatLog;
    if (normalized) {
      entries = entries.filter(
        (e) => e.to.replace(/\D/g, '') === normalized,
      );
    }
    return entries
      .slice(-80)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map((e) => ({ ...e, at: e.at.toISOString() }));
  }

  @Post('reset-session')
  async resetSession(@Body() body: { waId: string }) {
    const waId = body.waId.replace(/\D/g, '');
    const user = await this.prisma.waUser.findUnique({ where: { waId } });
    if (user) {
      await this.session.fullResetForSimulator(user.id);
    }
    DevWhatsAppProvider.clearLogFor(waId);
    return { ok: true, waId };
  }

  @Post('simulate-message')
  async simulate(@Body() dto: SimulateMessageDto) {
    const waId = dto.waId.replace(/\D/g, '');

    DevWhatsAppProvider.logInbound(waId, dto.text, dto.displayText);
    const messageId = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    void this.inbound
      .handle([
        {
          waId,
          messageId,
          text: dto.text,
          contactName: dto.contactName ?? 'Demo',
        },
      ])
      .catch((err) =>
        this.logger.error(
          `simulate-message falhou (${messageId}): ${err}`,
        ),
      );
    return {
      ok: true,
      provider: this.whatsapp.activeProvider,
      messageId,
      processing: true,
    };
  }

  /** Simula usuário inativo há N dias (padrão 3) para testar mensagem de apresentação. */
  @Post('simulate-idle')
  async simulateIdle(@Body() body: { waId: string; days?: number }) {
    const waId = body.waId.replace(/\D/g, '');
    const days = body.days ?? 3;
    const user = await this.prisma.waUser.findUnique({ where: { waId } });
    if (!user) {
      return { ok: false, error: 'Usuário não encontrado — envie uma mensagem antes.' };
    }

    const idleAt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await this.prisma.conversationSession.upsert({
      where: { waUserId: user.id },
      update: {
        lastMessageAt: idleAt,
        mode: 'bot',
        menuState: 'root',
        assignedTo: null,
      },
      create: {
        waUserId: user.id,
        mode: 'bot',
        menuState: 'root',
        lastMessageAt: idleAt,
      },
    });

    return { ok: true, waId, lastMessageAt: idleAt.toISOString() };
  }
}
