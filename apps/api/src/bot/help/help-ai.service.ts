import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HelpKnowledgeService } from './help-knowledge.service';
import { HelpLlmService } from './help-llm.service';
import {
  HELP_NOT_FOUND,
  isLlmNotFoundAnswer,
  wrapChaminhaAnswer,
} from './help-answer.util';
import type { HelpTurn } from './help-query.util';

export type { HelpTurn };

const OFF_TOPIC =
  /pol[ií]tica|elei[cç][aã]o|religi[aã]o|investimento|cripto|namoro|receita\s+de|trabalho\s+fora/i;

@Injectable()
export class HelpAiService {
  private readonly logger = new Logger(HelpAiService.name);

  constructor(
    private readonly knowledge: HelpKnowledgeService,
    private readonly llm: HelpLlmService,
    private readonly config: ConfigService,
  ) {}

  async answer(
    question: string,
    history: HelpTurn[],
  ): Promise<{ answer: string; onTopic: boolean }> {
    const trimmed = question.trim();
    if (!trimmed) {
      return {
        answer: 'Envie sua dúvida em texto para eu tentar ajudar. 🙂',
        onTopic: true,
      };
    }

    if (OFF_TOPIC.test(trimmed)) {
      return { answer: this.offTopicMessage(), onTopic: false };
    }

    if (this.llm.isEnabled()) {
      const llmAnswer = await this.answerWithLlm(trimmed, history);
      if (llmAnswer) return llmAnswer;
      this.logger.warn(
        'LLM habilitada mas não respondeu; usando busca local na base.',
      );
    }

    const result = await this.knowledge.buildPreciseAnswer(trimmed, history);

    if (!result.onTopic && !result.found) {
      return { answer: this.offTopicMessage(), onTopic: false };
    }

    if (!result.found || !result.text.trim()) {
      return { answer: HELP_NOT_FOUND, onTopic: result.onTopic };
    }

    return {
      answer: result.text,
      onTopic: result.onTopic,
    };
  }

  private async answerWithLlm(
    question: string,
    history: HelpTurn[],
  ): Promise<{ answer: string; onTopic: boolean } | null> {
    const rag = await this.knowledge.buildRagContext(question, history);

    const hasContext = Boolean(rag.context.trim());
    const interRelated =
      rag.onTopic || rag.classified.asksInter || hasContext;

    if (!interRelated && OFF_TOPIC.test(question)) {
      return { answer: this.offTopicMessage(), onTopic: false };
    }

    if (!interRelated) {
      return null;
    }

    const generated = await this.llm.generateAnswer({
      question,
      history,
      context: rag.context,
    });

    if (!generated) {
      this.logger.warn(
        `OpenRouter/LLM sem resposta (modelo=${this.config.get<string>('HELP_LLM_MODEL') ?? 'padrão'})`,
      );
      return null;
    }

    if (isLlmNotFoundAnswer(generated)) {
      return { answer: HELP_NOT_FOUND, onTopic: true };
    }

    return { answer: wrapChaminhaAnswer(generated), onTopic: true };
  }

  private offTopicMessage(): string {
    return (
      '🔥 Oi! Sou a *chaminha* e posso ajudar com o *Interunesp* — ' +
      'datas, locais, jogos, festas, atléticas e regras do evento.\n\n' +
      'Pergunte algo sobre o Inter, ou toque em *Encerrar* → *Ainda não* para falar com a *Lieu*.'
    );
  }

}
