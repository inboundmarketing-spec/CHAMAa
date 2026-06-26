import { Injectable } from '@nestjs/common';
import {
  formatLiveMatchClock,
  formatMatchScoreLabel,
} from '../../admin/match-display.util';
import { PrismaService } from '../../prisma/prisma.service';
import { HELP_NOT_FOUND, wrapChaminhaAnswer } from './help-answer.util';
import {
  classifyQuestion,
  contentSatisfiesIntent,
  enrichFromHistory,
  extractEditionYearHint,
  isGeneralInterLocationQuery,
  passesRelevanceGate,
  scoreOverlap,
  tokenize,
  type ClassifiedQuestion,
  type HelpTurn,
  type QuestionIntent,
} from './help-query.util';

export type PreciseAnswer = {
  found: boolean;
  onTopic: boolean;
  text: string;
};

export type RagContext = {
  onTopic: boolean;
  context: string;
  classified: ClassifiedQuestion;
};

const DATE_IN_TEXT =
  /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?/gi;

const TEMPORAL_TAGS = /data|datas|quando|calend[aá]rio|agenda|edi[cç][aã]o/i;

const TEMPORAL_STOPWORDS = new Set([
  'quando',
  'qual',
  'data',
  'datas',
  'horario',
  'horarios',
  'inter',
  'interunesp',
  'sera',
  'vai',
  'comeca',
  'comeco',
  'termina',
  'acaba',
]);

type ScoredArticle = {
  article: { id: string; title: string; content: string; tags: string };
  score: number;
};

