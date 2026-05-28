import type { ChatMessage } from '@/lib/chat-message';

export type DisplayChatMessage = ChatMessage & {
  moreButtons?: { id: string; title: string }[];
};

const MORE_LABELS = new Set([
  '',
  'mais',
  'mais:',
  'mais opções',
  'mais opções:',
  'mais opcoes',
  'mais opcoes:',
]);

export function isMoreOptionsLabel(body?: string): boolean {
  const normalized = (body ?? '').trim().toLowerCase().replace(/:+$/, '');
  return MORE_LABELS.has(normalized);
}

export function isMoreOnlyButtonMessage(msg: ChatMessage): boolean {
  return (
    msg.direction === 'out' &&
    msg.type === 'buttons' &&
    !!msg.buttons?.length &&
    isMoreOptionsLabel(msg.body)
  );
}

/** Agrupa menu principal + bloco "Mais opções" em uma única bolha visual. */
export function prepareDisplayMessages(
  messages: ChatMessage[],
): DisplayChatMessage[] {
  const out: DisplayChatMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const current = messages[i];
    const next = messages[i + 1];

    if (
      current.direction === 'out' &&
      current.type === 'buttons' &&
      current.buttons?.length &&
      !isMoreOptionsLabel(current.body) &&
      next &&
      isMoreOnlyButtonMessage(next)
    ) {
      out.push({
        ...current,
        moreButtons: next.buttons,
      });
      i += 2;
      continue;
    }

    out.push(current);
    i += 1;
  }

  return out;
}
