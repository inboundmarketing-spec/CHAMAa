'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CHAMINHA_MASCOT } from '@/components/chaminha/paths';
import {
  playSound,
  resetIntroCountdownCounter,
  startSuspenseDrone,
  stopSuspenseDrone,
} from '@/lib/ui-sound';

type Phase =
  | 'idle'
  | 'backdrop'
  | 'suspense'
  | 'title'
  | 'brand'
  | 'mascot'
  | 'countdown'
  | 'confira'
  | 'exit'
  | 'done';

type Props = {
  active: boolean;
  onComplete: () => void;
};

const COUNTDOWN_FROM = 10;
const COUNTDOWN_STEP_MS = 1200;
const REDUCED_MS = 5500;

/** Ritmo lento — textos com mais tempo de leitura */
const INTRO_MS = {
  suspense: 2000,
  title: 5800,
  brand: 9800,
  mascot: 13000,
  countdownStart: 16000,
  confira: 16000 + COUNTDOWN_FROM * COUNTDOWN_STEP_MS + 900,
  exit: 16000 + COUNTDOWN_FROM * COUNTDOWN_STEP_MS + 900 + 3500,
  done: 16000 + COUNTDOWN_FROM * COUNTDOWN_STEP_MS + 900 + 4500,
} as const;

function SuspenseDots() {
  return (
    <span className="bracket-draw-intro-dots" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function BracketDrawIntro({ active, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const completedRef = useRef(false);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setCountdown(null);
      completedRef.current = false;
      stopSuspenseDrone();
      return;
    }

    completedRef.current = false;
    resetIntroCountdownCounter();

    if (reduced) {
      setPhase('backdrop');
      playSound('introWhoosh');
      const t1 = window.setTimeout(() => setPhase('title'), 500);
      const t2 = window.setTimeout(() => setPhase('confira'), 1500);
      const t3 = window.setTimeout(() => {
        setPhase('done');
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, REDUCED_MS);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        stopSuspenseDrone();
      };
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    setPhase('backdrop');
    playSound('introWhoosh');
    startSuspenseDrone();

    timers.push(setTimeout(() => {
      setPhase('suspense');
      playSound('introSuspense');
    }, INTRO_MS.suspense));

    timers.push(setTimeout(() => setPhase('title'), INTRO_MS.title));
    timers.push(setTimeout(() => playSound('introPop'), INTRO_MS.title));

    timers.push(setTimeout(() => setPhase('brand'), INTRO_MS.brand));

    timers.push(setTimeout(() => {
      setPhase('mascot');
      playSound('introSpark');
    }, INTRO_MS.mascot));

    for (let n = COUNTDOWN_FROM; n >= 1; n -= 1) {
      const delay =
        INTRO_MS.countdownStart + (COUNTDOWN_FROM - n) * COUNTDOWN_STEP_MS;
      timers.push(
        setTimeout(() => {
          setPhase('countdown');
          setCountdown(n);
          playSound('introCountdown');
        }, delay),
      );
    }

    timers.push(
      setTimeout(() => {
        setCountdown(null);
        setPhase('confira');
        playSound('introReveal');
      }, INTRO_MS.confira),
    );

    timers.push(setTimeout(() => setPhase('exit'), INTRO_MS.exit));

    timers.push(
      setTimeout(() => {
        stopSuspenseDrone();
        setPhase('done');
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, INTRO_MS.done),
    );

    return () => {
      timers.forEach(clearTimeout);
      stopSuspenseDrone();
    };
  }, [active, onComplete, reduced]);

  if (!active || phase === 'idle' || phase === 'done') return null;

  const showSuspense = phase === 'suspense';
  const showCopy = phase === 'title' || phase === 'brand';
  const showTitle = phase === 'title' || phase === 'brand';
  const showBrand = phase === 'brand';
  const showMascot = phase === 'mascot' || phase === 'countdown';
  const showCountdown = phase === 'countdown' && countdown !== null;
  const showConfira = phase === 'confira' || phase === 'exit';
  const hideCopyForMascot =
    phase === 'mascot' || phase === 'countdown' || showConfira;

  const progressPct =
    phase === 'backdrop'
      ? 5
      : phase === 'suspense'
        ? 12
        : phase === 'title'
          ? 22
          : phase === 'brand'
            ? 32
            : phase === 'mascot'
              ? 42
              : phase === 'countdown' && countdown !== null
                ? 48 + ((COUNTDOWN_FROM - countdown) / COUNTDOWN_FROM) * 42
                : phase === 'confira'
                  ? 94
                  : 100;

  return (
    <div
      className={`bracket-draw-intro${phase === 'exit' ? ' is-exiting' : ''}${phase === 'countdown' ? ' is-countdown' : ''}${showConfira ? ' is-confira' : ''}${hideCopyForMascot ? ' is-mascot-focus' : ''}${reduced ? ' is-reduced' : ''}`}
      role="presentation"
      aria-live="polite"
    >
      <div className="bracket-draw-intro-backdrop" aria-hidden />
      <div className="bracket-draw-intro-vignette" aria-hidden />
      <div className="bracket-draw-intro-rays" aria-hidden />
      <div className="bracket-draw-intro-scanlines" aria-hidden />

      <div
        className="bracket-draw-intro-progress"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Preparando sorteio"
      >
        <span
          className="bracket-draw-intro-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="bracket-draw-intro-content">
        {showSuspense && (
          <p className="bracket-draw-intro-suspense">
            Em instantes
            <SuspenseDots />
          </p>
        )}

        {showCopy && !hideCopyForMascot && (
          <>
            {showTitle && (
              <p className="bracket-draw-intro-eyebrow">Interunesp · ao vivo</p>
            )}
            {showTitle && (
              <p className="bracket-draw-intro-title">
                <span className="bracket-draw-intro-title-shine" aria-hidden />
                SORTEIO
              </p>
            )}
            {showBrand && (
              <p className="bracket-draw-intro-brand">
                Chaveamento do <span>Inter</span> está prestes a começar
              </p>
            )}
          </>
        )}

        {showMascot && (
          <div className="bracket-draw-intro-mascot-wrap">
            <div
              className="bracket-draw-intro-mascot-glow bracket-draw-intro-mascot-glow--1"
              aria-hidden
            />
            <div
              className="bracket-draw-intro-mascot-glow bracket-draw-intro-mascot-glow--2"
              aria-hidden
            />
            <Image
              src={CHAMINHA_MASCOT}
              alt=""
              width={320}
              height={400}
              className="bracket-draw-intro-mascot"
              priority
            />
          </div>
        )}

        {showCountdown && (
          <p className="bracket-draw-intro-countdown" key={countdown}>
            {countdown}
          </p>
        )}

        {showConfira && (
          <p className="bracket-draw-intro-confira">Confira agora</p>
        )}
      </div>
    </div>
  );
}
