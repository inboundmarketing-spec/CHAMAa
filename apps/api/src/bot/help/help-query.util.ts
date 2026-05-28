export type QuestionIntent =
  | 'when'
  | 'where'
  | 'duration'
  | 'price'
  | 'how'
  | 'what'
  | 'who'
  | 'yesno'
  | 'general';

export type HelpTurn = { role: 'user' | 'assistant'; content: string };

export type ClassifiedQuestion = {
  intent: QuestionIntent;
  tokens: string[];
  significantTokens: string[];
  asksInter: boolean;
};

const GENERIC_TOPIC = new Set([
  'inter',
  'interunesp',
  'evento',
  'unesp',
  'chaminha',
  'bot',
]);

const STOPWORDS = new Set([
  'quando',
  'onde',
  'como',
  'qual',
  'quais',
  'que',
  'pra',
  'para',
  'por',
  'com',
  'sem',
  'uma',
  'uns',
  'umas',
  'the',
  'vai',
  'ser',
  'esta',
  'está',
  'sao',
  'são',
  'tem',
  'ter',
  'foi',
  'era',
  'sobre',
  'isso',
  'essa',
  'esse',
  'aqui',
  'ali',
  'mais',
  'menos',
  'muito',
  'pouco',
  'quanto',
  'custa',
  'custo',
  'preco',
  'precos',
  'valor',
  'valores',
  'pagar',
]);

const INTER_TOPIC =
  /interunesp|\binter\b|atletica|atlética|jogo|placar|festa|tenda|show|lineup|ingresso|qr|campus|ginasio|ginásio|comiss[aã]o|lieu/i;

const DATE_IN_TEXT =
  /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9áàâãéêíóôõúç]+/i)
    .filter((t) => t.length >= 3);
}

export function classifyQuestion(query: string): ClassifiedQuestion {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  const tokens = tokenize(query);
  const significantTokens = tokens.filter(
    (t) => !STOPWORDS.has(t) && !GENERIC_TOPIC.has(t),
  );

  let intent: QuestionIntent = 'general';
  if (
    /\b(quanto\s+tempo|quantos\s+dias|durar|dura[cç][aã]o|dura|quantas\s+horas)\b/.test(
      normalized,
    )
  ) {
    intent = 'duration';
  } else if (/\b(onde|local|endere[cç]o|lugar|fica|gin[aá]sio|campus|mapa)\b/.test(normalized)) {
    intent = 'where';
  } else if (/\b(quando|que\s+dia|qual\s+(dia|data)|\bdatas?\b|hor[aá]rio|come[cç]a|termina|vai\s+ser)\b/.test(normalized)) {
    intent = 'when';
  } else if (/\b(pre[cç]o|valor|custa|pacote|pagar|reais|R\$)\b/.test(normalized)) {
    intent = 'price';
  } else if (/\bquanto\b/.test(normalized) && /\b(custa|vale|pagar|reais)\b/.test(normalized)) {
    intent = 'price';
  } else if (/\b(como|passo|fazer|funciona|consigo|posso)\b/.test(normalized)) {
    intent = 'how';
  } else if (/\b(o\s+que\s+[eé]|oque\s+[eé]|definir|significa)\b/.test(normalized)) {
    intent = 'what';
  } else if (/\b(quem|respons[aá]vel|comiss[aã]o|lieu|organiza)\b/.test(normalized)) {
    intent = 'who';
  } else if (/\b(pode|posso|tem|permitid|proibid|vale)\b/.test(normalized)) {
    intent = 'yesno';
  }

  return {
    intent,
    tokens,
    significantTokens,
    asksInter: INTER_TOPIC.test(query),
  };
}

export function scoreOverlap(queryTokens: string[], corpus: string): number {
  const corpusTokens = new Set(tokenize(corpus));
  let score = 0;
  for (const t of queryTokens) {
    if (corpusTokens.has(t)) score += 1;
  }
  return score;
}

export function passesRelevanceGate(
  classified: ClassifiedQuestion,
  corpus: string,
  score: number,
): boolean {
  const corpusLower = corpus.toLowerCase();
  const sig = classified.significantTokens;

  if (!sig.length) {
    return score >= 1;
  }

  const matched = sig.filter((t) => corpusLower.includes(t));
  if (!matched.length) return false;

  const ratio = matched.length / sig.length;
  if (ratio < 0.5) return false;

  const minScore = sig.length >= 2 ? 2 : 1;
  return score >= minScore || (ratio >= 0.75 && matched.length >= 2);
}

