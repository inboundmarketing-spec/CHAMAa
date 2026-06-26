import type { SVGProps } from 'react';

export type KpiIconName =
  | 'live'
  | 'sos'
  | 'instagram'
  | 'bell'
  | 'calendar'
  | 'clock'
  | 'check'
  | 'message'
  | 'stadium'
  | 'user'
  | 'target'
  | 'clipboard'
  | 'chart'
  | 'chevron';

const LABEL_ICON: Record<string, KpiIconName> = {
  'Jogos ao vivo': 'live',
  'Jogos ao vivo (geral)': 'live',
  'Fila SOS': 'sos',
  'Instagram pendente': 'instagram',
  'Opt-in avisos': 'bell',
  'Jogos hoje': 'calendar',
  'Partidas hoje': 'calendar',
  'Encerramentos pendentes': 'clock',
  'Finalizados hoje': 'check',
  'Ajuda em andamento': 'message',
  'Ao vivo na praça': 'stadium',
  'Ao vivo (suas partidas)': 'target',
  'Neutros atribuídos': 'user',
  'Suas solicitações pendentes': 'clipboard',
};

export function kpiIconForLabel(label: string): KpiIconName {
  return LABEL_ICON[label] ?? 'chart';
}

type IconProps = SVGProps<SVGSVGElement> & { name: KpiIconName };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function paths(name: KpiIconName) {
  switch (name) {
    case 'live':
      return (
        <>
          <circle cx="12" cy="12" r="10" {...stroke} />
          <path d="M10 8.5v7l6-3.5-6-3.5z" {...stroke} />
        </>
      );
    case 'sos':
      return (
        <>
          <path d="M12 3v4M12 17v4" {...stroke} />
          <path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8" {...stroke} />
          <path d="M3 12h4M17 12h4" {...stroke} />
          <path d="M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" {...stroke} />
          <circle cx="12" cy="12" r="3" {...stroke} />
        </>
      );
    case 'instagram':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} />
          <circle cx="12" cy="12" r="4" {...stroke} />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </>
      );
    case 'bell':
      return (
        <>
          <path d="M18 16H6l-1.5-2.2A4.5 4.5 0 0 1 8 8.2V6a4 4 0 1 1 8 0v2.2a4.5 4.5 0 0 1 3.5 5.6L18 16z" {...stroke} />
          <path d="M10 19a2 2 0 0 0 4 0" {...stroke} />
        </>
      );
    case 'calendar':
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" {...stroke} />
          <path d="M8 3v4M16 3v4M4 10h16" {...stroke} />
        </>
      );
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <path d="M12 7v5l3 2" {...stroke} />
        </>
      );
    case 'check':
      return (
        <>
          <path d="M9 12l2 2 4-4" {...stroke} />
          <circle cx="12" cy="12" r="9" {...stroke} />
        </>
      );
    case 'message':
      return (
        <>
          <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2z" {...stroke} />
        </>
      );
    case 'stadium':
      return (
        <>
          <path d="M4 10h16v9H4z" {...stroke} />
          <path d="M7 10V7a5 5 0 0 1 10 0v3" {...stroke} />
          <path d="M8 19v2M16 19v2" {...stroke} />
        </>
      );
    case 'user':
      return (
        <>
          <circle cx="12" cy="8" r="3.5" {...stroke} />
          <path d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" {...stroke} />
        </>
      );
    case 'target':
      return (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <circle cx="12" cy="12" r="5" {...stroke} />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" {...stroke} />
          <rect x="9" y="3" width="6" height="4" rx="1" {...stroke} />
          <path d="M9 12h6M9 16h4" {...stroke} />
        </>
      );
    case 'chevron':
      return <path d="M10 8l4 4-4 4" {...stroke} />;
    case 'chart':
    default:
      return (
        <>
          <path d="M5 19V9M12 19V5M19 19v-7" {...stroke} />
        </>
      );
  }
}

export function DashboardKpiIcon({ name, className, ...rest }: IconProps) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      aria-hidden
      {...rest}
    >
      {paths(name)}
    </svg>
  );
}
