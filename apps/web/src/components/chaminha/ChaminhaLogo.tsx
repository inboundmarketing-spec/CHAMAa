'use client';

import Image from 'next/image';
import { INTER_FLAME_ICON } from './paths';

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
  animated?: boolean;
};

/** Ícone de chama (`icon.png`) — marca do painel e sorteio */
export function ChaminhaLogo({
  size = 32,
  className = '',
  priority,
  animated = true,
}: Props) {
  return (
    <span
      className={`inter-flame-icon${animated ? ' inter-flame-icon--animated' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={INTER_FLAME_ICON}
        alt=""
        width={size}
        height={size}
        className="inter-flame-icon-img"
        priority={priority}
      />
      {animated && <span className="inter-flame-icon-glow" aria-hidden />}
    </span>
  );
}
