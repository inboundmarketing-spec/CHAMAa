'use client';

import { useEffect, useState } from 'react';
import {
  elapsedSecondsSince,
  formatElapsedSeconds,
  gamePeriodLabel,
} from '@chama/shared';

export function LiveMatchClock({
  liveStartedAt,
  gamePeriod,
}: {
  liveStartedAt?: string | null;
  gamePeriod?: string | null;
}) {
  const [seconds, setSeconds] = useState<number | null>(() =>
    elapsedSecondsSince(liveStartedAt),
  );

  useEffect(() => {
    setSeconds(elapsedSecondsSince(liveStartedAt));
    if (!liveStartedAt) return;

    const id = setInterval(() => {
      setSeconds(elapsedSecondsSince(liveStartedAt));
    }, 1000);

    return () => clearInterval(id);
  }, [liveStartedAt]);

  const period = gamePeriodLabel(gamePeriod);
  if (seconds == null && !period) return null;

  return (
    <div className="live-match-clock">
      {seconds != null && (
        <span className="live-match-timer" aria-live="polite">
          ⏱ {formatElapsedSeconds(seconds)}
        </span>
      )}
      {period && (
        <span
          className={`live-match-period${gamePeriod === 'interval' ? ' is-interval' : ''}`}
        >
          {period}
        </span>
      )}
    </div>
  );
}
