/** Logo da conversa WhatsApp / chat — sempre esta arte */
export const CHAMINHA_CHAT_LOGO = '/chaminha.png';

/**
 * Ícone de chama do painel (sidebar, nav ativo, sorteio).
 * Não usar `/icon.png` — conflita com `app/icon.png` do Next (erro 500).
 */
export const INTER_FLAME_ICON = '/assets/flame-icon.png';

/** Mascote cartoon (intro do sorteio) */
export const CHAMINHA_MASCOT = '/assets/chaminha-mascot.png';

export const SOUNDS = {
  introWhoosh: '/sounds/whoosh.wav',
  introPop: '/sounds/pop.wav',
  introSpark: '/sounds/spark.wav',
  introSuspense: '/sounds/whoosh.wav',
  introCountdown: '/sounds/draw-tick.wav',
  introReveal: '/sounds/spark.wav',
  drawTick: '/sounds/draw-tick.wav',
  drawReveal: '/sounds/spark.wav',
} as const;

export type SoundId = keyof typeof SOUNDS;
