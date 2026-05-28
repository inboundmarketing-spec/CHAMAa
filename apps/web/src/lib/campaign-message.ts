/** Texto enviado no PV — deve coincidir com `campaign.processor.ts`. */
export function formatCampaignWhatsAppBody(
  title: string,
  body: string,
  linkUrl?: string | null,
): string {
  const t = title.trim();
  const b = body.trim();
  const link = linkUrl?.trim() ?? '';

  let text = '';
  if (!t && !b) text = '';
  else if (!t) text = b;
  else if (!b) text = `📢 *${t}*`;
  else text = `📢 *${t}*\n\n${b}`;

  if (link) {
    text = text ? `${text}\n\n🔗 ${link}` : `🔗 ${link}`;
  }
  return text;
}
