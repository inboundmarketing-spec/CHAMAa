import type { ChatMessage } from '@/lib/chat-message';

/** Texto enviado no PV/grupos — deve coincidir com `instagram-moderation.service.ts`. */
export function formatInstagramWhatsAppBody(
  caption?: string | null,
  permalink?: string | null,
): string {
  return `📢 *Interunesp no Instagram*\n\n${caption ?? ''}\n${permalink ?? ''}`;
}

export function instagramPreviewMessages(item: {
  caption?: string | null;
  permalink?: string | null;
  mediaUrl?: string | null;
}): ChatMessage[] {
  const body = formatInstagramWhatsAppBody(item.caption, item.permalink);
  const msgs: ChatMessage[] = [
    {
      to: '',
      direction: 'out',
      type: 'text',
      at: new Date().toISOString(),
      body,
    },
  ];
  if (item.mediaUrl?.trim()) {
    msgs.push({
      to: '',
      direction: 'out',
      type: 'image',
      at: new Date(Date.now() + 1).toISOString(),
      imageUrl: item.mediaUrl.trim(),
    });
  }
  return msgs;
}
