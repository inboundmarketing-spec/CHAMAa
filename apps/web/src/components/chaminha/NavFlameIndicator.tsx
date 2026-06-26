import Image from 'next/image';
import { INTER_FLAME_ICON } from './paths';

export function NavFlameIndicator() {
  return (
    <span className="nav-flame" aria-hidden>
      <Image
        src={INTER_FLAME_ICON}
        alt=""
        width={14}
        height={18}
        className="nav-flame-img"
      />
    </span>
  );
}