@Injectable()
export class HelpKnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async buildPreciseAnswer(
    query: string,
    history: HelpTurn[] = [],
  ): Promise<PreciseAnswer> {
    const classified = enrichFromHistory(
      classifyQuestion(query),
      query,
      history,
    );

    if (classified.intent === 'where') {
      const where = await this.buildWhereAnswer(query, classified);
      if (where.found) return where;
    }

    if (classified.intent === 'when' || classified.intent === 'duration') {
      const temporal = await this.buildTemporalAnswer(query, classified);
      if (temporal.found) return temporal;
    }

    const ranked = await this.searchArticlesRanked(query, classified, 3);
    if (ranked[0] && ranked[0].score >= 1) {
      return {
        found: true,
        onTopic: true,
        text: this.formatArticleAnswer(query, ranked[0].article, classified),
      };
    }

    const live = await this.buildLiveContextForQuery(query, classified);
    if (live && this.liveAnswersIntent(classified.intent, live)) {
      return {
        found: true,
        onTopic: true,
        text: wrapChaminhaAnswer(live),
      };
    }

    const onTopic =
      classified.asksInter ||
      ranked.length > 0 ||
      Boolean(live);

    if (!onTopic) {
      return { found: false, onTopic: false, text: '' };
    }

    if (ranked.length > 0) {
      return {
        found: true,
        onTopic: true,
        text: this.formatArticleAnswer(query, ranked[0]!.article, classified),
      };
    }

    return {
      found: false,
      onTopic: classified.asksInter,
      text: HELP_NOT_FOUND,
    };
  }

  async searchArticles(query: string, limit = 5) {
    const classified = classifyQuestion(query);
    const ranked = await this.searchArticlesRanked(query, classified, limit);
    return ranked.map((r) => r.article);
  }

  async buildKnowledgeContext(query: string): Promise<string> {
    const articles = await this.searchArticles(query, 4);
    if (!articles.length) return '';
    return articles.map((a) => `### ${a.title}\n${a.content}`).join('\n\n');
  }

  /** Monta contexto para o LLM (RAG): base + ao vivo + datas oficiais. */
  async buildRagContext(
    query: string,
    history: HelpTurn[] = [],
  ): Promise<RagContext> {
    const classified = enrichFromHistory(
      classifyQuestion(query),
      query,
      history,
    );

    const parts: string[] = [];

    const editionFact = await this.formatEditionFact();
    if (editionFact) parts.push(editionFact);

    const allArticles = await this.prisma.knowledgeArticle.findMany({
      where: { active: true },
      orderBy: { title: 'asc' },
    });
    const ranked = this.rankArticles(query, classified, allArticles);
    const limit = allArticles.length <= 24 ? allArticles.length : 16;
    if (ranked.length) {
      parts.push(
        '## Base de conhecimento',
        ...ranked.slice(0, limit).map(
          (r) => `### ${r.article.title}\n${r.article.content.trim()}`,
        ),
      );
    }

    if (!isGeneralInterLocationQuery(query, classified)) {
      const live = await this.buildLiveContextForQuery(query, classified);
      if (live.trim()) {
        parts.push('## Informações ao vivo (jogos/festas)', live);
      }
    }

    const onTopic =
      classified.asksInter ||
      ranked.length > 0 ||
      Boolean(editionFact);

    return {
      onTopic,
      context: parts.join('\n\n'),
      classified,
    };
  }

  async buildLiveContext(): Promise<string> {
    return this.buildLiveContextForQuery('', classifyQuestion(''));
  }

  private async formatEditionFact(): Promise<string> {
    const edition = await this.getEditionDatesFromConfig();
    if (!edition) return '';
    const range = edition.end
      ? `de ${formatDateShort(edition.start)} a ${formatDateShort(edition.end)}`
      : `em ${formatDateShort(edition.start)}`;
    return `## Edição oficial do Inter\nO *${edition.label}* acontece ${range}.`;
  }

  private async searchArticlesRanked(
    query: string,
    classified: ClassifiedQuestion,
    limit: number,
  ): Promise<ScoredArticle[]> {
    const articles = await this.prisma.knowledgeArticle.findMany({
      where: { active: true },
    });
    return this.rankArticles(query, classified, articles).slice(0, limit);
  }

  private rankArticles(
    query: string,
    classified: ClassifiedQuestion,
    articles: { id: string; title: string; content: string; tags: string }[],
  ): ScoredArticle[] {
    const yearHint = extractEditionYearHint(query);
    const searchTokens = [
      ...classified.tokens,
      ...tokenize(query).filter((t) => t.length >= 4),
    ];

    return articles
      .map((article) => {
        const corpus = `${article.title} ${article.content} ${article.tags}`;
        let score = scoreOverlap(searchTokens, corpus);

        const titleYear = article.title.match(/\b(20\d{2})\b/);
        if (yearHint && titleYear) {
          if (Number.parseInt(titleYear[1], 10) === yearHint) score += 12;
          else score -= 4;
        } else if (!yearHint && titleYear) {
          const currentYear = new Date().getFullYear();
          const ty = Number.parseInt(titleYear[1], 10);
          if (/\b(vai|sera|será|proxim[oa]|este\s+ano)\b/i.test(query) && ty === currentYear) {
            score += 8;
          }
          if (/\b(foi|era|passado|anterior)\b/i.test(query) && ty === currentYear - 1) {
            score += 8;
          }
        }

        if (classified.intent === 'where' && /local|onde|cidade/i.test(article.tags)) {
          score += 3;
        }
        if (classified.intent === 'when' && /data|quando|dia/i.test(article.tags)) {
          score += 3;
        }
        if (classified.asksInter && /inter/i.test(article.title)) score += 2;

        return { article, score };
      })
      .filter((s) => {
        if (s.score < 1) return false;
        if (classified.asksInter && s.score >= 2) return true;
        return passesRelevanceGate(
          classified,
          `${s.article.title} ${s.article.content} ${s.article.tags}`,
          s.score,
        );
      })
      .sort((a, b) => b.score - a.score);
  }

  private async buildWhereAnswer(
    query: string,
    classified: ClassifiedQuestion,
  ): Promise<PreciseAnswer> {
    const locationArticle = await this.findLocationArticle(query, classified);
    if (locationArticle) {
      return {
        found: true,
        onTopic: true,
        text: this.formatLocationAnswer(query, locationArticle.article),
      };
    }

    const ranked = await this.searchArticlesRanked(query, classified, 3);
    if (ranked[0]) {
      return {
        found: true,
        onTopic: true,
        text: this.formatArticleAnswer(query, ranked[0].article, classified),
      };
    }

    if (
      !isGeneralInterLocationQuery(query, classified) &&
      classified.asksInter
    ) {
      const live = await this.buildLiveContextForQuery(query, classified);
      if (live && this.liveAnswersIntent('where', live)) {
        return { found: true, onTopic: true, text: wrapChaminhaAnswer(live) };
      }
    }

    return {
      found: false,
      onTopic: classified.asksInter,
      text: HELP_NOT_FOUND,
    };
  }

  private async findLocationArticle(
    query: string,
    classified: ClassifiedQuestion,
  ): Promise<ScoredArticle | null> {
    const articles = await this.prisma.knowledgeArticle.findMany({
      where: { active: true },
    });
    const locationArticles = articles.filter(
      (a) =>
        /local|localiza|onde|cidade|lugar|sede/i.test(a.tags) ||
        /local.*inter|inter.*local/i.test(a.title),
    );
    const ranked = this.rankArticles(query, classified, locationArticles);
    return ranked[0] ?? null;
  }

  private formatLocationAnswer(
    query: string,
    article: { title: string; content: string },
  ): string {
    const city = extractHostCityFromText(article.content);
    const yearHint = extractEditionYearHint(query);
    const titleYear = article.title.match(/\b(20\d{2})\b/);
    const yearLabel = titleYear
      ? titleYear[1]
      : yearHint
        ? String(yearHint)
        : null;
    const past = /\b(foi|era|aconteceu|passado|anterior)\b/i.test(query);

    if (city) {
      const when = yearLabel ? ` em *${yearLabel}*` : '';
      const verb = past ? 'foi' : 'é';
      return wrapChaminhaAnswer(
        `O *Interunesp*${when} ${verb} em *${city}*.`,
      );
    }

    return wrapChaminhaAnswer(article.content.trim());
  }

  private formatArticleAnswer(
    query: string,
    article: { title: string; content: string },
    classified: ClassifiedQuestion,
  ): string {
    if (
      classified.intent === 'where' ||
      isGeneralInterLocationQuery(query, classified)
    ) {
      return this.formatLocationAnswer(query, article);
    }
    return wrapChaminhaAnswer(article.content.trim());
  }

  private async buildTemporalAnswer(
    query: string,
    classified: ClassifiedQuestion,
  ): Promise<PreciseAnswer> {
    const edition = await this.getEditionDatesFromConfig();
    if (edition && (classified.asksInter || !classified.significantTokens.length)) {
      if (classified.intent === 'duration') {
        return {
          found: true,
          onTopic: true,
          text: this.formatEditionDuration(edition.label, edition.start, edition.end),
        };
      }
      return {
        found: true,
        onTopic: true,
        text: this.formatEditionDates(edition.label, edition.start, edition.end),
      };
    }

    const dateArticles = (await this.searchArticlesWithDates(query)).filter(
      (item) => item.dates.length > 0,
    );
    if (dateArticles.length) {
      return {
        found: true,
        onTopic: true,
        text: this.formatDateArticles(dateArticles),
      };
    }

    const specific = await this.findSpecificSchedule(query);
    if (specific) {
      return { found: true, onTopic: true, text: specific };
    }

    const dateRanked = await this.searchArticlesRanked(query, classified, 2);
    if (dateRanked[0]) {
      return {
        found: true,
        onTopic: true,
        text: wrapChaminhaAnswer(dateRanked[0].article.content.trim()),
      };
    }

    return {
      found: false,
      onTopic: classified.asksInter,
      text: HELP_NOT_FOUND,
    };
  }

  private async buildLiveContextForQuery(
    query: string,
    classified: ClassifiedQuestion,
  ): Promise<string> {
    const [liveMatches, upcoming, events] = await Promise.all([
      this.prisma.match.findMany({
        where: { status: 'live' },
        include: {
          modalidade: true,
          venue: true,
          participants: { orderBy: { sortOrder: 'asc' } },
        },
        take: 10,
      }),
      this.prisma.match.findMany({
        where: {
          status: { in: ['scheduled', 'delayed'] },
          scheduledAt: { gte: new Date() },
        },
        include: { modalidade: true, venue: true },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      this.prisma.festivalDay.findMany({
        where: { startsAt: { gte: new Date() } },
        include: { festival: { include: { location: true } } },
        orderBy: { startsAt: 'asc' },
        take: 10,
      }),
    ]);

    const filterTokens =
      classified.significantTokens.length > 0
        ? classified.significantTokens
        : tokenize(query).filter((t) => !TEMPORAL_STOPWORDS.has(t));

    const matchesToken = (corpus: string) => {
      if (!filterTokens.length) return true;
      const lower = corpus.toLowerCase();
      return filterTokens.some((t) => lower.includes(t));
    };

    const lines: string[] = [];

    const liveFiltered = liveMatches.filter((m) =>
      matchesToken(`${m.modalidade.name} ${m.homeTeam} ${m.awayTeam}`),
    );
    if (liveFiltered.length) {
      lines.push('*Jogos ao vivo:*');
      for (const m of liveFiltered) {
        const score = formatMatchScoreLabel(m);
        const clock = formatLiveMatchClock(m);
        const clockSuffix = clock ? ` · ${clock}` : '';
        lines.push(
          `- ${m.modalidade.name}: ${score}${clockSuffix}${m.venue ? ` (${m.venue.name})` : ''}`,
        );
      }
    }

    const upcomingFiltered = upcoming.filter((m) =>
      matchesToken(`${m.modalidade.name} ${m.homeTeam} ${m.awayTeam}`),
    );
    if (upcomingFiltered.length && classified.intent !== 'where') {
      lines.push('*Próximos jogos:*');
      for (const m of upcomingFiltered.slice(0, 3)) {
        const dt = m.scheduledAt.toLocaleString('pt-BR');
        lines.push(
          `- ${m.modalidade.name}: ${m.homeTeam} x ${m.awayTeam} — ${dt}${m.venue ? ` (${m.venue.name})` : ''}`,
        );
      }
    }

    const eventsFiltered = events.filter((e) =>
      matchesToken(`${e.title} ${e.festival.name}`),
    );
    if (eventsFiltered.length) {
      lines.push('*Festas:*');
      for (const e of eventsFiltered.slice(0, 3)) {
        const dt = e.startsAt.toLocaleString('pt-BR');
        lines.push(`- Dia ${e.dayIndex} — ${e.title}: ${dt}`);
      }
    }

    if (
      classified.intent === 'where' &&
      !lines.length &&
      !isGeneralInterLocationQuery(query, classified) &&
      filterTokens.length > 0
    ) {
      const venues = await this.prisma.venue.findMany({ take: 10 });
      const locs = await this.prisma.location.findMany({ take: 10 });
      for (const v of venues) {
        if (matchesToken(v.name)) {
          lines.push(`*${v.name}:* ${v.address}`);
        }
      }
      for (const l of locs) {
        if (matchesToken(l.name)) {
          lines.push(`*${l.name}:* ${l.address}`);
        }
      }
    }

    return lines.join('\n');
  }

  private liveAnswersIntent(intent: QuestionIntent, live: string): boolean {
    if (!live.trim()) return false;
    switch (intent) {
      case 'duration':
      case 'when':
        return /\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}/.test(live);
      case 'where':
        return /\(.+\)|—\s+\w+/.test(live) || /:\s*.+/.test(live);
      default:
        return live.length > 20;
    }
  }

  private async getEditionDatesFromConfig(): Promise<{
    label: string;
    start: Date;
    end: Date | null;
  } | null> {
    const rows = await this.prisma.appConfig.findMany({
      where: {
        key: {
          in: ['inter_edition_start', 'inter_edition_end', 'inter_edition_label'],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const start = parseConfigDate(map.inter_edition_start);
    if (!start) return null;
    return {
      label: map.inter_edition_label?.trim() || 'Interunesp',
      start,
      end: parseConfigDate(map.inter_edition_end),
    };
  }

  private async searchArticlesWithDates(query: string) {
    const classified = classifyQuestion(query);
    const articles = await this.prisma.knowledgeArticle.findMany({
      where: { active: true },
    });

    return articles
      .map((article) => {
        const dates = extractDatesFromText(article.content);
        if (!dates.length) return { article, score: 0, dates: [] as string[] };

        const corpus = `${article.title} ${article.content} ${article.tags}`;
        const overlap = scoreOverlap(classified.tokens, corpus);
        if (!passesRelevanceGate(classified, corpus, overlap)) {
          return { article, score: 0, dates: [] as string[] };
        }
        const tagBoost = TEMPORAL_TAGS.test(article.tags) ? 2 : 0;
        return { article, score: overlap + tagBoost + dates.length, dates };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }

  private async findSpecificSchedule(query: string): Promise<string | null> {
    const tokens = tokenize(query).filter(
      (t) => !TEMPORAL_STOPWORDS.has(t) && t.length >= 4,
    );
    if (!tokens.length) return null;

    const [events, matches] = await Promise.all([
      this.prisma.festivalDay.findMany({
        include: {
          artists: true,
          festival: { include: { location: true } },
        },
        orderBy: { startsAt: 'asc' },
        take: 30,
      }),
      this.prisma.match.findMany({
        where: { scheduledAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        include: { modalidade: true, venue: true },
        orderBy: { scheduledAt: 'asc' },
        take: 30,
      }),
    ]);

    for (const e of events) {
      const artistNames = e.artists.map((a) => a.name).join(' ');
      const corpus = `${e.title} ${artistNames} dia ${e.dayIndex}`.toLowerCase();
      if (tokens.some((t) => corpus.includes(t))) {
        const dt = formatDateTime(e.startsAt);
        const headliner = e.artists.find((a) => a.role === 'headliner');
        const extra = headliner ? ` — headliner: ${headliner.name}` : '';
        return `🔥 *chaminha*\n\n*Dia ${e.dayIndex} — ${e.title}*: *${dt}*${extra}.`;
      }
    }

    for (const m of matches) {
      const corpus =
        `${m.modalidade.name} ${m.homeTeam} ${m.awayTeam}`.toLowerCase();
      if (tokens.some((t) => corpus.includes(t))) {
        const dt = formatDateTime(m.scheduledAt);
        const place = m.venue ? ` (${m.venue.name})` : '';
        return (
          `🔥 *chaminha*\n\n` +
          `*${m.modalidade.name}* — ${m.homeTeam} x ${m.awayTeam}: *${dt}*${place}.`
        );
      }
    }

    return null;
  }

  private formatEditionDates(label: string, start: Date, end: Date | null): string {
    const range = end
      ? `de *${formatDateShort(start)}* a *${formatDateShort(end)}*`
      : `em *${formatDateShort(start)}*`;
    return wrapChaminhaAnswer(`O *${label}* acontece ${range}.`);
  }

  private formatEditionDuration(
    label: string,
    start: Date,
    end: Date | null,
  ): string {
    if (!end) {
      return wrapChaminhaAnswer(
        `O *${label}* acontece em *${formatDateShort(start)}* (evento de um dia).`,
      );
    }
    const days =
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const range = `de *${formatDateShort(start)}* a *${formatDateShort(end)}*`;
    return wrapChaminhaAnswer(
      `O *${label}* dura *${days} dia${days > 1 ? 's' : ''}*, ${range}.`,
    );
  }

  private formatDateArticles(
    items: { article: { title: string; content: string }; dates: string[] }[],
  ): string {
    const best = items[0]!;
    const content = best.article.content.trim();
    if (content.length >= 20) {
      return wrapChaminhaAnswer(content);
    }
    return wrapChaminhaAnswer(best.dates.join(' · '));
  }
}

function extractDatesFromText(text: string): string[] {
  const matches = text.match(DATE_IN_TEXT) ?? [];
  DATE_IN_TEXT.lastIndex = 0;
  return [...new Set(matches)];
}

function parseConfigDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function extractHostCityFromText(text: string): string | null {
  const cityOf = text.match(
    /cidade\s+de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{2,40}?)(?:\s*[.,;]|\s+e\s+|\n|$)/i,
  );
  if (cityOf?.[1]) return cityOf[1].trim();

  const happensIn = text.match(
    /acontece\s+(?:em|na cidade de)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{2,40}?)(?:\s*[.,;]|\n|$)/i,
  );
  if (happensIn?.[1]) return happensIn[1].trim();

  const trimmed = text.trim();
  if (
    trimmed.length > 0 &&
    trimmed.length < 80 &&
    !/\b(rua|av\.|avenida|rod\.|km\s+\d|http)\b/i.test(trimmed)
  ) {
    return trimmed;
  }

  return null;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
