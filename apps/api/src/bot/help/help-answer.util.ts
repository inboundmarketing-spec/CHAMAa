export const HELP_NOT_FOUND =
  '🔥 *chaminha*\n\nNão consegui encontrar a resposta para a sua pergunta.';

export function wrapChaminhaAnswer(body: string): string {
  const trimmed = body.trim();
  if (trimmed.startsWith('🔥')) return trimmed;
  return `🔥 *chaminha*\n\n${trimmed}`;
}

/** Resposta da IA pedindo que não achou informação. */
export function isLlmNotFoundAnswer(text: string): boolean {
  const n = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return (
    n.includes('nao consegui encontrar a resposta') ||
    n.includes('não consegui encontrar a resposta') ||
    n.includes('nao tenho essa informacao') ||
    n.includes('não tenho essa informação')
  );
}
