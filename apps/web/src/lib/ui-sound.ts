'use client';

import { SOUNDS, type SoundId } from '@/components/chaminha/paths';

const cache = new Map<SoundId, HTMLAudioElement>();
let audioCtx: AudioContext | null = null;
let droneGain: GainNode | null = null;
let droneOscs: OscillatorNode[] = [];
let drawTickCounter = 0;
let introCountdownCounter = 0;

function shouldPlaySound(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function getCtx(): AudioContext | null {
  if (!shouldPlaySound()) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getAudio(id: SoundId): HTMLAudioElement {
  let el = cache.get(id);
  if (!el) {
    el = new Audio(SOUNDS[id]);
    cache.set(id, el);
  }
  return el;
}

function playSample(id: SoundId, volume: number, playbackRate = 1) {
  try {
    const audio = getAudio(id);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  when = 0,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function noiseBurst(
  duration: number,
  gainPeak: number,
  when = 0,
  filterHz = 700,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterHz;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);
}

/** Pulso grave tipo batida/cardíaco — expectativa */
function heartbeat(intensity = 1, when = 0) {
  tone(52 * intensity, 0.14, 'sine', 0.055 * intensity, when);
  tone(78, 0.09, 'triangle', 0.028 * intensity, when + 0.05);
  noiseBurst(0.05, 0.018 * intensity, when + 0.02, 420);
}

export function startSuspenseDrone() {
  const ctx = getCtx();
  if (!ctx || droneGain) return;
  const t = ctx.currentTime;
  droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.0001, t);
  droneGain.gain.exponentialRampToValueAtTime(0.06, t + 2.2);
  droneGain.connect(ctx.destination);

  const freqs = [55, 82.5, 110];
  droneOscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = f === 55 ? 'sine' : 'triangle';
    osc.frequency.value = f;
    osc.connect(droneGain!);
    osc.start(t);
    return osc;
  });

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.35;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);
  lfo.start(t);
}

export function stopSuspenseDrone() {
  const ctx = getCtx();
  if (!ctx || !droneGain) return;
  const t = ctx.currentTime;
  droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  const gain = droneGain;
  const oscs = [...droneOscs];
  droneGain = null;
  droneOscs = [];
  window.setTimeout(() => {
    oscs.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* já parado */
      }
    });
    try {
      gain.disconnect();
    } catch {
      /* ignore */
    }
  }, 520);
}

function synthIntroWhoosh() {
  noiseBurst(0.7, 0.05, 0, 500);
  tone(90, 0.6, 'sine', 0.035, 0.1);
}

function synthIntroSuspense() {
  heartbeat(0.85);
}

function synthIntroCountdown(tickIndex = 0) {
  const step = tickIndex % 10;
  const n = Math.max(1, 10 - step);
  const urgency = 1 + (10 - n) * 0.08;
  heartbeat(urgency * 0.9);
  tone(120 + (10 - n) * 14, 0.1, 'square', 0.035 + step * 0.004, 0.08);
  if (n <= 3) {
    tone(180 + (3 - n) * 40, 0.12, 'sawtooth', 0.025, 0.15);
  }
}

function synthIntroConfira() {
  stopSuspenseDrone();
  tone(98, 0.35, 'sine', 0.05);
  tone(147, 0.3, 'sine', 0.045, 0.12);
  tone(196, 0.4, 'triangle', 0.05, 0.22);
  tone(262, 0.5, 'sine', 0.055, 0.35);
  noiseBurst(0.25, 0.04, 0.4, 1200);
  playSample('introReveal', 0.18, 1.05);
}

/** Roleta: cliques curtos (sem drone/batida da intro) */
function synthDrawTick(tickIndex = 0) {
  const step = tickIndex % 8;
  tone(320 + step * 22, 0.035, 'sine', 0.018);
  tone(480 + step * 15, 0.025, 'triangle', 0.012, 0.02);
  playSample('drawTick', 0.1, 0.88 + step * 0.03);
}

/** Resultado do sorteio: acorde limpo de vitória */
function synthDrawReveal() {
  tone(392, 0.12, 'sine', 0.038);
  tone(523, 0.14, 'sine', 0.035, 0.07);
  tone(659, 0.18, 'triangle', 0.032, 0.14);
  tone(784, 0.22, 'sine', 0.028, 0.22);
  playSample('drawReveal', 0.2, 1);
}

const SYNTH_HANDLERS: Partial<
  Record<SoundId, (tickIndex?: number) => void>
> = {
  introWhoosh: synthIntroWhoosh,
  introSuspense: synthIntroSuspense,
  introCountdown: synthIntroCountdown,
  introReveal: synthIntroConfira,
  introPop: () => tone(400, 0.08, 'sine', 0.04),
  introSpark: () => tone(520, 0.1, 'triangle', 0.035),
  drawTick: synthDrawTick,
  drawReveal: synthDrawReveal,
};

export function playSound(id: SoundId) {
  if (!shouldPlaySound()) return;
  const handler = SYNTH_HANDLERS[id];
  if (handler) {
    if (id === 'drawTick') {
      handler(drawTickCounter);
      drawTickCounter += 1;
      return;
    }
    if (id === 'introCountdown') {
      handler(introCountdownCounter);
      introCountdownCounter += 1;
      return;
    }
    handler();
    return;
  }
  playSample(id, 0.15);
}

export function resetIntroCountdownCounter() {
  introCountdownCounter = 0;
}

export function resetDrawTickCounter() {
  drawTickCounter = 0;
}
