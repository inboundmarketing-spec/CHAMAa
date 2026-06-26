import { ALERT_ATLETICA_TOGGLE_PREFIX, BOT_BUTTON_IDS, BotMenuState } from '@chama/shared';

/** Sem interação do usuário neste período → mensagem de apresentação na próxima mensagem. */
export const ACTIVATION_IDLE_MS = 3 * 24 * 60 * 60 * 1000;

export type ActivationAction = 'route' | 'welcome' | 'ignore';

export type ActivationResult = {
  action: ActivationAction;
  /** Após apresentação, abrir menu/comando na mesma mensagem. */
  routeAfterWelcome: boolean;
};

const PREFIX_PATTERNS: RegExp[] = [
  /🔥/,
  /^oi\b/i,
  /^ol[aá]\b/i,
  /^hey\b/i,
  /^hi\b/i,
  /^chaminha\b/i,
  /\bchaminha\b/i,
  /^chama\b/i,
  /^interunesp\b/i,
  /^inter\b/i,
  /^menu\b/i,
  /^in[ií]cio\b/i,
];

const ROOT_COMMAND_WORDS =
  /^(ajuda|menu|esportes|festas|avisos|atlética|atletica|alojamento|alojamentos|desafios|voltar|sos|lieu)$/i;

export function matchesActivationPrefix(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const lower = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return PREFIX_PATTERNS.some((p) => p.test(lower) || p.test(trimmed));
}

export function isBotButtonOrCommand(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  if (text.startsWith('btn_')) return true;
  if (Object.values(BOT_BUTTON_IDS).includes(text as (typeof BOT_BUTTON_IDS)[keyof typeof BOT_BUTTON_IDS])) {
    return true;
  }
  if (ROOT_COMMAND_WORDS.test(text)) return true;
  if (text.startsWith(BOT_BUTTON_IDS.IG_APPROVE) || text.startsWith(BOT_BUTTON_IDS.IG_REJECT)) {
    return true;
  }
  if (text.startsWith(ALERT_ATLETICA_TOGGLE_PREFIX) || text.startsWith('alert_atl_page_')) {
    return true;
  }
  if (
    text.startsWith('challenge_') ||
    text.startsWith('acc_') ||
    text.startsWith('atletica_')
  ) {
    return true;
  }
  return false;
}

function isActiveFlow(menuState: string): boolean {
  return menuState !== BotMenuState.ROOT;
}

export function evaluateActivation(params: {
  input: string;
  menuState: string;
  previousLastMessageAt: Date | null;
  isFirstSession: boolean;
}): ActivationResult {
  const { input, menuState, previousLastMessageAt, isFirstSession } = params;
  const text = input.trim();

  if (isActiveFlow(menuState)) {
    return { action: 'route', routeAfterWelcome: false };
  }

  const hasPrefix = matchesActivationPrefix(text);
  const hasCommand = isBotButtonOrCommand(text);

  const idleMs = previousLastMessageAt
    ? Date.now() - previousLastMessageAt.getTime()
    : Number.POSITIVE_INFINITY;
  const wakingUp = isFirstSession || idleMs >= ACTIVATION_IDLE_MS;

  if (wakingUp) {
    if (!text) return { action: 'ignore', routeAfterWelcome: false };
    if (hasCommand) {
      return { action: 'route', routeAfterWelcome: false };
    }
    if (hasPrefix) {
      return { action: 'welcome', routeAfterWelcome: false };
    }
    return { action: 'welcome', routeAfterWelcome: true };
  }

  if (hasPrefix || hasCommand) {
    return { action: 'route', routeAfterWelcome: false };
  }

  return { action: 'ignore', routeAfterWelcome: false };
}
