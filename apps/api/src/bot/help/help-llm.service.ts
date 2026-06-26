import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HelpTurn } from './help-query.util';

const SYSTEM_PROMPT = `Você é a *chaminha*, assistente do Interunesp no WhatsApp.

Regras:
- Responda SEMPRE em português do Brasil, de forma clara e direta.
- Leia a PERGUNTA COMPLETA, entenda o que o usuário quer (ano, local, data, regra…) e use SOMENTE o bloco CONTEXTO.
- Não invente informação. Não cite artigos, tags, fontes nem diga "na base" ou "no contexto".
- Responda exatamente ao que foi perguntado, sem textos extras no final (sem dicas de menu, sem "confira em…").
- Se perguntarem *onde* foi/será o Inter (cidade-sede), responda só com o **nome da cidade** da edição correta (ex.: 2025 vs 2026 conforme a pergunta). Não liste endereços de ginásio, praça ou tenda, salvo se a pergunta for sobre um local específico.
- Se o CONTEXTO não tiver a informação para responder com certeza, responda EXATAMENTE esta frase e nada mais: Não consegui encontrar a resposta para a sua pergunta.
- Mantenha até ~4 linhas, adequado ao WhatsApp. Pode usar *negrito* para destaques.
- Assuntos fora do Interunesp: recuse educadamente e convide a perguntar sobre o evento.`;

@Injectable()
export class HelpLlmService implements OnModuleInit {
  private readonly logger = new Logger(HelpLlmService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (this.isEnabled()) {
      this.logger.log(
        `Ajuda com IA ativa (${this.config.get<string>('HELP_LLM_MODEL') ?? 'gpt-4o-mini'})`,
      );
    } else {
      this.logger.warn(
        'Ajuda sem IA: HELP_LLM_ENABLED=false ou OPENAI_API_KEY ausente em apps/api/.env',
      );
    }
  }

  isEnabled(): boolean {
    const flag = this.config.get<string>('HELP_LLM_ENABLED', 'false');
    const key = this.config.get<string>('OPENAI_API_KEY', '')?.trim();
    const placeholders = ['', 'sua-chave-aqui', 'sk-...', 'changeme'];
    return flag === 'true' && Boolean(key) && !placeholders.includes(key);
  }

  async generateAnswer(params: {
    question: string;
    history: HelpTurn[];
    context: string;
  }): Promise<string | null> {
    if (!this.isEnabled()) return null;

    const apiKey = this.config.get<string>('OPENAI_API_KEY', '')!.trim();
    const baseUrl = (
      this.config.get<string>('OPENAI_BASE_URL') ??
      'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    const model =
      this.config.get<string>('HELP_LLM_MODEL') ?? 'gpt-4o-mini';
    const maxTokens = Number(
      this.config.get<string>('HELP_LLM_MAX_TOKENS') ?? '500',
    );
    const timeoutMs = Number(
      this.config.get<string>('HELP_LLM_TIMEOUT_MS') ?? '20000',
    );

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    const priorTurns = params.history.slice(0, -1).slice(-6);
    for (const turn of priorTurns) {
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content.replace(/^🔥 \*chaminha\*\n\n/, '').slice(0, 800),
      });
    }

    const userBlock = params.context.trim()
      ? `CONTEXTO (base de conhecimento e dados do Inter — use só isto):\n${params.context.trim()}\n\n---\n\nPERGUNTA COMPLETA DO USUÁRIO:\n${params.question}`
      : `PERGUNTA COMPLETA DO USUÁRIO:\n${params.question}\n\n(Não há artigos na base para este tema; responda com honestidade.)`;

    messages.push({ role: 'user', content: userBlock });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (baseUrl.includes('openrouter.ai')) {
      const referer =
        this.config.get<string>('OPENROUTER_SITE_URL') ??
        this.config.get<string>('PUBLIC_API_URL');
      if (referer) {
        headers['HTTP-Referer'] = referer;
      }
      headers['X-Title'] =
        this.config.get<string>('OPENROUTER_APP_NAME') ?? 'CHAMA Chaminha';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.35,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(
          `LLM HTTP ${res.status}: ${errText.slice(0, 200)}`,
        );
        return null;
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || null;
    } catch (e) {
      this.logger.warn(`LLM request failed: ${e}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