export function contentSatisfiesIntent(intent: QuestionIntent, text: string): boolean {
  switch (intent) {
    case 'when':
      return (
        DATE_IN_TEXT.test(text) ||
        /\b\d{1,2}h\d{0,2}\b|\b\d{1,2}:\d{2}\b|hor[aá]rio|em\s+\d{1,2}\//i.test(text) ||
        /\b(entre|de\s+\d{1,2}\s+(a|e)\s+\d{1,2}|dias?\s+\d{1,2})\b/i.test(text)
      );
    case 'duration':
      return (
        DATE_IN_TEXT.test(text) ||
        /\b(dias?|horas?|semana|entre\s+os\s+dias|de\s+\d{1,2}\s+(a|e)\s+\d{1,2})\b/i.test(
          text,
        )
      );
    case 'where':
      return (
        /\b(local|endere[cç]o|onde|gin[aá]sio|campus|parque|tenda|maps\.|mapa)\b/i.test(text) ||
        /\b(rua|av\.|avenida|rod\.|km\s+\d)/i.test(text)
      );
    case 'price':
      return /R\$\s*\d|\breais\b|valor|pre[cç]o|custa|pacote/i.test(text);
    case 'how':
      return (
        /\b(menu|toque|use|acesse|clique|passo|valida[cç][aã]o|qr)\b/i.test(text) ||
        text.length >= 60
      );
    case 'who':
      return /\b(lieu|comiss[aã]o|organiza|respons[aá]vel|atendimento|sos)\b/i.test(text);
    case 'yesno':
      return /\b(sim|n[aã]o|pode|n[aã]o\s+pode|permitid|proibid|somente|apenas)\b/i.test(text);
    case 'what':
    case 'general':
    default:
      return text.trim().length >= 20;
  }
}

export function intentGapMessage(
  intent: QuestionIntent,
  topicLabel: string,
): string {
  const subject = topicLabel ? ` sobre *${topicLabel}*` : '';
  switch (intent) {
    case 'when':
      return `Ainda não sei a *data ou horário*${subject}.`;
    case 'duration':
      return `Ainda não sei *quanto tempo dura*${subject}.`;
    case 'where':
      return `Ainda não sei o *local ou endereço*${subject}.`;
    case 'price':
      return `Ainda não sei o *preço ou valor*${subject}.`;
    case 'how':
      return `Ainda não tenho *instruções*${subject} disponíveis.`;
    case 'who':
      return `Ainda não tenho *informação de contato*${subject}.`;
    case 'yesno':
      return `Ainda não tenho uma *resposta direta*${subject}.`;
    default:
      return `Ainda não tenho informação suficiente${subject}.`;
  }
}

/** Pergunta sobre a cidade-sede do Inter (não ginásio/tenda específicos). */
export function isGeneralInterLocationQuery(
  query: string,
  classified: ClassifiedQuestion,
): boolean {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  const asksWhere =
    classified.intent === 'where' ||
    /\b(onde|local|cidade|lugar)\b/.test(normalized);
  const aboutInter =
    classified.asksInter || /\binter\b|interunesp/.test(normalized);
  const specificPlace =
    /\b(gin[aá]sio|pra[cç]a|tenda|parque|quadra|est[aá]dio|exposi[cç][oõ]es|rod\.|avenida|rua)\b/i.test(
      normalized,
    );

  return asksWhere && aboutInter && !specificPlace;
}

/** Ano da edição mencionado ou inferido (ex.: "ano passado" → 2025). */
export function extractEditionYearHint(query: string): number | null {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  const explicit = normalized.match(/\b(20\d{2})\b/);
  if (explicit) return Number.parseInt(explicit[1], 10);

  if (
    /\b(ano\s+passado|ano\s+anterior|ultima\s+edicao|edi[cç][aã]o\s+anterior|edicao\s+passada)\b/.test(
      normalized,
    )
  ) {
    return new Date().getFullYear() - 1;
  }

  if (/\b(este\s+ano|edicao\s+atual|esse\s+ano)\b/.test(normalized)) {
    return new Date().getFullYear();
  }

  return null;
}

export function topicLabelFromQuery(classified: ClassifiedQuestion): string {
  if (!classified.significantTokens.length) {
    return classified.asksInter ? 'Interunesp' : '';
  }
  return classified.significantTokens.slice(0, 3).join(' ');
}

/** Usa o histórico da conversa para follow-ups como "quanto tempo vai durar?". */
export function enrichFromHistory(
  classified: ClassifiedQuestion,
  query: string,
  history: HelpTurn[],
): ClassifiedQuestion {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  let intent = classified.intent;
  if (
    intent === 'price' &&
    /\b(tempo|durar|dura[cç][aã]o|dias?)\b/.test(normalized)
  ) {
    intent = 'duration';
  }

  if (!history.length) {
    return intent !== classified.intent ? { ...classified, intent } : classified;
  }

  const contextText = history
    .slice(-4)
    .map((t) => t.content)
    .join(' ')
    .toLowerCase();

  const contextAsksInter =
    INTER_TOPIC.test(contextText) ||
    /\b(acontece|edi[cç][aã]o|novembro|dezembro|inter\s+20|chaminha)\b/i.test(
      contextText,
    );

  const asksInter = classified.asksInter || contextAsksInter;

  return { ...classified, intent, asksInter };
}
